// emlog — v5: 2-tab layout, accordion recording, recent cards
const { useState, useEffect, useRef, useCallback } = React;

// 気分5段階
const MOODS = [
  { v:1, l:'しんどい', c:'var(--m1)', raw:'#586588', face:'rgba(255,255,255,.82)', mouth:'M8 15.8 Q12 12.2 16 15.8' },
  { v:2, l:'いまいち', c:'var(--m2)', raw:'#76859f', face:'rgba(255,255,255,.76)', mouth:'M8.5 15.2 Q12 13.7 15.5 15.2' },
  { v:3, l:'ふつう',   c:'var(--m3)', raw:'#9a9aa4', face:'rgba(18,18,26,.55)',    mouth:'M8.5 14.8 L15.5 14.8' },
  { v:4, l:'いい',     c:'var(--m4)', raw:'#efb98e', face:'rgba(72,36,12,.62)',    mouth:'M8.5 14.4 Q12 16.6 15.5 14.4' },
  { v:5, l:'最高',     c:'var(--m5)', raw:'#f3aa78', face:'rgba(72,36,12,.64)',    mouth:'M8 13.8 Q12 17.4 16 13.8' },
];
const moodMeta = (v) => MOODS[v-1];

// ---- ミニマルSVGラインアイコン (16x16 viewBox) ----
const svg = (inner) => <svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">{inner}</svg>;
const I = (d) => svg(<path d={d}/>);
const TAG_ICONS = {
  '出勤':   ()=>svg(<><rect x="3" y="5" width="10" height="8" rx="1.5"/><path d="M6 5V3.5h4V5"/><path d="M3 8.5h10"/></>),
  '在宅':   ()=>svg(<><path d="M2 7l6-4.5L14 7"/><path d="M3.5 8v5.5h9V8"/><rect x="6" y="9" width="4" height="2.5" rx=".5"/></>),
  '勉強':   ()=>svg(<><path d="M3 10l5-2.5L13 10l-5 2.5z"/><path d="M13 10v3"/><path d="M5.5 11v2.5c0 .8 5 .8 5 0V11"/></>),
  '早帰り': ()=>svg(<><path d="M2 7l6-4.5L14 7"/><path d="M3.5 8v5.5h9V8"/><path d="M6.5 13.5v-4h3v4"/></>),
  '残業':   ()=>svg(<><circle cx="8" cy="8.5" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></>),
  'ストレス':()=>I('M9 2L3.5 9H7l-1 5 5.5-7.5H8z'),
  '朝活':   ()=>svg(<><path d="M8 2v2"/><path d="M3.5 8.5h9"/><path d="M5 5.5l1.2 1.2M11 5.5l-1.2 1.2"/><path d="M4.5 11c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5"/><path d="M3 13h10"/></>),
  '運動':   ()=>I('M10 2.5a1.3 1.3 0 1 1 0 .01M7 6l2.5-1.5 2 2-2.5 3-2.5 1M9.5 9.5l1.5 4.5M7 6L4.5 9 3 14'),
  'サウナ': ()=>svg(<><path d="M5 2c0 1.2 1.8 2 0 3.5M8 2c0 1.2 1.8 2 0 3.5M11 2c0 1.2 1.8 2 0 3.5"/><rect x="3" y="8" width="10" height="6" rx="2"/></>),
  '早寝':   ()=>I('M13 9a5 5 0 1 1-4.3-6.8A4 4 0 0 0 13 9z'),
  '健康食': ()=>svg(<><path d="M8 5.5c-1.2-2-4-1.6-4.5.6-.5 2.3 1.5 5 4.5 6.4 3-1.4 5-4.1 4.5-6.4C12 3.9 9.2 3.5 8 5.5z"/><path d="M8 5.5V3M8 3c.5-1 1.6-1.2 2.4-1"/></>),
  '寝不足': ()=>svg(<><path d="M9 3h4l-4 3.5h4"/><path d="M3.5 8h3l-3 3h3"/></>),
  '体調':   ()=>svg(<><path d="M9.5 3a2 2 0 0 0-3 0L6 3.6a2 2 0 0 1-3 0 3 3 0 0 0 0 4.2L8 13l5-5.2a3 3 0 0 0 0-4.2 2 2 0 0 1-3 0z"/><path d="M3.5 8h2l1-1.5L8 9.5l1.5-3 1 1.5h2"/></>),
  '疲れ':   ()=>svg(<><circle cx="8" cy="8" r="6"/><path d="M5.5 7.2l1.5.8M10.5 7.2l-1.5.8M6 11c1.2-1 2.8-1 4 0"/></>),
  '創作':   ()=>svg(<><path d="M10.5 2.5l3 3-7.5 7.5H3V10z"/><path d="M9 4l3 3"/></>),
  '読書':   ()=>svg(<><path d="M8 4.3C7 3.6 5.3 3.3 3.3 3.3V11.5c2 0 3.7.3 4.7 1 1-.7 2.7-1 4.7-1V3.3C10.7 3.3 9 3.6 8 4.3z"/><path d="M8 4.3v8.2"/></>),
  'ゲーム': ()=>svg(<><rect x="1.5" y="4.5" width="13" height="7.5" rx="3"/><path d="M5 7v3M3.5 8.5h3M10.5 7.5v.01M12 9.5v.01"/></>),
  'お酒':   ()=>svg(<><path d="M5 2.5h6l-.6 4.2a2.4 2.4 0 0 1-4.8 0z"/><path d="M8 10.7v2.8"/><path d="M5.5 13.5h5"/></>),
  'ガジェ': ()=>svg(<><rect x="4.5" y="2" width="7" height="12" rx="1.5"/><path d="M7 12h2"/></>),
  '買物':   ()=>svg(<><path d="M4 5.5h8l-.6 8H4.6z"/><path d="M6 5.5V4.3a2 2 0 0 1 4 0v1.2"/></>),
  '掃除':   ()=>svg(<><path d="M11 2.5l2.5 2.5-6 6-2.5-2.5z"/><path d="M5 8.5L2.5 13.5 7.5 11"/><path d="M9 4.5l2.5 2.5"/></>),
};
const TagIcon = ({name}) => { const Ic=TAG_ICONS[name]; return Ic ? <Ic/> : null; };

