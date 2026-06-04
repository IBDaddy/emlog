// emlog prototype — v3: timeline tags, line icons, explicit save, import
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
const I = (d) => <svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const TAG_ICONS = {
  '考え事・内省':       ()=>I('M8 1.5a4.5 4.5 0 0 1 2.5 8.2V12h-5V9.7A4.5 4.5 0 0 1 8 1.5M6 14h4'),
  '朝活（読書・ピアノ・英語）': ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v1M3.5 8H2.5M13.5 8h-1M4.7 4.7l.7.7M11.3 4.7l-.7.7"/><path d="M4 11a4 4 0 0 1 8 0"/><path d="M2 13h12"/></svg>,
  '家族時間':           ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="1.8"/><circle cx="11" cy="5" r="1.8"/><path d="M1 14a4 4 0 0 1 8 0M7 14a4 4 0 0 1 8 0"/></svg>,
  '運動・散歩':         ()=>I('M10 2.5a1.3 1.3 0 1 1 0 .01M7 6l2.5-1.5 2 2-2.5 3-2.5 1M9.5 9.5l1.5 4.5M7 6L4.5 9 3 14'),
  'ゲーム':             ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="4" width="13" height="8" rx="3"/><path d="M5.5 6.5v3M4 8h3M10.5 7v.01M12 9v.01"/></svg>,
  '風呂・サウナ・ととのい': ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 1.5c0 1 1.5 2 0 3M8 1.5c0 1 1.5 2 0 3M12 1.5c0 1 1.5 2 0 3"/><path d="M1.5 7h13"/><path d="M2.5 7c0 4 2 6 5.5 6s5.5-2 5.5-6"/></svg>,
  '探求・つくる（AI・アプリ）': ()=>I('M8 1l1.5 3h3.2L10 6.5l1 3.5L8 8l-3 2 1-3.5L3.3 4H6.5z'),
  '外食・お酒':         ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2l4 5 4-5"/><path d="M8 7v6"/><path d="M5 14h6"/><path d="M4.5 4.5h7"/></svg>,
  '投資・資産を見る':   ()=>I('M2 13l4-5 3 3 5-7'),
  '創造的な仕事・頭脳労働': ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M4 4l1 1M11 11l1 1M12 4l-1 1M5 11l-1 1"/></svg>,
  '在宅勤務':           ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l6-4.5L14 7"/><path d="M3.5 8v5.5h9V8"/><path d="M6.5 13.5v-4h3v4"/></svg>,
  'よく寝れた':         ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 9a5 5 0 1 1-4.3-6.8A4 4 0 0 0 13 9z"/></svg>,
  '寝不足':             ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h5l-5 4h5"/><path d="M3 8h3L3 11h3"/></svg>,
  '仕事きつい・残業':   ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4v4.5l3 1.5"/></svg>,
  '体調わるい・不調':   ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8M6 13h4"/><path d="M5 4.5l6 3M11 4.5l-6 3"/></svg>,
  '妻との衝突・すれ違い':()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l3.5-4L8 10.5 12.5 4 14 6"/><path d="M10 4h4v4"/></svg>,
  '職場の人間関係':     ()=><svg className="tag-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5.5" r="1.8"/><circle cx="11" cy="5.5" r="1.8"/><path d="M1 13.5a4 4 0 0 1 8 0M7 13.5a4 4 0 0 1 8 0"/><path d="M6 8.5l4 2"/></svg>,
};
const TagIcon = ({name}) => { const Ic=TAG_ICONS[name]; return Ic ? <Ic/> : null; };

