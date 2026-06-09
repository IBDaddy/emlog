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
const RKEY='emlog_proto_records_v1', TKEY='emlog_proto_tags_v5', SKEY='emlog_proto_settings_v1', XKEY='emlog_proto_lastexport_v1';

// ---- Web Push (サーバー通知) ----
const VAPID_PUBLIC_KEY='BHHJ6cEpxJe9IfMeaEg17K5eT6NjXRFBj1vrpO_FsbzxXCFJce7sit6LUWTfSLHKAd1Nb-vEfvbj9qaL4GtuwsE';
const urlB64ToU8=(s)=>{const p='='.repeat((4-s.length%4)%4);const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0));};
// 今日の記録が済んだことを Service Worker に伝えるフラグ(プッシュ受信時の通知抑制に使う)
const markRecordedToday=(key)=>{ try{ caches.open('emlog-flags').then(c=>c.put('./last-recorded', new Response(key))); }catch(e){} };
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
const DEFAULT_SETTINGS = { reminderOn:false, reminderTime:'21:00', theme:'dark', hiddenSections:[] };
const ANALYSIS_SECTIONS = [
  { id:'chart', label:'気分の波' },
  { id:'corr', label:'行動 × 気分' },
  { id:'dist', label:'気分の分布' },
  { id:'weekday', label:'曜日べつ平均' },
  { id:'stability', label:'安定度' },
  { id:'calendar', label:'カレンダー' },
  { id:'summary', label:'概要' },
];
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
  const lines = t.trim().replace(/\r\n?/g,'\n').split('\n');
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
    if(data[dateStr]) continue;
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

// ============ PERIOD FILTER ============
const PERIODS = [
  { id:'1w', label:'1W', days:7 },
  { id:'1m', label:'1M', days:30 },
  { id:'3m', label:'3M', days:90 },
  { id:'6m', label:'6M', days:180 },
  { id:'all', label:'ALL', days:0 },
];

function PeriodFilter({ value, onChange }){
  return (
    <div className="pf">
      {PERIODS.map(p=>(
        <button key={p.id} className={'pf-btn'+(value===p.id?' on':'')} onClick={()=>onChange(p.id)}>{p.label}</button>
      ))}
    </div>
  );
}

function filterByPeriod(records, periodId){
  const p = PERIODS.find(x=>x.id===periodId);
  if(!p || p.days===0) return records;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate()-p.days);
  const cutKey = keyOf(cutoff);
  const out = {};
  Object.keys(records).forEach(k=>{ if(k>=cutKey) out[k]=records[k]; });
  return out;
}

// ============ MOOD LINE CHART (SVG) ============
function downsampleWeekly(records, keys){
  const buckets = {};
  keys.forEach(k=>{
    const d = new Date(k+'T00:00:00');
    const mon = new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7));
    const wk = keyOf(mon);
    if(!buckets[wk]) buckets[wk]={moods:[],tags:new Set()};
    buckets[wk].moods.push(records[k].mood);
    (records[k].tags||[]).forEach(t=>buckets[wk].tags.add(t));
  });
  return Object.keys(buckets).sort().map(wk=>{
    const b=buckets[wk];
    const avg=b.moods.reduce((a,c)=>a+c,0)/b.moods.length;
    return { key:wk, mood:Math.round(avg), moodRaw:avg, tags:[...b.tags] };
  });
}