const DEFAULT_TAGS = [
  { name:'出勤',     neg:false, group:'work' },
  { name:'在宅',     neg:false, group:'work' },
  { name:'勉強',     neg:false, group:'work' },
  { name:'早帰り',   neg:false, group:'work' },
  { name:'残業',     neg:true,  group:'work' },
  { name:'ストレス', neg:true,  group:'work' },
  { name:'朝活',     neg:false, group:'health' },
  { name:'運動',     neg:false, group:'health' },
  { name:'サウナ',   neg:false, group:'health' },
  { name:'早寝',     neg:false, group:'health' },
  { name:'健康食',   neg:false, group:'health' },
  { name:'寝不足',   neg:true,  group:'health' },
  { name:'体調',     neg:true,  group:'health' },
  { name:'疲れ',     neg:true,  group:'health' },
  { name:'創作',     neg:false, group:'hobby' },
  { name:'読書',     neg:false, group:'hobby' },
  { name:'ゲーム',   neg:false, group:'hobby' },
  { name:'お酒',     neg:false, group:'hobby' },
  { name:'ガジェ',   neg:false, group:'hobby' },
  { name:'買物',     neg:false, group:'hobby' },
  { name:'掃除',     neg:false, group:'hobby' },
];

const GROUP_LABELS = { work:'仕事', health:'健康', hobby:'趣味' };

const PLACEHOLDERS = [
  'ちゃんと寝た、でもOK', '小さいことでOK',
  '断れた、それも立派なこと', '散歩した、とか',
  '期限を守れた、とか', '自分のために時間を使えた、とか',
];