// タグデータ: {name, neg, time} time = 'am' | 'day' | 'eve'
const DEFAULT_TAGS = [
  { name:'よく寝れた',         neg:false, time:'am' },
  { name:'朝活（読書・ピアノ・英語）', neg:false, time:'am' },
  { name:'寝不足',             neg:true,  time:'am' },

  { name:'創造的な仕事・頭脳労働', neg:false, time:'day' },
  { name:'在宅勤務',           neg:false, time:'day' },
  { name:'運動・散歩',         neg:false, time:'day' },
  { name:'考え事・内省',       neg:false, time:'day' },
  { name:'仕事きつい・残業',   neg:true,  time:'day' },
  { name:'職場の人間関係',     neg:true,  time:'day' },
  { name:'体調わるい・不調',   neg:true,  time:'day' },

  { name:'家族時間',           neg:false, time:'eve' },
  { name:'ゲーム',             neg:false, time:'eve' },
  { name:'風呂・サウナ・ととのい', neg:false, time:'eve' },
  { name:'外食・お酒',         neg:false, time:'eve' },
  { name:'探求・つくる（AI・アプリ）', neg:false, time:'eve' },
  { name:'投資・資産を見る',   neg:false, time:'eve' },
  { name:'妻との衝突・すれ違い', neg:true, time:'eve' },
];

const TIME_LABELS = { am:'Morning', day:'Daytime', eve:'Evening' };

const PLACEHOLDERS = [
  'ちゃんと寝た、でもOK', '小さいことでOK。書けなければ空欄でも',
  '断れた、それも立派なこと', '散歩した、とか', 'ご飯をちゃんと食べた、とか',
  '期限を守れた、とか', '誰かに優しくできた、とか', '自分のために時間を使えた、とか',
];