function MoodChart({ records }){
  const allKeys = Object.keys(records).sort();
  if(allKeys.length<2) return <div className="empty-note">チャートには2日分以上のデータが必要です。</div>;

  const useWeekly = allKeys.length > 60;
  const label = useWeekly ? '週平均で表示' : null;

  const dataPoints = useWeekly
    ? downsampleWeekly(records, allKeys)
    : allKeys.map(k=>({ key:k, mood:records[k].mood, moodRaw:records[k].mood, tags:records[k].tags||[] }));

  const W=334, H=140, PX=0, PY=18, PB=30;
  const chartW=W-PX*2, chartH=H-PY-PB;
  const step = dataPoints.length>1 ? chartW/(dataPoints.length-1) : 0;

  const pts = dataPoints.map((d,i)=>{
    const x = PX + i*step;
    const y = PY + chartH - ((d.moodRaw-1)/4)*chartH;
    return { x, y, mood:d.mood, key:d.key, tags:d.tags };
  });

  const allTags = new Set();
  dataPoints.forEach(d=>d.tags.forEach(t=>allTags.add(t)));
  const topTags = [...allTags].slice(0, useWeekly?4:6);

  const pathD = pts.map((p,i)=>(i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');

  const gradId = 'mcg';
  const yLabels = [
    { v:5, label:'最高' },
    { v:3, label:'ふつう' },
    { v:1, label:'しんどい' },
  ];

  const dotR = useWeekly ? 2.5 : 3;

  return (
    <div className="chart-wrap">
      {label && <div className="chart-mode">{label}</div>}
      <svg viewBox={`0 0 ${W} ${H + topTags.length*14}`} className="chart-svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ac)" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="var(--ac)" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {yLabels.map(yl=>{
          const y = PY + chartH - ((yl.v-1)/4)*chartH;
          return <g key={yl.v}>
            <line x1={PX} x2={W} y1={y} y2={y} stroke="var(--glass-line)" strokeWidth="0.8"/>
            <text x={W-2} y={y-4} textAnchor="end" className="chart-ylabel">{yl.label}</text>
          </g>;
        })}

        <path d={pathD + `L${pts[pts.length-1].x},${PY+chartH}L${pts[0].x},${PY+chartH}Z`} fill={`url(#${gradId})`}/>
        <path d={pathD} fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>

        {pts.map((p,i)=>{
          const m=moodMeta(p.mood);
          return <circle key={i} cx={p.x} cy={p.y} r={dotR} fill={m.raw} stroke="var(--bg)" strokeWidth="1.5"/>;
        })}

        {topTags.map((tag,ti)=>{
          const rowY = H + ti*14;
          return <g key={tag}>
            <text x={PX} y={rowY+9} className="chart-tag-label">{tag}</text>
            {pts.map((p,pi)=>{
              if(!p.tags.includes(tag)) return null;
              return <circle key={pi} cx={p.x} cy={rowY+5} r={2} fill="var(--ac)" opacity="0.6"/>;
            })}
          </g>;
        })}
      </svg>
    </div>
  );
}

// ============ MOOD DISTRIBUTION ============
function MoodDistribution({ records }){
  const counts = [0,0,0,0,0];
  const keys = Object.keys(records);
  keys.forEach(k=>{ const m=records[k].mood; if(m>=1&&m<=5) counts[m-1]++; });
  const max = Math.max(1,...counts);
  return (
    <div>
      {MOODS.map((m,i)=>(
        <div key={m.v} className="dist-row">
          <div className="dist-face" style={{background:m.raw}}><MoodFace v={m.v} size={16}/></div>
          <span className="dist-name">{m.l}</span>
          <div className="bar-wrap"><div className="bar" style={{width:(counts[i]/max*100)+'%',background:m.raw}}/></div>
          <span className="dist-n">{counts[i]}</span>
        </div>
      )).reverse()}
    </div>
  );
}

// ============ WEEKDAY BARS ============
function WeekdayBars({ records }){
  const sums = [0,0,0,0,0,0,0];
  const cnts = [0,0,0,0,0,0,0];
  Object.keys(records).forEach(k=>{
    const d = new Date(k+'T00:00:00');
    const dow = d.getDay();
    sums[dow] += records[k].mood;
    cnts[dow]++;
  });
  const avgs = sums.map((s,i)=>cnts[i]?s/cnts[i]:0);
  const max = Math.max(5,...avgs);
  const W=334, H=120, barW=30, gap=(W-barW*7)/8;
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
        {DOW.map((_,i)=>{
          const x = gap + i*(barW+gap);
          const h = avgs[i]/max*(H-30);
          const y = H-20-h;
          const m = avgs[i]>0 ? moodMeta(Math.round(avgs[i])) : null;
          const color = m ? m.raw : 'var(--glass-2)';
          return <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={6} fill={color} opacity={avgs[i]?0.85:0.2}/>
            <text x={x+barW/2} y={H-4} textAnchor="middle" className="chart-ylabel">{DOW[i]}</text>
            {avgs[i]>0 && <text x={x+barW/2} y={y-5} textAnchor="middle" className="chart-ylabel" style={{fill:'var(--dim)'}}>{avgs[i].toFixed(1)}</text>}
          </g>;
        })}
      </svg>
    </div>
  );
}

// ============ STABILITY (monthly avg + variance) ============
function StabilityView({ records }){
  const months = {};
  Object.keys(records).sort().forEach(k=>{
    const mk = k.slice(0,7);
    if(!months[mk]) months[mk]=[];
    months[mk].push(records[k].mood);
  });
  const mks = Object.keys(months).sort().slice(-6);
  if(mks.length<1) return <div className="empty-note">まだデータがありません。</div>;

  const stats = mks.map(mk=>{
    const m=months[mk];
    const avg=m.reduce((a,b)=>a+b,0)/m.length;
    const variance=m.reduce((a,b)=>a+(b-avg)**2,0)/m.length;
    const sd=Math.sqrt(variance);
    return { month:mk, avg, sd, count:m.length };
  });

  const W=334, H=110, PX=6, PY=18, PB=24;
  const chartW=W-PX*2, chartH=H-PY-PB;
  const step = stats.length>1 ? chartW/(stats.length-1) : chartW/2;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
        {[1,3,5].map(v=>{
          const y = PY + chartH - ((v-1)/4)*chartH;
          return <line key={v} x1={PX} x2={W-PX} y1={y} y2={y} stroke="var(--glass-line)" strokeWidth="0.5"/>;
        })}
        {stats.map((s,i)=>{
          const x = PX + (stats.length>1 ? i*step : step);
          const yAvg = PY + chartH - ((s.avg-1)/4)*chartH;
          const sdPx = (s.sd/4)*chartH;
          const label = s.month.slice(5)+'月';
          return <g key={s.month}>
            <line x1={x} x2={x} y1={yAvg-sdPx} y2={yAvg+sdPx} stroke="var(--ac)" strokeWidth="3" opacity="0.25" strokeLinecap="round"/>
            <circle cx={x} cy={yAvg} r={4} fill="var(--ac)" stroke="var(--bg)" strokeWidth="1.5"/>
            <text x={x} y={H-4} textAnchor="middle" className="chart-ylabel">{label}</text>
          </g>;
        })}
      </svg>
      <div className="stab-legend">
        <span className="stab-dot"/>平均値
        <span className="stab-bar"/>ばらつき（±SD）
      </div>
    </div>
  );
}