// ---- date helpers ----
const pad = (n) => String(n).padStart(2,'0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayKey = () => keyOf(new Date());
const DOW = ['日','月','火','水','木','金','土'];
const fmtLong = (d) => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${DOW[d.getDay()]}）`;
const fmtShort = (d) => `${d.getMonth()+1}/${d.getDate()}（${DOW[d.getDay()]}）`;

// ---- storage ----
const RKEY='emlog_proto_records_v1', TKEY='emlog_proto_tags_v5', SKEY='emlog_proto_settings_v1';
const loadRecords = () => { try{return JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){return null} };
const saveRecordsLS = (r) => localStorage.setItem(RKEY, JSON.stringify(r));
const NEG_NAMES = new Set(DEFAULT_TAGS.filter(t=>t.neg).map(t=>t.name));
const GROUP_MAP = Object.fromEntries(DEFAULT_TAGS.map(t=>[t.name,t.group]));
const loadTags = () => {
  try{
    const t=JSON.parse(localStorage.getItem(TKEY)||'null');
    if(!t) return DEFAULT_TAGS.map(x=>({...x}));
    return t.map(x=>{
      if(typeof x==='string') return { name:x, neg:NEG_NAMES.has(x), group:GROUP_MAP[x]||'hobby' };
      if(x&&x.name) {
        let group = x.group || GROUP_MAP[x.name] || 'hobby';
        if(x.time && !x.group) group = x.time==='am'?'health':x.time==='day'?'work':'hobby';
        return { name:x.name, neg:x.neg!=null?!!x.neg:NEG_NAMES.has(x.name), group };
      }
      return null;
    }).filter(Boolean);
  }catch(e){ return DEFAULT_TAGS.map(x=>({...x})); }
};
const saveTagsLS = (t) => localStorage.setItem(TKEY, JSON.stringify(t));
const DEFAULT_SETTINGS = { reminderOn:false, reminderTime:'21:00' };
const loadSettings = () => { try{return {...DEFAULT_SETTINGS,...(JSON.parse(localStorage.getItem(SKEY)||'{}'))}}catch(e){return {...DEFAULT_SETTINGS}} };
const saveSettingsLS = (s) => localStorage.setItem(SKEY, JSON.stringify(s));

// ---- image downscale ----
function fileToThumb(file, maxPx=900, quality=0.72){
  return new Promise((resolve,reject)=>{
    const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{
      let {width:w,height:h}=img;
      if(w>h && w>maxPx){ h=Math.round(h*maxPx/w); w=maxPx; }
      else if(h>=w && h>maxPx){ w=Math.round(w*maxPx/h); h=maxPx; }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg',quality));
    };
    img.onerror=(e)=>{ URL.revokeObjectURL(url); reject(e); };
    img.src=url;
  });
}

// ---- Daylio → emlog tag mapping ----
const DAYLIO_TAG_MAP = {
  '酒を飲む':'お酒', '朝運動':'朝活', '早くに帰宅':'早帰り',
  '運動する':'運動', '風呂':'サウナ', 'ヘルシーなものを食べる':'健康食',
  '趣味':'創作', '買い物':'買物',
  '早寝':'早寝', '読書':'読書', '勉強':'勉強', 'ゲーム':'ゲーム', '掃除':'掃除', '仮眠':'仮眠',
  '疲れた':'疲れ', 'ストレスがある':'ストレス', '眠い':'寝不足', '体調不良':'体調',
  '不安':null, '必死':null, 'わからない':null, '心配':null,
  '満足':null, 'リラックス':null, '嬉しい':null, '悲しい':null,
  'ワクワク':null, '感謝':null, '怒り':null,
};

function parseDaylioCSV(text){
  const t = text.charCodeAt(0)===0xFEFF ? text.slice(1) : text;
  const lines = t.trim().split('\n');
  if(lines.length<2) return null;
  const header = lines[0].toLowerCase();
  if(!header.includes('full_date') && !header.includes('activities')) return null;
  const cols = parseCSVRow(lines[0]);
  const idx = {};
  cols.forEach((c,i)=>{ idx[c.toLowerCase().trim()]=i; });
  const dateCol = idx['full_date'] ?? idx['date'];
  const moodCol = idx['mood'];
  const actCol = idx['activities'];
  const noteCol = idx['note'] ?? idx['note_title'];
  if(dateCol==null || moodCol==null) return null;
  const MOOD_MAP = {'rad':5,'amazing':5,'すごく良い':5,'最高':5,'good':4,'良い':4,'いい':4,'meh':3,'okay':3,'普通':3,'ふつう':3,'bad':2,'悪い':2,'いまいち':2,'awful':1,'terrible':1,'すごく悪い':1,'しんどい':1,'最低':1};
  const data = {};
  for(let i=1;i<lines.length;i++){
    const row = parseCSVRow(lines[i]);
    if(!row || row.length<3) continue;
    let dateStr = (row[dateCol]||'').trim();
    const dateMatch = dateStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if(!dateMatch) continue;
    dateStr = `${dateMatch[1]}-${pad(parseInt(dateMatch[2]))}-${pad(parseInt(dateMatch[3]))}`;
    if(!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
    const moodRaw = (row[moodCol]||'').trim().toLowerCase();
    let mood = MOOD_MAP[moodRaw];
    if(!mood){ const n=parseInt(moodRaw); mood=(n>=1&&n<=5)?n:3; }
    const rawActs = actCol!=null && row[actCol] ? row[actCol].split(/[|]/).map(s=>s.trim()).filter(Boolean) : [];
    const tags = rawActs.map(a => DAYLIO_TAG_MAP.hasOwnProperty(a) ? DAYLIO_TAG_MAP[a] : a).filter(Boolean);
    const note = noteCol!=null ? (row[noteCol]||'').replace(/<br\s*\/?>/gi,'\n').trim() : '';
    data[dateStr] = { mood, tags:[...new Set(tags)], goodThings:note, why:'', photo:'', updatedAt: new Date(dateStr+'T00:00:00').toISOString() };
  }
  return Object.keys(data).length>0 ? data : null;
}

function parseCSVRow(line){
  const result=[]; let cur=''; let inQ=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(inQ){ if(c==='"' && line[i+1]==='"'){ cur+='"'; i++; } else if(c==='"') inQ=false; else cur+=c; }
    else { if(c==='"') inQ=true; else if(c===','){ result.push(cur); cur=''; } else cur+=c; }
  }
  result.push(cur);
  return result;
}

// ---- seed sample data ----
function seedData(){
  const recs = {}; const today = new Date();
  const notes = ['朝のうちに散歩できた。','ちゃんと三食食べられた。','早めに寝る準備ができた。','読みたかった本を少し進めた。','','',''];
  const tagSets = [['運動','読書'],['勉強'],['早寝','サウナ'],['創作','ゲーム'],['お酒'],['残業','ストレス'],['疲れ'],[]];
  for(let i=1;i<=52;i++){
    if(Math.random()<0.22) continue;
    const d=new Date(today); d.setDate(d.getDate()-i);
    const r=Math.random();
    const mood = r<0.08?1 : r<0.24?2 : r<0.55?3 : r<0.85?4 : 5;
    recs[keyOf(d)] = { mood, tags: tagSets[Math.floor(Math.random()*tagSets.length)],
      goodThings: notes[Math.floor(Math.random()*notes.length)], why:'', photo:'', updatedAt:d.toISOString() };
  }
  return recs;
}

// ---- MoodFace component ----
function MoodFace({ v, size=22, color }){
  const m = moodMeta(v);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display:'block',color: color||m.face}}>
      <circle cx="8.8" cy="9.6" r="1.15" fill="currentColor"/>
      <circle cx="15.2" cy="9.6" r="1.15" fill="currentColor"/>
      <path d={m.mouth} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function MoodSelector({ value, onPick, showLabels=true }){
  return (
    <div className={'moods' + (value?' has':'')}>
      {MOODS.map(m => (
        <button key={m.v} className={'mood'+(value===m.v?' sel':'')} onClick={()=>onPick(m.v)}>
          <span className="dot" style={{background:m.c}}><MoodFace v={m.v} size={value===m.v?38:22}/></span>
          {showLabels && <span className="mw">{m.l}</span>}
        </button>
      ))}
    </div>
  );
}

const buzz = (ms=22) => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </svg>
);

// ============ ANALYSIS (placeholder — Phase 2 will rebuild) ============
function AnalysisScreen({ records }){
  const keys=Object.keys(records); const total=keys.length;
  let sum=0; keys.forEach(k=>sum+=records[k].mood);
  const avg = total? (sum/total).toFixed(1):'—';

  const tagMoods = {};
  keys.forEach(k=>{ const r=records[k]; (r.tags||[]).forEach(t=>{ if(!tagMoods[t]) tagMoods[t]=[]; tagMoods[t].push(r.mood); }); });
  const withoutTag = (tag) => { const moods=[]; keys.forEach(k=>{ const r=records[k]; if(!(r.tags||[]).includes(tag)) moods.push(r.mood); }); return moods; };

  const rankings = Object.entries(tagMoods)
    .filter(([_,m])=>m.length>=2)
    .map(([tag,m])=>{
      const yesAvg = m.reduce((a,b)=>a+b,0)/m.length;
      const noMoods = withoutTag(tag);
      const noAvg = noMoods.length? noMoods.reduce((a,b)=>a+b,0)/noMoods.length : 0;
      const delta = yesAvg - noAvg;
      return { tag, count:m.length, yesAvg, noAvg, delta };
    })
    .sort((a,b)=>b.delta-a.delta);

  return (
    <div className="scroll">
      <div className="log-head"><span className="log-date">分析</span></div>

      <div className="sec">
        <div className="lbl">行動 × 気分ランキング</div>
        <div className="corr-hint">やった日 vs やってない日の平均気分の差</div>
        {rankings.length>0 ? (
          <div className="corr-list">
            {rankings.map(c=>{
              const isPos = c.delta >= 0;
              const maxD = Math.max(0.1,...rankings.map(r=>Math.abs(r.delta)));
              const pct = (Math.abs(c.delta)/maxD)*50;
              const barColor = isPos ? 'var(--ac)' : 'var(--m2)';
              const dim = c.count < 5;
              return (
                <div key={c.tag} className={'corr-row'+(dim?' dim':'')}>
                  <span className="corr-tag"><TagIcon name={c.tag}/>{c.tag}</span>
                  <span className="corr-n">{c.count}日</span>
                  <span className="corr-bar-wrap">
                    <span className="corr-center"></span>
                    <span className={'corr-bar '+(isPos?'pos':'neg')} style={{width:pct+'%',background:barColor}}></span>
                  </span>
                  <span className={'corr-delta'+(isPos?' pos':' neg')}>
                    {isPos?'+':''}{c.delta.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : <div className="empty-note">まだデータが足りません。</div>}
      </div>

      <div className="sec">
        <div className="lbl">概要</div>
        <div className="tiles">
          <div className="tile"><div className="v">{total}<small> 日</small></div><div className="t">記録日数</div></div>
          <div className="tile"><div className="v">{avg}</div><div className="t">平均きぶん</div></div>
        </div>
      </div>
    </div>
  );
}

// ============ DAY SHEET ============
function DaySheet({ dayKey, records, tags=[], onSave, onDelete, onClose }){
  const existing = dayKey ? records[dayKey] : null;
  const [mood,setMood]=useState(existing?existing.mood:null);
  const [note,setNote]=useState(existing?existing.goodThings||'':'');
  useEffect(()=>{ const e=dayKey?records[dayKey]:null; setMood(e?e.mood:null); setNote(e?e.goodThings||'':''); },[dayKey]);
  if(!dayKey) return null;
  const d=new Date(dayKey+'T00:00:00');
  const negSet=new Set(tags.filter(t=>t.neg).map(t=>t.name));

  if(existing){
    const m=moodMeta(existing.mood);
    return (
      <>
        <div className="grab"></div>
        <div className="sheet-date">{fmtLong(d)}</div>
        <div className="mood-pill" style={{background:m.raw}}>
          <span className="mp-face"><MoodFace v={existing.mood} size={18}/></span>{m.l}
        </div>
        {existing.tags&&existing.tags.length>0 &&
          <div className="d-sec"><div className="d-lbl">やったこと</div>
            <div className="d-tags">{existing.tags.map(t=><span key={t} className={'d-tag'+(negSet.has(t)?' neg':'')}><TagIcon name={t}/>{t}</span>)}</div>
          </div>}
        {existing.goodThings &&
          <div className="d-sec"><div className="d-lbl">メモ</div><div className="d-text">{existing.goodThings}</div></div>}
        {existing.photo &&
          <div className="d-sec"><div className="d-lbl">Photo</div><div className="d-photo"><img src={existing.photo} alt=""/></div></div>}
        <button className="del-btn" onClick={()=>onDelete(dayKey)}>この記録を削除</button>
      </>
    );
  }
  return (
    <>
      <div className="grab"></div>
      <div className="sheet-date">{fmtLong(d)}</div>
      <div className="d-lbl" style={{marginTop:6}}>Mood</div>
      <MoodSelector value={mood} onPick={(v)=>{setMood(v);buzz();}}/>
      <div className="d-lbl" style={{marginTop:22}}>メモ <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
      <div className="card ta-card"><textarea className="ta" value={note} placeholder="小さいことでOK" onChange={e=>setNote(e.target.value)} rows={2}/></div>
      <button className="primary" disabled={!mood} onClick={()=>onSave(dayKey,{mood,tags:[],goodThings:note.trim(),why:'',photo:''})}>保存する</button>
    </>
  );
}

// ============ TAG MANAGER SHEET ============
function TagManagerSheet({ tags, onChange, onClose }){
  const [list,setList]=useState(tags.map(t=>({...t})));
  const [nn,setNn]=useState('');
  const [ngroup,setNgroup]=useState('hobby');
  const upd=(i,f,v)=>{ setList(list.map((t,j)=>j===i?{...t,[f]:v}:t)); };
  const del=(i)=>setList(list.filter((_,j)=>j!==i));
  const add=()=>{
    const v=nn.trim(); if(!v||list.some(t=>t.name===v))return;
    setList([...list,{name:v,neg:false,group:ngroup}]); setNn('');
  };
  const commit=()=>{ onChange(list.filter(t=>t.name.trim()).map(t=>({name:t.name.trim(),neg:!!t.neg,group:t.group||'hobby'}))); onClose(); };
  const renderGroup=(group,label)=>{
    const items=list.map((t,i)=>({...t,i})).filter(t=>t.group===group);
    if(!items.length) return null;
    return (
      <div key={group} style={{marginBottom:16}}>
        <div className="grp-lbl" style={{color:'var(--dim)'}}>{label}</div>
        {items.map(t=>(
          <div key={t.i} className="tm-row">
            <span className="tm-ic-wrap"><TagIcon name={t.name}/></span>
            <input className="tm-nm" value={t.name} onChange={e=>upd(t.i,'name',e.target.value)}/>
            <button className={'tm-neg'+(t.neg?' on':'')} onClick={()=>upd(t.i,'neg',!t.neg)}>{t.neg?'−':'＋'}</button>
            <button className="tm-del" onClick={()=>del(t.i)}>×</button>
          </div>
        ))}
      </div>
    );
  };
  return (
    <>
      <div className="grab"></div>
      <div className="sheet-date">やったこと・できごとを編集</div>
      {renderGroup('work','仕事')}
      {renderGroup('health','健康')}
      {renderGroup('hobby','趣味')}
      <div className="tm-add">
        <input className="tm-nm" value={nn} placeholder="新しい項目" onChange={e=>setNn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <select className="tm-grp" value={ngroup} onChange={e=>setNgroup(e.target.value)}>
          <option value="work">仕事</option><option value="health">健康</option><option value="hobby">趣味</option>
        </select>
        <button className="primary" onClick={add}>追加</button>
      </div>
      <button className="primary" style={{marginTop:18}} onClick={commit}>保存して閉じる</button>
    </>
  );
}

// ============ SETTINGS SHEET (now includes Export/Import) ============
function SettingsSheet({ settings, records, onChange, onImport, onClose }){
  const [s,setS]=useState({...settings});
  const [permNote,setPermNote]=useState('');
  const fileRef = useRef(null);
  const toggleReminder=async()=>{
    const next=!s.reminderOn;
    if(next && 'Notification' in window){
      let perm=Notification.permission;
      if(perm==='default') perm=await Notification.requestPermission();
      if(perm!=='granted') setPermNote('通知が許可されていません。');
      else setPermNote('');
    }
    setS({...s,reminderOn:next});
  };
  const commit=()=>{ onChange(s); onClose(); };

  const download=(name,text,type)=>{
    const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const toJson=()=>download('emlog-backup.json',JSON.stringify(records,null,2),'application/json');
  const toCsv=()=>{
    const ks=Object.keys(records).sort();
    let csv='date,mood,mood_label,tags,good_things\n';
    ks.forEach(k=>{ const r=records[k]; const m=moodMeta(r.mood);
      const esc=(x)=>`"${String(x||'').replace(/"/g,'""')}"`;
      csv+=[k,r.mood,m.l,(r.tags||[]).join('|'),r.goodThings||''].map(esc).join(',')+'\n';
    });
    download('emlog.csv',csv,'text/csv');
  };
  const handleImport=async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    try{
      const text=await f.text(); let data;
      if(f.name.endsWith('.json')) data=JSON.parse(text);
      else if(f.name.endsWith('.csv')){
        data = parseDaylioCSV(text);
        if(!data){
          const lines=text.trim().split('\n'); data={};
          for(let i=1;i<lines.length;i++){
            const cols=parseCSVRow(lines[i]); if(!cols||cols.length<3) continue;
            const [date,mood,,tags,good]=cols;
            const cd=(date||'').replace(/^"|"$/g,'').trim();
            if(!cd.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
            data[cd]={ mood:parseInt((mood||'').replace(/"/g,''))||3,
              tags:tags?tags.replace(/^"|"$/g,'').split('|').filter(Boolean):[],
              goodThings:(good||'').replace(/^"|"$/g,'').replace(/""/g,'"')||'', why:'', photo:'', updatedAt:new Date().toISOString() };
          }
        }
      } else { alert('JSON または CSV ファイルを選んでください'); return; }
      if(data && typeof data==='object'){
        const count=Object.keys(data).length;
        if(!count){ alert('データが見つかりませんでした。'); return; }
        if(confirm(`${count}件をインポートしますか？`)) onImport(data);
      }
    }catch(err){ alert('読み込めませんでした: '+err.message); }
    e.target.value='';
  };

  return (
    <>
      <div className="grab"></div>
      <div className="sheet-date">設定</div>

      <div className="set-row">
        <div><div className="st">夜のリマインド</div>
          <div className="sd">アプリを開いている間だけ有効</div></div>
        <button className={'sw'+(s.reminderOn?' on':'')} onClick={toggleReminder}></button>
      </div>
      {s.reminderOn &&
        <div className="set-row">
          <div className="st">通知する時刻</div>
          <input className="time-input" type="time" value={s.reminderTime} onChange={e=>setS({...s,reminderTime:e.target.value})}/>
        </div>}
      {permNote && <div className="empty-note" style={{color:'var(--danger)'}}>{permNote}</div>}

      <div className="set-divider"></div>
      <div className="set-row" style={{borderBottom:'none'}}>
        <div><div className="st">データ</div></div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <button className="set-btn" onClick={toJson}>JSON 書き出し</button>
        <button className="set-btn" onClick={toCsv}>CSV 書き出し</button>
      </div>
      <button className="set-btn full" onClick={()=>fileRef.current&&fileRef.current.click()}>
        インポート（JSON / CSV / Daylio）
      </button>
      <input ref={fileRef} type="file" accept=".json,.csv" style={{display:'none'}} onChange={handleImport}/>

      <button className="primary" style={{marginTop:24}} onClick={commit}>閉じる</button>
    </>
  );
}


// ============ ROOT APP ============
const TABS = [
  { id:'home', label:'Home', ic:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9.5l9-7 9 7"/><path d="M5 8v10.5a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V8"/></svg>) },
  { id:'analysis', label:'分析', ic:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.5l4.5-4.5 4 4 7.5-7"/></svg>) },
];

function App(){
  const [records,setRecords] = useState(()=>{ const r=loadRecords(); if(r) return r; const s=seedData(); saveRecordsLS(s); return s; });
  const [tags,setTags] = useState(()=>loadTags());
  const [settings,setSettings] = useState(()=>loadSettings());
  const [screen,setScreen] = useState('home');
  const [sheet,setSheet] = useState(null);
  const [toast,setToast] = useState(null);
  const toastT = useRef(null);
  const remT = useRef(null);

  useEffect(()=>saveRecordsLS(records),[records]);
  useEffect(()=>saveTagsLS(tags),[tags]);
  useEffect(()=>saveSettingsLS(settings),[settings]);

  useEffect(()=>{
    clearTimeout(remT.current);
    if(!settings.reminderOn || !('Notification' in window) || Notification.permission!=='granted') return;
    const schedule=()=>{
      const [hh,mm]=(settings.reminderTime||'21:00').split(':').map(Number);
      const now=new Date(); const t=new Date(now);
      t.setHours(hh,mm,0,0);
      if(t<=now) t.setDate(t.getDate()+1);
      const delay=Math.min(t-now, 2147483647);
      remT.current=setTimeout(()=>{
        if(!records[todayKey()]){ try{ new Notification('emlog', {body:'今日の気分、まだ残してないよ。'}); }catch(e){} }
        schedule();
      }, delay);
    };
    schedule();
    return ()=>clearTimeout(remT.current);
  },[settings,records]);

  const flash = useCallback((msg='保存しました')=>{ setToast(msg); clearTimeout(toastT.current); toastT.current=setTimeout(()=>setToast(null),1400); },[]);
  const saveDay = useCallback((key,data)=>{
    setRecords(prev=>({...prev,[key]:{...data,updatedAt:new Date().toISOString()}}));
    flash();
  },[flash]);
  const deleteDay = useCallback((key)=>{
    setRecords(prev=>{ const n={...prev}; delete n[key]; return n; });
    setSheet(null);
  },[]);
  const importRecords = useCallback((data)=>{
    setRecords(prev=>{
      const merged={...prev};
      Object.entries(data).forEach(([k,v])=>{ merged[k]={...v,updatedAt:v.updatedAt||new Date().toISOString()}; });
      return merged;
    });
    flash(`${Object.keys(data).length}件をインポートしました`);
  },[flash]);

  const go = (id)=>{ if(id!==screen){ setScreen(id); buzz(14);} };

  return (
    <div className="device">
      <div className="aura"></div><div className="aura b"></div>
      {toast && <div className="toast show">{toast}</div>}

      <div className="screen enter" key={screen}>
        {screen==='home' && <HomeScreen records={records} tags={tags} onSaveToday={saveDay}
            onOpenDay={(k)=>setSheet({type:'day',dayKey:k})} onManageTags={()=>setSheet({type:'tags'})}/>}
        {screen==='analysis' && <AnalysisScreen records={records}/>}
      </div>

      <nav className="nav">
        {TABS.map(t=>(
          <button key={t.id} className={'tab'+(screen===t.id?' on':'')} onClick={()=>go(t.id)} title={t.label}>
            <span className="ic">{t.ic}</span>
            <span className="tl">{t.label}</span>
          </button>
        ))}
        <button className="tab tab-set" onClick={()=>{setSheet({type:'settings'}); buzz(14);}} title="設定">
          <span className="ic"><GearIcon/></span>
        </button>
      </nav>

      <div className={'overlay'+(sheet?' show':'')} onClick={(e)=>{ if(e.target.classList.contains('overlay')) setSheet(null); }}>
        <div className="sheet">
          {sheet && sheet.type==='day' &&
            <DaySheet dayKey={sheet.dayKey} records={records} tags={tags}
                   onSave={(k,d)=>{ saveDay(k,d); setSheet(null); }} onDelete={deleteDay} onClose={()=>setSheet(null)}/>}
          {sheet && sheet.type==='tags' &&
            <TagManagerSheet tags={tags} onChange={setTags} onClose={()=>setSheet(null)}/>}
          {sheet && sheet.type==='settings' &&
            <SettingsSheet settings={settings} records={records} onChange={setSettings} onImport={importRecords} onClose={()=>setSheet(null)}/>}
        </div>
      </div>
    </div>
  );
}

// ============ HOME SCREEN ============
function HomeScreen({ records, tags, onSaveToday, onOpenDay, onManageTags }){
  const tk = todayKey();
  const cur = records[tk] || null;
  const [mood,setMood] = useState(cur?cur.mood:null);
  const [sel,setSel] = useState(()=>new Set(cur?cur.tags:[]));
  const [good,setGood] = useState(cur?cur.goodThings||'':'');
  const [ph] = useState(()=>PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)]);
  const [dirty,setDirty] = useState(false);
  const now = new Date();

  const toggle=(name)=>{ const n=new Set(sel); n.has(name)?n.delete(name):n.add(name); setSel(n); setDirty(true); };
  const pickMood=(v)=>{ setMood(v); buzz(); setDirty(true); };
  const save=()=>{
    if(!mood) return;
    onSaveToday(tk,{mood,tags:[...sel],goodThings:good.trim(),why:'',photo:''});
    setDirty(false);
  };

  const renderTagGroup = (group, label) => {
    const items = tags.filter(t=>t.group===group);
    if(!items.length) return null;
    return (
      <>
        <div className="time-lbl">{label}</div>
        <div className="chips">
          {items.map(t=>(
            <button key={t.name} className={'chip'+(t.neg?' neg':'')+(sel.has(t.name)?' on':'')} onClick={()=>toggle(t.name)}>
              <TagIcon name={t.name}/>{t.name}
            </button>
          ))}
        </div>
      </>
    );
  };

  // recent records (last 5 with data, excluding today)
  const recentKeys = Object.keys(records)
    .filter(k => k !== tk)
    .sort((a,b) => b.localeCompare(a))
    .slice(0, 5);

  const negSet = new Set(tags.filter(t=>t.neg).map(t=>t.name));

  return (
    <div className="scroll">
      <div className="log-head">
        <span className="log-date">{now.getMonth()+1}月{now.getDate()}日（{DOW[now.getDay()]}）</span>
      </div>

      <div className="sec">
        <MoodSelector value={mood} onPick={pickMood}/>
      </div>

      <div className={'acc'+(mood?' open':'')}>
        <div className="sec">
          <div className="lbl">やったこと <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
          {renderTagGroup('work','仕事')}
          {renderTagGroup('health','健康')}
          {renderTagGroup('hobby','趣味')}
          <div className="chips" style={{marginTop:10}}>
            <button className="chip ghost" onClick={onManageTags}>＋ 編集</button>
          </div>
        </div>

        <div className="sec">
          <div className="lbl">メモ <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
          <div className="card">
            <textarea className="ta" value={good} placeholder={ph} onChange={e=>{setGood(e.target.value);setDirty(true);}} rows={2}/>
          </div>
        </div>

        <button className={'save-btn'+(dirty?' pulse':'')} onClick={save}>
          {dirty ? '保存する' : (cur ? '保存済み ✓' : '保存する')}
        </button>
      </div>

      {recentKeys.length>0 && (
        <div className="sec" style={{marginTop:mood?8:20}}>
          <div className="lbl">最近の記録</div>
          <div className="rec-list">
            {recentKeys.map(k=>{
              const r=records[k]; const d=new Date(k+'T00:00:00'); const m=moodMeta(r.mood);
              const tagList = (r.tags||[]).slice(0,4);
              return (
                <div key={k} className="rec-card" onClick={()=>onOpenDay(k)}>
                  <div className="rec-head">
                    <span className="rec-date">{fmtShort(d)}</span>
                    <span className="rec-mood" style={{background:m.raw}}><MoodFace v={r.mood} size={14}/></span>
                  </div>
                  {tagList.length>0 && (
                    <div className="rec-tags">
                      {tagList.map(t=><span key={t} className={'rec-tag'+(negSet.has(t)?' neg':'')}>{t}</span>)}
                      {(r.tags||[]).length>4 && <span className="rec-tag more">+{(r.tags||[]).length-4}</span>}
                    </div>
                  )}
                  {r.goodThings && <div className="rec-note">{r.goodThings}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