// ---- date helpers ----
const pad = (n) => String(n).padStart(2,'0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayKey = () => keyOf(new Date());
const DOW = ['日','月','火','水','木','金','土'];
const ENMON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtLong = (d) => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${DOW[d.getDay()]}）`;
const greeting = () => { const h=new Date().getHours();
  return h<5?'おやすみ前に':h<11?'おはよう':h<17?'こんにちは':'こんばんは'; };

// ---- storage ----
const RKEY='emlog_proto_records_v1', TKEY='emlog_proto_tags_v3', SKEY='emlog_proto_settings_v1';
const loadRecords = () => { try{return JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){return null} };
const saveRecordsLS = (r) => localStorage.setItem(RKEY, JSON.stringify(r));
const NEG_NAMES = DEFAULT_TAGS.filter(t=>t.neg).map(t=>t.name);
const TIME_MAP = Object.fromEntries(DEFAULT_TAGS.map(t=>[t.name,t.time]));
const loadTags = () => {
  try{
    const t=JSON.parse(localStorage.getItem(TKEY)||'null');
    if(!t) return DEFAULT_TAGS.map(x=>({...x}));
    return t.map(x=>{
      if(typeof x==='string') return { name:x, neg:NEG_NAMES.includes(x), time:TIME_MAP[x]||'day' };
      if(x&&x.name) return { name:x.name, neg:x.neg!=null?!!x.neg:NEG_NAMES.includes(x.name), time:x.time||TIME_MAP[x.name]||'day' };
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

// ---- seed sample data ----
function seedData(){
  const recs = {};
  const today = new Date();
  const notes = [
    '朝のうちに散歩できた。締め切りも一つ片づいた。',
    'ちゃんと三食食べられた。',
    '早めに寝る準備ができた。',
    '断りたかった予定を断れた。',
    '読みたかった本を少し進めた。',
    '人に「ありがとう」と言えた。',
    '', '', '',
  ];
  const whys = ['早く起きられたから。前の夜にスマホを遠ざけたのが効いた。','無理をしなかったから。',''];
  const tagSets = [['朝活（読書・ピアノ・英語）','運動・散歩'],['考え事・内省'],['よく寝れた','風呂・サウナ・ととのい'],['家族時間'],['探求・つくる（AI・アプリ）','在宅勤務'],['創造的な仕事・頭脳労働'],[]];
  for(let i=1;i<=52;i++){
    if(Math.random()<0.22) continue;
    const d=new Date(today); d.setDate(d.getDate()-i);
    const r=Math.random();
    const mood = r<0.08?1 : r<0.24?2 : r<0.55?3 : r<0.85?4 : 5;
    recs[keyOf(d)] = {
      mood, tags: tagSets[Math.floor(Math.random()*tagSets.length)],
      goodThings: notes[Math.floor(Math.random()*notes.length)],
      why: Math.random()<0.3?whys[Math.floor(Math.random()*whys.length)]:'',
      photo:'', updatedAt:d.toISOString(),
    };
  }
  const mAgo=new Date(today); mAgo.setMonth(mAgo.getMonth()-1);
  recs[keyOf(mAgo)] = { mood:4, tags:['考え事・内省'], goodThings:'新しい本を読み始めた日。', why:'', photo:'', updatedAt:mAgo.toISOString() };
  const yAgo=new Date(today); yAgo.setFullYear(yAgo.getFullYear()-1);
  recs[keyOf(yAgo)] = { mood:3, tags:['創造的な仕事・頭脳労働','風呂・サウナ・ととのい'], goodThings:'忙しい中でも昼休みに散歩できた。', why:'', photo:'', updatedAt:yAgo.toISOString() };
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


// ============ CALENDAR ============
function CalendarScreen({ records, onOpenDay }){
  const [mode,setMode] = useState('month');
  const [md,setMd] = useState(()=>new Date());
  const [yr,setYr] = useState(()=>new Date().getFullYear());
  const today = new Date(); const tk = todayKey();

  function MonthView(){
    const y=md.getFullYear(), m=md.getMonth();
    let start=new Date(y,m,1).getDay()-1; if(start<0) start=6;
    const days=new Date(y,m+1,0).getDate();
    const cells=[];
    for(let i=0;i<start;i++) cells.push(<div key={'e'+i} className="cell empty"></div>);
    for(let d=1;d<=days;d++){
      const key=`${y}-${pad(m+1)}-${pad(d)}`;
      const cd=new Date(y,m,d);
      const future = cd>today && key!==tk;
      const rec=records[key];
      let cls='cell'; const st={};
      if(key===tk) cls+=' today';
      if(future){ cls+=' future'; }
      else if(rec){ cls+=' rec'; st.background=moodMeta(rec.mood).raw; }
      else cls+=' norec';
      const hasText = rec && (rec.goodThings||rec.why);
      cells.push(
        <div key={key} className={cls} style={st}
             onClick={()=>{ if(!future) onOpenDay(key); }}>
          <span>{d}</span>
          {rec && <span className="cdot" style={hasText?{}:{display:'none'}}></span>}
        </div>
      );
    }
    return (
      <>
        <div className="cal-nav">
          <button onClick={()=>setMd(new Date(y,m-1,1))}>‹</button>
          <span className="cal-label">{m+1}月<span className="yr">{y}</span></span>
          <button onClick={()=>setMd(new Date(y,m+1,1))}>›</button>
        </div>
        <div className="grid">
          {['月','火','水','木','金','土','日'].map(d=><div key={d} className="dow">{d}</div>)}
          {cells}
        </div>
      </>
    );
  }

  function YearView(){
    const rows=[];
    for(let m=0;m<12;m++){
      const days=new Date(yr,m+1,0).getDate();
      const cells=[<div key="l" className="yml">{m+1}</div>];
      for(let d=1;d<=31;d++){
        if(d>days){ cells.push(<div key={d} className="ycell blank"></div>); continue; }
        const key=`${yr}-${pad(m+1)}-${pad(d)}`;
        const cd=new Date(yr,m,d); const future=cd>today && key!==tk;
        const rec=records[key];
        const st={}; let cls='ycell';
        if(rec) st.background=moodMeta(rec.mood).raw;
        else if(future) cls+=' future';
        cells.push(<div key={d} className={cls} style={st} title={`${m+1}/${d}`}
                        onClick={()=>{ if(!future) onOpenDay(key); }}></div>);
      }
      rows.push(<div key={m} className="yrow">{cells}</div>);
    }
    return (
      <>
        <div className="cal-nav">
          <button onClick={()=>setYr(yr-1)}>‹</button>
          <span className="cal-label">{yr}<span className="yr">YEAR</span></span>
          <button onClick={()=>setYr(yr+1)}>›</button>
        </div>
        <div className="ygrid">{rows}</div>
        <div className="ylegend">
          <span>しんどい</span>
          <span className="cells">{MOODS.map(m=><span key={m.v} className="lc" style={{background:m.raw}}></span>)}</span>
          <span>最高</span>
        </div>
      </>
    );
  }

  return (
    <div className="scroll">
      <div className="hero"><div className="eyebrow">Calendar</div><div className="h1" style={{marginTop:12}}>ふりかえる</div></div>
      <div className="seg">
        <button className={mode==='month'?'on':''} onClick={()=>setMode('month')}>MONTH</button>
        <button className={mode==='year'?'on':''} onClick={()=>setMode('year')}>YEAR</button>
      </div>
      {mode==='month'?<MonthView/>:<YearView/>}
    </div>
  );
}

// ============ INSIGHTS ============
function InsightsScreen({ records }){
  const keys=Object.keys(records);
  const total=keys.length;
  let streak=0; const cur=new Date();
  if(!records[keyOf(cur)]) cur.setDate(cur.getDate()-1);
  while(records[keyOf(cur)]){ streak++; cur.setDate(cur.getDate()-1); }
  let sum=0; keys.forEach(k=>sum+=records[k].mood);
  const avg = total? (sum/total).toFixed(1):'—';
  const dist=[0,0,0,0,0,0]; keys.forEach(k=>dist[records[k].mood]++);
  const maxD=Math.max(1,...dist.slice(1));
  const tc={}; keys.forEach(k=>(records[k].tags||[]).forEach(t=>tc[t]=(tc[t]||0)+1));
  const top=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const trend=[]; const t0=new Date();
  for(let i=13;i>=0;i--){ const d=new Date(t0); d.setDate(d.getDate()-i); trend.push(records[keyOf(d)]||null); }

  return (
    <div className="scroll">
      <div className="hero"><div className="eyebrow">Insights</div><div className="h1" style={{marginTop:12}}>つみかさね</div></div>

      <div className="sec">
        <div className="tiles">
          <div className="tile"><div className="v">{streak}<small> 日</small></div><div className="t">連続記録</div></div>
          <div className="tile"><div className="v">{total}<small> 日</small></div><div className="t">合計記録</div></div>
          <div className="tile"><div className="v">{avg}</div><div className="t">平均きぶん</div></div>
        </div>
      </div>

      <div className="sec">
        <div className="lbl">Last 14 days</div>
        <div style={{display:'flex',gap:5,alignItems:'flex-end',height:46}}>
          {trend.map((r,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'flex-end',height:'100%'}}>
              <div style={{height: r? `${20+(r.mood-1)/4*80}%`:'10%', borderRadius:6,
                background: r? moodMeta(r.mood).raw : 'var(--glass-2)', transition:'height .5s'}}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="lbl">Mood distribution</div>
        <div style={{marginTop:14}}>
          {[5,4,3,2,1].map(v=>{
            const m=moodMeta(v); const pct=dist[v]/maxD*100;
            return (
              <div key={v} className="dist-row">
                <span className="dist-face" style={{background:m.raw}}><MoodFace v={v} size={17}/></span>
                <span className="dist-name">{m.l}</span>
                <span className="bar-wrap"><span className="bar" style={{width:pct+'%',background:m.raw}}></span></span>
                <span className="dist-n">{dist[v]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sec">
        <div className="lbl">Top moments</div>
        <div style={{marginTop:14}}>
          {top.length? top.map(([n,c])=>(
            <div key={n} className="tag-row"><span className="nm"><TagIcon name={n}/>{n}</span><span className="ct">{c}日</span></div>
          )) : <div className="empty-note">まだタグの記録がありません。</div>}
        </div>
      </div>
    </div>
  );
}

// ============ EXPORT & IMPORT ============
function ExportScreen({ records, onImport }){
  const fileRef = useRef(null);
  const download=(name,text,type)=>{
    const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const toMd=()=>{
    const ks=Object.keys(records).sort().reverse();
    let s='# emlog\n\n';
    ks.forEach(k=>{ const r=records[k]; const m=moodMeta(r.mood);
      s+=`## ${k}　${m.l}\n`;
      if(r.tags&&r.tags.length) s+=`- やったこと: ${r.tags.join('、')}\n`;
      if(r.goodThings) s+=`- 良かったこと: ${r.goodThings}\n`;
      if(r.why) s+=`- なぜできたか: ${r.why}\n`;
      s+='\n';
    });
    download('emlog.md',s,'text/markdown');
  };
  const toCsv=()=>{
    const ks=Object.keys(records).sort();
    let s='date,mood,mood_label,tags,good_things,why\n';
    ks.forEach(k=>{ const r=records[k]; const m=moodMeta(r.mood);
      const esc=(x)=>`"${String(x||'').replace(/"/g,'""')}"`;
      s+=[k,r.mood,m.l,(r.tags||[]).join('|'),r.goodThings||'',r.why||''].map(esc).join(',')+'\n';
    });
    download('emlog.csv',s,'text/csv');
  };
  const toJson=()=>{
    download('emlog-backup.json',JSON.stringify(records,null,2),'application/json');
  };
  const handleImport=async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    try{
      const text=await f.text();
      let data;
      if(f.name.endsWith('.json')){
        data=JSON.parse(text);
      } else if(f.name.endsWith('.csv')){
        const lines=text.trim().split('\n');
        data={};
        for(let i=1;i<lines.length;i++){
          const cols=lines[i].match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
          if(!cols||cols.length<3) continue;
          const clean=cols.map(c=>c.replace(/^,/,'').replace(/^"|"$/g,'').replace(/""/g,'"'));
          const [date,mood,,tags,good,why]=clean;
          if(!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
          data[date]={
            mood:parseInt(mood)||3,
            tags: tags? tags.split('|').filter(Boolean) : [],
            goodThings:good||'', why:why||'', photo:'',
            updatedAt:new Date().toISOString(),
          };
        }
      } else { alert('JSON または CSV ファイルを選んでください'); return; }
      if(data && typeof data==='object'){
        const count=Object.keys(data).length;
        if(confirm(`${count}件の記録をインポートしますか？\n（同じ日付のデータは上書きされます）`)){
          onImport(data);
        }
      }
    }catch(err){ alert('ファイルを読み込めませんでした: '+err.message); }
    e.target.value='';
  };
  return (
    <div className="scroll">
      <div className="hero"><div className="eyebrow">Export / Import</div><div className="h1" style={{marginTop:12}}>もちだす・とりこむ</div></div>
      <div className="sec">
        <div className="lbl">書き出す</div>
        <button className="exp-btn" onClick={toMd}>
          <span className="exp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 12h16M4 19h10"/></svg></span>
          <span><div className="nm">Markdown</div><div className="ds">読書記録と地続きの形式</div></span>
        </button>
        <button className="exp-btn" onClick={toCsv}>
          <span className="exp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10"/></svg></span>
          <span><div className="nm">CSV</div><div className="ds">スプレッドシートで分析用</div></span>
        </button>
        <button className="exp-btn" onClick={toJson}>
          <span className="exp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.5L13 3.5z"/><path d="M13 3.5v6h6"/></svg></span>
          <span><div className="nm">JSON バックアップ</div><div className="ds">全データをそのまま保存</div></span>
        </button>
      </div>
      <div className="sec">
        <div className="lbl">取り込む</div>
        <button className="exp-btn" onClick={()=>fileRef.current&&fileRef.current.click()}>
          <span className="exp-ic" style={{background:'color-mix(in srgb,var(--m3) 16%,transparent)',color:'var(--m3)'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v3.5a2 2 0 002 2h12a2 2 0 002-2V15M16.5 8.5L12 4 7.5 8.5M12 4v11"/></svg>
          </span>
          <span><div className="nm">JSON / CSV をインポート</div><div className="ds">他のアプリや過去のデータを取り込む</div></span>
        </button>
        <input ref={fileRef} type="file" accept=".json,.csv" style={{display:'none'}} onChange={handleImport}/>
      </div>
      <div className="empty-note" style={{marginTop:8}}>
        記録はすべてこの端末の中だけに保存されています。<br/>外に出すときだけ、ファイルになります。
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
          <div className="d-sec"><div className="d-lbl">今日の良かったこと</div><div className="d-text">{existing.goodThings}</div></div>}
        {existing.why &&
          <div className="d-sec"><div className="d-lbl">なぜできた</div><div className="d-text" style={{color:'var(--dim)'}}>{existing.why}</div></div>}
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
      <div className="d-lbl" style={{marginTop:22}}>今日の良かったこと <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
      <div className="card ta-card"><textarea className="ta" value={note} placeholder="小さいことでOK" onChange={e=>setNote(e.target.value)} rows={2}/></div>
      <button className="primary" disabled={!mood} onClick={()=>onSave(dayKey,{mood,tags:[],goodThings:note.trim(),why:'',photo:''})}>保存する</button>
    </>
  );
}