// ============ CALENDAR HEATMAP ============
function CalendarHeatmap({ records }){
  const [offset,setOffset] = useState(0);
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth()-offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const todayK = todayKey();

  const cells = [];
  for(let i=0;i<firstDow;i++) cells.push({empty:true});
  for(let d=1;d<=daysInMonth;d++){
    const k = `${year}-${pad(month+1)}-${pad(d)}`;
    const r = records[k];
    const future = k > todayK;
    cells.push({ day:d, key:k, mood:r?r.mood:0, future, today:k===todayK });
  }

  return (
    <div>
      <div className="cal-nav">
        <button onClick={()=>setOffset(o=>o+1)}>‹</button>
        <span className="cal-label">{month+1}月<span className="yr">{year}</span></span>
        <button onClick={()=>setOffset(o=>Math.max(0,o-1))} disabled={offset===0}>›</button>
      </div>
      <div className="hm-grid">
        {DOW.map(d=><div key={d} className="hm-dow">{d}</div>)}
        {cells.map((c,i)=>{
          if(c.empty) return <div key={'e'+i} className="hm-cell empty"/>;
          if(c.future) return <div key={c.key} className="hm-cell future"><span className="hm-d">{c.day}</span></div>;
          const m = c.mood ? moodMeta(c.mood) : null;
          const bg = m ? m.raw : 'var(--glass-2)';
          const textColor = m ? (c.mood>=3?'rgba(26,18,8,.8)':'rgba(255,255,255,.8)') : 'var(--dimmer)';
          return (
            <div key={c.key} className={'hm-cell'+(c.today?' today':'')} style={{background:bg}}>
              <span className="hm-d" style={{color:textColor}}>{c.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ ANALYSIS SCREEN (Phase 2+3) ============
function AnalysisScreen({ records, tags=[], hiddenSections=[], onOpenDay }){
  const show = (id) => !hiddenSections.includes(id);
  const [period,setPeriod] = useState('1m');
  const [q,setQ] = useState('');
  const filtered = filterByPeriod(records, period);
  const keys = Object.keys(filtered).sort();
  const total = keys.length;
  let sum=0; keys.forEach(k=>sum+=filtered[k].mood);
  const avg = total ? (sum/total).toFixed(1) : '—';

  const tagMoods = {};
  keys.forEach(k=>{ const r=filtered[k]; (r.tags||[]).forEach(t=>{ if(!tagMoods[t]) tagMoods[t]=[]; tagMoods[t].push(r.mood); }); });
  const withoutTag = (tag) => { const moods=[]; keys.forEach(k=>{ const r=filtered[k]; if(!(r.tags||[]).includes(tag)) moods.push(r.mood); }); return moods; };

  // 翌日の気分への影響（やった日の翌日 vs やってない日の翌日）
  const dayAfter = (k)=>{ const d=new Date(k+'T00:00:00'); d.setDate(d.getDate()+1); return keyOf(d); };
  const rankings = Object.entries(tagMoods)
    .filter(([_,m])=>m.length>=2)
    .map(([tag,m])=>{
      const yesAvg = m.reduce((a,b)=>a+b,0)/m.length;
      const noMoods = withoutTag(tag);
      const noAvg = noMoods.length ? noMoods.reduce((a,b)=>a+b,0)/noMoods.length : 0;
      const delta = yesAvg - noAvg;
      const yesNext=[], noNext=[];
      keys.forEach(k=>{
        const nr = records[dayAfter(k)];
        if(!nr) return;
        if((filtered[k].tags||[]).includes(tag)) yesNext.push(nr.mood); else noNext.push(nr.mood);
      });
      const nextDelta = (yesNext.length>=2 && noNext.length>=2)
        ? yesNext.reduce((a,b)=>a+b,0)/yesNext.length - noNext.reduce((a,b)=>a+b,0)/noNext.length
        : null;
      return { tag, count:m.length, yesAvg, noAvg, delta, nextDelta };
    })
    .sort((a,b)=>b.delta-a.delta);

  // メモ・タグ検索（全期間対象）
  const query = q.trim().toLowerCase();
  const hits = query ? Object.keys(records).filter(k=>{
    const r=records[k];
    return (r.goodThings||'').toLowerCase().includes(query)
      || (r.tags||[]).some(t=>t.toLowerCase().includes(query));
  }).sort((a,b)=>b.localeCompare(a)) : [];
  const hitAvg = hits.length ? (hits.reduce((s,k)=>s+records[k].mood,0)/hits.length).toFixed(1) : null;
  const negSet = new Set(tags.filter(t=>t.neg).map(t=>t.name));

  return (
    <div className="scroll">
      <div className="log-head"><span className="log-date">分析</span></div>

      <div className="search-wrap">
        <input className="search-input" placeholder="メモ・タグを検索" value={q} onChange={e=>setQ(e.target.value)}/>
        {query && <button className="search-clear" onClick={()=>setQ('')}>×</button>}
      </div>

      {query ? (
        <div className="sec">
          <div className="lbl">検索結果 {hits.length}件{hitAvg && <span style={{textTransform:'none',letterSpacing:1}}> · 平均きぶん {hitAvg}</span>}</div>
          {hits.length===0 && <div className="empty-note">見つかりませんでした</div>}
          <div className="rec-list">
            {hits.slice(0,50).map(k=>{
              const r=records[k]; const d=new Date(k+'T00:00:00'); const m=moodMeta(r.mood);
              const tagList=(r.tags||[]).slice(0,4);
              return (
                <div key={k} className="rec-card" onClick={()=>onOpenDay&&onOpenDay(k)}>
                  <div className="rec-head">
                    <span className="rec-date">{d.getFullYear()}/{d.getMonth()+1}/{d.getDate()}（{DOW[d.getDay()]}）</span>
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
          {hits.length>50 && <div className="empty-note">先頭50件のみ表示しています</div>}
        </div>
      ) : (<>

      <PeriodFilter value={period} onChange={setPeriod}/>

      {show('chart') && <div className="sec">
        <div className="lbl">気分の波</div>
        <MoodChart records={filtered}/>
      </div>}

      {show('corr') && <div className="sec">
        <div className="lbl">行動 × 気分</div>
        <div className="corr-hint">やった日 vs やってない日の平均気分の差。「翌日」はその行動が翌日の気分に与える影響</div>
        {rankings.length>0 ? (
          <div className="corr-list">
            <div className="corr-row corr-head">
              <span className="corr-tag"></span>
              <span className="corr-n"></span>
              <span className="corr-bar-wrap"></span>
              <span className="corr-delta">当日</span>
              <span className="corr-next">翌日</span>
            </div>
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
                  <span className={'corr-next'+(c.nextDelta==null?' na':c.nextDelta>=0?' pos':' neg')}>
                    {c.nextDelta==null?'—':(c.nextDelta>=0?'+':'')+c.nextDelta.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : <div className="empty-note">まだデータが足りません（2日以上必要）</div>}
      </div>}

      {show('dist') && <div className="sec">
        <div className="lbl">気分の分布</div>
        <MoodDistribution records={filtered}/>
      </div>}

      {show('weekday') && <div className="sec">
        <div className="lbl">曜日べつ平均</div>
        <WeekdayBars records={filtered}/>
      </div>}

      {show('stability') && <div className="sec">
        <div className="lbl">安定度</div>
        <div className="corr-hint">月ごとの平均と気分のばらつき</div>
        <StabilityView records={records}/>
      </div>}

      {show('calendar') && <div className="sec">
        <div className="lbl">カレンダー</div>
        <CalendarHeatmap records={records}/>
      </div>}

      {show('summary') && <div className="sec">
        <div className="lbl">概要</div>
        <div className="tiles">
          <div className="tile"><div className="v">{total}<small> 日</small></div><div className="t">記録日数</div></div>
          <div className="tile"><div className="v">{avg}</div><div className="t">平均きぶん</div></div>
        </div>
      </div>}
      </>)}
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
function SettingsSheet({ settings, records, onChange, onImport, lastExport, onExported, onClose }){
  const [s,setS]=useState({...settings});
  const [permNote,setPermNote]=useState('');
  const fileRef = useRef(null);

  // ---- サーバー通知（Web Push）の購読 ----
  const [pushSub,setPushSub]=useState(null);
  const [pushNote,setPushNote]=useState('');
  useEffect(()=>{
    if(!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready
      .then(reg=>reg.pushManager.getSubscription())
      .then(sub=>{ if(sub) setPushSub(JSON.stringify(sub)); })
      .catch(()=>{});
  },[]);
  const enablePush=async()=>{
    try{
      if(!('serviceWorker' in navigator) || !('PushManager' in window)){
        setPushNote('この端末はプッシュ通知に対応していません。'); return;
      }
      setPushNote('登録中…');
      const perm = await Notification.requestPermission();
      if(perm!=='granted'){ setPushNote('通知が許可されていません。端末の設定から許可してください。'); return; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if(!sub){
        sub = await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlB64ToU8(VAPID_PUBLIC_KEY),
        });
      }
      setPushSub(JSON.stringify(sub));
      setPushNote('登録できました。下の「購読情報をコピー」を押して、Vercel の環境変数 PUSH_SUBSCRIPTION に貼り付けてください。');
    }catch(err){ setPushNote('登録に失敗しました: '+(err&&err.message||err)); }
  };
  const copyPushSub=async()=>{
    try{
      await navigator.clipboard.writeText(pushSub);
      setPushNote('コピーしました。Vercel の環境変数 PUSH_SUBSCRIPTION に貼り付けてください。');
    }catch(e){ setPushNote('コピーできませんでした。下の文字列を長押しして手動でコピーしてください。'); }
  };
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
  const toJson=()=>{ download('emlog-backup.json',JSON.stringify(records,null,2),'application/json'); onExported&&onExported(); };
  const toCsv=()=>{
    const ks=Object.keys(records).sort();
    let csv='date,mood,mood_label,tags,good_things\n';
    ks.forEach(k=>{ const r=records[k]; const m=moodMeta(r.mood);
      const esc=(x)=>`"${String(x||'').replace(/"/g,'""')}"`;
      csv+=[k,r.mood,m.l,(r.tags||[]).join('|'),r.goodThings||''].map(esc).join(',')+'\n';
    });
    download('emlog.csv',csv,'text/csv');
    onExported&&onExported();
  };
  const readFileText=(file)=>new Promise((resolve,reject)=>{
    if(file.text) return file.text().then(resolve,reject);
    const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(r.error); r.readAsText(file,'UTF-8');
  });
  const [importPreview,setImportPreview]=useState(null);
  const handleImport=async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    try{
      const text=await readFileText(f); let data;
      const normalized = text.replace(/\r\n?/g,'\n');
      data = parseDaylioCSV(normalized);
      if(!data){
        try{ data=JSON.parse(normalized); }catch(_){}
      }
      if(!data){
        const lines=normalized.trim().split('\n'); data={};
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
      if(data && typeof data==='object'){
        const count=Object.keys(data).length;
        if(!count){ setImportPreview(null); onClose(); onImport(null); return; }
        setImportPreview({data,count});
      }
    }catch(err){ setImportPreview(null); }
    e.target.value='';
  };
  const doImport=()=>{ if(importPreview){ onImport(importPreview.data); setImportPreview(null); onClose(); } };

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

      <div className="set-row">
        <div><div className="st">サーバー通知</div>
          <div className="sd">アプリを閉じていても毎晩21時に届く（要セットアップ）</div></div>
        <button className="set-btn" style={{flex:'0 0 auto'}} onClick={enablePush}>
          {pushSub?'再登録':'登録'}
        </button>
      </div>
      {pushNote && <div className="empty-note" style={{marginBottom:8}}>{pushNote}</div>}
      {pushSub && (
        <>
          <button className="set-btn full" onClick={copyPushSub}>購読情報をコピー</button>
          <textarea readOnly value={pushSub}
            style={{width:'100%',height:64,marginTop:8,marginBottom:4,fontSize:10,
              background:'var(--glass)',color:'var(--ink-dim)',border:'none',borderRadius:12,padding:10,resize:'none'}}/>
        </>
      )}

      <div className="set-row">
        <div><div className="st">テーマ</div>
          <div className="sd">{s.theme==='dark'?'ダークモード':'やさしい色合い'}</div></div>
        <div className="theme-toggle">
          <button className={'theme-opt'+(s.theme==='dark'?' on':'')} onClick={()=>setS({...s,theme:'dark'})}>Dark</button>
          <button className={'theme-opt'+(s.theme==='light'?' on':'')} onClick={()=>setS({...s,theme:'light'})}>Light</button>
        </div>
      </div>

      <div className="set-divider"></div>
      <div className="set-row" style={{borderBottom:'none'}}>
        <div><div className="st">データ</div>
          <div className="sd">{lastExport
            ? `最終バックアップ: ${new Date(lastExport).getFullYear()}/${new Date(lastExport).getMonth()+1}/${new Date(lastExport).getDate()}`
            : 'まだバックアップがありません'}</div></div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        <button className="set-btn" onClick={toJson}>JSON 書き出し</button>
        <button className="set-btn" onClick={toCsv}>CSV 書き出し</button>
      </div>
      <button className="set-btn full" onClick={()=>fileRef.current&&fileRef.current.click()}>
        インポート（JSON / CSV / Daylio）
      </button>
      <input ref={fileRef} type="file" accept=".json,.csv,text/csv,text/plain,application/json,*/*" style={{display:'none'}} onChange={handleImport}/>
      {importPreview && (
        <div style={{marginTop:12,padding:'14px 16px',background:'var(--glass)',borderRadius:16}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>{importPreview.count}件のデータが見つかりました</div>
          <div style={{display:'flex',gap:8}}>
            <button className="primary" style={{marginTop:0,flex:1}} onClick={doImport}>インポートする</button>
            <button className="set-btn" style={{flex:'0 0 auto'}} onClick={()=>setImportPreview(null)}>やめる</button>
          </div>
        </div>
      )}

      <div className="set-divider"></div>
      <div className="set-row" style={{borderBottom:'none'}}>
        <div><div className="st">分析の表示</div></div>
      </div>
      {ANALYSIS_SECTIONS.map(sec=>(
        <div key={sec.id} className="set-row">
          <div className="st" style={{fontSize:13}}>{sec.label}</div>
          <button className={'sw'+((s.hiddenSections||[]).includes(sec.id)?'':' on')}
            onClick={()=>{
              const hidden = s.hiddenSections||[];
              setS({...s, hiddenSections: hidden.includes(sec.id) ? hidden.filter(x=>x!==sec.id) : [...hidden,sec.id]});
            }}></button>
        </div>
      ))}

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
  const [lastExport,setLastExport] = useState(()=>{ try{return localStorage.getItem(XKEY)}catch(e){return null} });
  const toastT = useRef(null);
  const remT = useRef(null);

  // OSにストレージの永続化を要求（消されにくくする）
  useEffect(()=>{ try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){} },[]);

  const markExport = useCallback(()=>{
    const t = new Date().toISOString();
    try{ localStorage.setItem(XKEY,t); }catch(e){}
    setLastExport(t);
  },[]);
  const backupStale = Object.keys(records).length>0 &&
    (!lastExport || (Date.now()-new Date(lastExport).getTime()) > 30*86400000);

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

  const flash = useCallback((msg='保存しました',duration=1400)=>{ setToast(msg); clearTimeout(toastT.current); toastT.current=setTimeout(()=>setToast(null),duration); },[]);
  const trendMsg = useCallback((mood,prev)=>{
    const week = Object.keys(prev).filter(k=>{ const d=new Date()-new Date(k+'T00:00:00'); return d>0 && d<7*86400000; });
    if(week.length<2) return '保存しました';
    const avg = week.reduce((s,k)=>s+prev[k].mood,0)/week.length;
    const diff = mood - avg;
    if(diff>0.4) return '保存 ↑ 先週より上向き';
    if(diff<-0.4) return '保存 ↓ 先週より低め';
    return '保存 → 安定してます';
  },[]);
  const saveDay = useCallback((key,data)=>{
    setRecords(prev=>{
      const msg = key===todayKey() ? trendMsg(data.mood,prev) : '保存しました';
      flash(msg, 2000);
      return {...prev,[key]:{...data,updatedAt:new Date().toISOString()}};
    });
    if(key===todayKey()) markRecordedToday(key);
  },[flash,trendMsg]);
  const deleteDay = useCallback((key)=>{
    setRecords(prev=>{ const n={...prev}; delete n[key]; return n; });
    setSheet(null);
  },[]);
  const importRecords = useCallback((data)=>{
    if(!data){ flash('データが見つかりませんでした',2000); return; }
    setRecords(data);
    flash(`${Object.keys(data).length}件をインポートしました`,2000);
  },[flash]);

  const go = (id)=>{ if(id!==screen){ setScreen(id); buzz(14);} };

  useEffect(()=>{
    const theme = settings.theme||'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content = theme==='light'?'#faf6f0':'#000000';
  },[settings.theme]);

  return (
    <div className="device" data-theme={settings.theme||'dark'}>
      <div className="aura"></div><div className="aura b"></div>
      {toast && <div className="toast show">{toast}</div>}

      <div className="screen enter" key={screen}>
        {screen==='home' && <HomeScreen records={records} tags={tags} onSaveToday={saveDay}
            onOpenDay={(k)=>setSheet({type:'day',dayKey:k})} onManageTags={()=>setSheet({type:'tags'})}
            backupStale={backupStale} onOpenSettings={()=>setSheet({type:'settings'})}/>}
        {screen==='analysis' && <AnalysisScreen records={records} tags={tags} hiddenSections={settings.hiddenSections||[]}
            onOpenDay={(k)=>setSheet({type:'day',dayKey:k})}/>}
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
          {backupStale && <span className="nav-dot"/>}
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
            <SettingsSheet settings={settings} records={records} onChange={setSettings} onImport={importRecords}
              lastExport={lastExport} onExported={markExport} onClose={()=>setSheet(null)}/>}
        </div>
      </div>
    </div>
  );
}

// ============ HOME SCREEN ============
function HomeScreen({ records, tags, onSaveToday, onOpenDay, onManageTags, backupStale, onOpenSettings }){
  const tk = todayKey();
  const cur = records[tk] || null;
  const [mood,setMood] = useState(cur?cur.mood:null);
  const [sel,setSel] = useState(()=>new Set(cur?cur.tags:[]));
  const [good,setGood] = useState(cur?cur.goodThings||'':'');
  const [ph] = useState(()=>PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)]);
  const [dirty,setDirty] = useState(false);
  const now = new Date();

  useEffect(()=>{
    const r=records[tk]||null;
    setMood(r?r.mood:null);
    setSel(new Set(r?r.tags:[]));
    setGood(r?r.goodThings||'':'');
    setDirty(false);
  },[records[tk]?.updatedAt]);

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

      {backupStale && (
        <button className="backup-note" onClick={onOpenSettings}>
          30日以上バックアップしていません — タップして書き出し
        </button>
      )}

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