// ============ TAG MANAGER SHEET ============
function TagManagerSheet({ tags, onChange, onClose }){
  const [list,setList]=useState(tags.map(t=>({...t})));
  const [nn,setNn]=useState('');
  const [nneg,setNneg]=useState(false);
  const [ntime,setNtime]=useState('day');
  const upd=(i,f,v)=>{ setList(list.map((t,j)=>j===i?{...t,[f]:v}:t)); };
  const del=(i)=>setList(list.filter((_,j)=>j!==i));
  const add=()=>{
    const v=nn.trim(); if(!v||list.some(t=>t.name===v))return;
    setList([...list,{name:v,neg:nneg,time:ntime}]); setNn(''); setNneg(false);
  };
  const commit=()=>{ onChange(list.filter(t=>t.name.trim()).map(t=>({name:t.name.trim(),neg:!!t.neg,time:t.time||'day'}))); onClose(); };

  const renderGroup=(time,label)=>{
    const items=list.map((t,i)=>({...t,i})).filter(t=>t.time===time);
    if(!items.length) return null;
    return (
      <div key={time} style={{marginBottom:16}}>
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
      {renderGroup('am','Morning')}
      {renderGroup('day','Daytime')}
      {renderGroup('eve','Evening')}
      <div className="tm-add">
        <input className="tm-nm" value={nn} placeholder="新しい項目" onChange={e=>setNn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <select className="tm-time" value={ntime} onChange={e=>setNtime(e.target.value)}>
          <option value="am">朝</option><option value="day">昼</option><option value="eve">夜</option>
        </select>
        <button className="primary" onClick={add}>追加</button>
      </div>
      <button className="primary" style={{marginTop:18}} onClick={commit}>保存して閉じる</button>
    </>
  );
}

// ============ SETTINGS SHEET ============
function SettingsSheet({ settings, onChange, onClose }){
  const [s,setS]=useState({...settings});
  const [permNote,setPermNote]=useState('');
  const toggleReminder=async()=>{
    const next=!s.reminderOn;
    if(next && 'Notification' in window){
      let perm=Notification.permission;
      if(perm==='default') perm=await Notification.requestPermission();
      if(perm!=='granted'){ setPermNote('通知が許可されていません。端末の設定から許可してください。'); }
      else setPermNote('');
    }
    setS({...s,reminderOn:next});
  };
  const commit=()=>{ onChange(s); onClose(); };
  return (
    <>
      <div className="grab"></div>
      <div className="sheet-date">設定</div>
      <div className="set-row">
        <div>
          <div className="st">夜のリマインド</div>
          <div className="sd">1日1回、決めた時間に「記録した？」と通知します。<br/>アプリを開いている間だけ有効です。</div>
        </div>
        <button className={'sw'+(s.reminderOn?' on':'')} onClick={toggleReminder}></button>
      </div>
      {s.reminderOn &&
        <div className="set-row">
          <div className="st">通知する時刻</div>
          <input className="time-input" type="time" value={s.reminderTime}
                 onChange={e=>setS({...s,reminderTime:e.target.value})}/>
        </div>}
      {permNote && <div className="empty-note" style={{color:'var(--danger)'}}>{permNote}</div>}
      <button className="primary" onClick={commit}>保存して閉じる</button>
    </>
  );
}


// ============ ROOT APP ============
const TABS = [
  { id:'log',      label:'Log',      ic:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v1.6M12 18.9v1.6M4.6 12H3M21 12h-1.6M6.4 6.4l1.1 1.1M16.5 16.5l1.1 1.1M17.6 6.4l-1.1 1.1M7.5 16.5l-1.1 1.1"/></svg>) },
  { id:'calendar', label:'Cal',      ic:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="4"/><path d="M16 3.5v3M8 3.5v3M3.5 10h17"/></svg>) },
  { id:'insights', label:'Stats',    ic:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.5l4.5-4.5 4 4 7.5-7"/></svg>) },
  { id:'export',   label:'Export',   ic:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 15v3.5a2 2 0 01-2 2H6a2 2 0 01-2-2V15M7.5 10l4.5 4.5 4.5-4.5M12 14V3.5"/></svg>) },
];

function App(){
  const [records,setRecords] = useState(()=>{ const r=loadRecords(); if(r) return r; const s=seedData(); saveRecordsLS(s); return s; });
  const [tags,setTags] = useState(()=>loadTags());
  const [settings,setSettings] = useState(()=>loadSettings());
  const [screen,setScreen] = useState('log');
  const [sheet,setSheet] = useState(null);
  const [toast,setToast] = useState(null);
  const toastT = useRef(null);
  const remT = useRef(null);

  useEffect(()=>saveRecordsLS(records),[records]);
  useEffect(()=>saveTagsLS(tags),[tags]);
  useEffect(()=>saveSettingsLS(settings),[settings]);

  // reminder
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
        if(!records[todayKey()]){
          try{ new Notification('emlog', {body:'今日の気分、まだ残してないよ。30秒でOK。'}); }catch(e){}
        }
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
      <div className="status">
        <span>9:41</span>
        <span className="r"><span>emlog</span></span>
        <span>100</span>
      </div>

      <div className="screen enter" key={screen}>
        {screen==='log' && <LogScreen records={records} tags={tags} onSaveToday={saveDay}
            onOpenDay={(k)=>setSheet({type:'day',dayKey:k})} onManageTags={()=>setSheet({type:'tags'})}
            onSettings={()=>setSheet({type:'settings'})}/>}
        {screen==='calendar' && <CalendarScreen records={records} onOpenDay={(k)=>setSheet({type:'day',dayKey:k})}/>}
        {screen==='insights' && <InsightsScreen records={records}/>}
        {screen==='export' && <ExportScreen records={records} onImport={importRecords}/>}
      </div>

      <nav className="nav">
        {TABS.map(t=>(
          <button key={t.id} className={'tab'+(screen===t.id?' on':'')} onClick={()=>go(t.id)} title={t.label}>
            <span className="ic">{t.ic}</span>
            <span className="tl">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className={'overlay'+(sheet?' show':'')} onClick={(e)=>{ if(e.target.classList.contains('overlay')) setSheet(null); }}>
        <div className="sheet">
          {sheet && sheet.type==='day' &&
            <DaySheet dayKey={sheet.dayKey} records={records} tags={tags}
                   onSave={(k,d)=>{ saveDay(k,d); setSheet(null); }} onDelete={deleteDay} onClose={()=>setSheet(null)}/>}
          {sheet && sheet.type==='tags' &&
            <TagManagerSheet tags={tags} onChange={setTags} onClose={()=>setSheet(null)}/>}
          {sheet && sheet.type==='settings' &&
            <SettingsSheet settings={settings} onChange={setSettings} onClose={()=>setSheet(null)}/>}
        </div>
      </div>
    </div>
  );
}

// ============ LOG SCREEN ============
function LogScreen({ records, tags, onSaveToday, onOpenDay, onManageTags, onSettings }){
  const tk = todayKey();
  const cur = records[tk] || null;
  const [mood,setMood] = useState(cur?cur.mood:null);
  const [sel,setSel] = useState(()=>new Set(cur?cur.tags:[]));
  const [good,setGood] = useState(cur?cur.goodThings||'':'');
  const [why,setWhy] = useState(cur?cur.why||'':'');
  const [photo,setPhoto] = useState(cur?cur.photo||'':'');
  const [ph] = useState(()=>PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)]);
  const [dirty,setDirty] = useState(false);
  const fileRef = useRef(null);
  const whyShown = good.trim().length>0 || why.trim().length>0;
  const now = new Date();

  const toggle=(name)=>{ const n=new Set(sel); n.has(name)?n.delete(name):n.add(name); setSel(n); setDirty(true); };
  const pickMood=(v)=>{ setMood(v); buzz(); setDirty(true); };
  const onPhoto=async(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    try{ const url=await fileToThumb(f); setPhoto(url); setDirty(true); }catch(err){ alert('画像を読み込めませんでした'); }
    e.target.value='';
  };
  const save=()=>{
    if(!mood) return;
    onSaveToday(tk,{mood,tags:[...sel],goodThings:good.trim(),why:why.trim(),photo});
    setDirty(false);
  };

  // memories
  const mems=[]; const seen=new Set();
  const addMem=(d,label)=>{ const k=keyOf(d); if(k===tk||seen.has(k))return; const r=records[k]; if(!r)return; seen.add(k); mems.push({k,label,r}); };
  const mAgo=(n)=>{const d=new Date(now);d.setMonth(d.getMonth()-n);return d;};
  const yAgo=(n)=>{const d=new Date(now);d.setFullYear(d.getFullYear()-n);return d;};
  addMem(yAgo(1),'1Y ago'); addMem(mAgo(1),'1M ago'); addMem(mAgo(3),'3M ago');
  const memList=mems.slice(0,2);

  // group tags by time
  const renderTimeGroup = (time, label) => {
    const items = tags.filter(t=>t.time===time);
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

  return (
    <div className="scroll">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="eyebrow">{['SUN','MON','TUE','WED','THU','FRI','SAT'][now.getDay()]} · {ENMON[now.getMonth()]} {now.getDate()}</div>
            <div className="greet">{greeting()}</div>
          </div>
          <button className="icon-btn" onClick={onSettings} title="設定"><GearIcon/></button>
        </div>
      </div>

      <div className="sec">
        <div className="lbl">Mood</div>
        <MoodSelector value={mood} onPick={pickMood}/>
      </div>

      <div className="sec">
        <div className="lbl">やったこと <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
        {renderTimeGroup('am','Morning')}
        {renderTimeGroup('day','Daytime')}
        {renderTimeGroup('eve','Evening')}
        <div className="chips" style={{marginTop:12}}>
          <button className="chip ghost" onClick={onManageTags}>＋ 編集</button>
        </div>
      </div>

      <div className="sec">
        <div className="lbl">今日の良かったこと <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
        <div className="card">
          <textarea className="ta" value={good} placeholder={ph} onChange={e=>{setGood(e.target.value);setDirty(true);}} rows={2}/>
          <div className={'why'+(whyShown?' show':'')}>
            <div className="wl">なぜそれが起きた？</div>
            <textarea className="ta" value={why} placeholder="自分のどんな選択・状況のおかげ？" onChange={e=>{setWhy(e.target.value);setDirty(true);}} rows={2}/>
          </div>
        </div>

        {photo ?
          <div className="photo-wrap">
            <img src={photo} alt=""/>
            <button className="photo-rm" onClick={()=>{setPhoto('');setDirty(true);}}>×</button>
          </div>
          :
          <>
            <button className="photo-add" onClick={()=>fileRef.current&&fileRef.current.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5.5" width="18" height="14" rx="3"/><circle cx="8.5" cy="11" r="1.6"/><path d="M21 16l-5-5-9 8.5"/></svg>
              写真をつける
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onPhoto}/>
          </>
        }

        {memList.length>0 &&
          <div className="mem">
            {memList.map(m=>{
              const txt=m.r.goodThings || ((m.r.tags&&m.r.tags.length)?m.r.tags.join('・'):moodMeta(m.r.mood).l);
              return (
                <div key={m.k} className="mem-row" onClick={()=>onOpenDay(m.k)}>
                  <span className="mem-dot" style={{background:moodMeta(m.r.mood).raw}}></span>
                  <span className="mem-when">{m.label}</span>
                  <span className="mem-text">{txt}</span>
                </div>
              );
            })}
          </div>}
      </div>

      {mood &&
        <button className={'save-btn'+(dirty?' pulse':'')} onClick={save}>
          {dirty ? '保存する' : (cur ? '保存済み ✓' : '保存する')}
        </button>
      }
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
