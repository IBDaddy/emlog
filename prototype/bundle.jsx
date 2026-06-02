// emlog prototype — core: constants, helpers, MoodFace, storage, seed
const { useState, useEffect, useRef, useCallback } = React;

const MOODS = [
  { v:1, l:'しんどい',   c:'var(--m1)', raw:'#586588', face:'rgba(255,255,255,.82)', mouth:'M8 15.8 Q12 12.2 16 15.8' },
  { v:2, l:'いまいち',   c:'var(--m2)', raw:'#76859f', face:'rgba(255,255,255,.76)', mouth:'M8.5 15.2 Q12 13.7 15.5 15.2' },
  { v:3, l:'ふつう',     c:'var(--m3)', raw:'#9a9aa4', face:'rgba(18,18,26,.55)',    mouth:'M8.5 14.8 L15.5 14.8' },
  { v:4, l:'良い',       c:'var(--m4)', raw:'#efb98e', face:'rgba(72,36,12,.62)',    mouth:'M8.5 14.4 Q12 16.6 15.5 14.4' },
  { v:5, l:'すごく良い', c:'var(--m5)', raw:'#f3aa78', face:'rgba(72,36,12,.64)',    mouth:'M8 13.8 Q12 17.4 16 13.8' },
];
const moodMeta = (v) => MOODS[v-1];

const DEFAULT_TAGS = [
  { name:'仕事', icon:'💼' }, { name:'運動', icon:'🏃' }, { name:'読書', icon:'📚' },
  { name:'家族', icon:'👨‍👩‍👧' }, { name:'睡眠', icon:'😴' }, { name:'休息', icon:'☕' },
  { name:'人間関係', icon:'🤝' }, { name:'通院・体調', icon:'🏥' },
];

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
const RKEY='emlog_proto_records_v1', TKEY='emlog_proto_tags_v1';
const loadRecords = () => { try{return JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){return null} };
const saveRecordsLS = (r) => localStorage.setItem(RKEY, JSON.stringify(r));
const loadTags = () => { try{const t=JSON.parse(localStorage.getItem(TKEY)||'null');return t||DEFAULT_TAGS.map(x=>({...x}))}catch(e){return DEFAULT_TAGS.map(x=>({...x}))} };
const saveTagsLS = (t) => localStorage.setItem(TKEY, JSON.stringify(t));

// ---- seed sample data (first run) so calendar/insights feel alive ----
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
  const tagSets = [['仕事','運動'],['読書'],['睡眠','休息'],['家族'],['運動','休息'],['仕事'],[]];
  // last ~50 days with gaps, weighted toward okay/good
  for(let i=1;i<=52;i++){
    if(Math.random()<0.22) continue; // gaps
    const d=new Date(today); d.setDate(d.getDate()-i);
    const r=Math.random();
    const mood = r<0.08?1 : r<0.24?2 : r<0.55?3 : r<0.85?4 : 5;
    recs[keyOf(d)] = {
      mood, tags: tagSets[Math.floor(Math.random()*tagSets.length)],
      goodThings: notes[Math.floor(Math.random()*notes.length)],
      why: Math.random()<0.3?whys[Math.floor(Math.random()*whys.length)]:'',
      updatedAt:d.toISOString(),
    };
  }
  // guaranteed memories: 1 month & 1 year ago today
  const mAgo=new Date(today); mAgo.setMonth(mAgo.getMonth()-1);
  recs[keyOf(mAgo)] = { mood:4, tags:['読書'], goodThings:'新しい本を読み始めた日。', why:'', updatedAt:mAgo.toISOString() };
  const yAgo=new Date(today); yAgo.setFullYear(yAgo.getFullYear()-1);
  recs[keyOf(yAgo)] = { mood:3, tags:['仕事','休息'], goodThings:'忙しい中でも昼休みに散歩できた。', why:'', updatedAt:yAgo.toISOString() };
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

// ---- mood selector (shared by Log + new-record sheet) ----
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

// ---- tiny haptic ----
const buzz = (ms=22) => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };


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
          <span>すごく良い</span>
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
  // streak
  let streak=0; const cur=new Date();
  if(!records[keyOf(cur)]) cur.setDate(cur.getDate()-1);
  while(records[keyOf(cur)]){ streak++; cur.setDate(cur.getDate()-1); }
  // avg
  let sum=0; keys.forEach(k=>sum+=records[k].mood);
  const avg = total? (sum/total).toFixed(1):'—';
  // distribution
  const dist=[0,0,0,0,0,0]; keys.forEach(k=>dist[records[k].mood]++);
  const maxD=Math.max(1,...dist.slice(1));
  // top tags
  const tc={}; keys.forEach(k=>(records[k].tags||[]).forEach(t=>tc[t]=(tc[t]||0)+1));
  const top=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // last 14 days trend
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
            <div key={n} className="tag-row"><span className="nm">{n}</span><span className="ct">{c}日</span></div>
          )) : <div className="empty-note">まだタグの記録がありません。</div>}
        </div>
      </div>
    </div>
  );
}

// ============ EXPORT ============
function ExportScreen({ records, tags }){
  const tagIcon=(n)=>{ const t=tags.find(x=>x.name===n); return t&&t.icon?t.icon:''; };
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
      if(r.tags&&r.tags.length) s+=`- できごと: ${r.tags.map(t=>(tagIcon(t)?tagIcon(t)+' ':'')+t).join('、')}\n`;
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
  return (
    <div className="scroll">
      <div className="hero"><div className="eyebrow">Export</div><div className="h1" style={{marginTop:12}}>もちだす</div></div>
      <div className="sec">
        <button className="exp-btn" onClick={toMd}>
          <span className="exp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 12h16M4 19h10"/></svg></span>
          <span><div className="nm">Markdown で書き出す</div><div className="ds">読書記録と地続きの形式</div></span>
        </button>
        <button className="exp-btn" onClick={toCsv}>
          <span className="exp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10"/></svg></span>
          <span><div className="nm">CSV で書き出す</div><div className="ds">スプレッドシートで分析用</div></span>
        </button>
      </div>
      <div className="empty-note" style={{marginTop:8}}>
        記録はすべてこの端末の中だけに保存されています。<br/>外に出すときだけ、ファイルになります。
      </div>
    </div>
  );
}

// ============ DAY SHEET (view existing / create new) ============
function DaySheet({ dayKey, records, tags, onSave, onDelete, onClose }){
  const existing = dayKey ? records[dayKey] : null;
  const [mood,setMood]=useState(existing?existing.mood:null);
  const [note,setNote]=useState(existing?existing.goodThings||'':'');
  useEffect(()=>{ const e=dayKey?records[dayKey]:null; setMood(e?e.mood:null); setNote(e?e.goodThings||'':''); },[dayKey]);
  if(!dayKey) return null;
  const d=new Date(dayKey+'T00:00:00');
  const tagIcon=(n)=>{ const t=tags.find(x=>x.name===n); return t&&t.icon?t.icon:''; };

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
          <div className="d-sec"><div className="d-lbl">Moments</div>
            <div className="d-tags">{existing.tags.map(t=><span key={t} className="d-tag">{tagIcon(t)&&<span>{tagIcon(t)}</span>}{t}</span>)}</div>
          </div>}
        {existing.goodThings &&
          <div className="d-sec"><div className="d-lbl">One good thing</div><div className="d-text">{existing.goodThings}</div></div>}
        {existing.why &&
          <div className="d-sec"><div className="d-lbl">Why</div><div className="d-text" style={{color:'var(--dim)'}}>{existing.why}</div></div>}
        <button className="del-btn" onClick={()=>onDelete(dayKey)}>この記録を削除</button>
      </>
    );
  }
  // new
  return (
    <>
      <div className="grab"></div>
      <div className="sheet-date">{fmtLong(d)}</div>
      <div className="d-lbl" style={{marginTop:6}}>Mood</div>
      <MoodSelector value={mood} onPick={(v)=>{setMood(v);buzz();}}/>
      <div className="d-lbl" style={{marginTop:22}}>One good thing <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
      <div className="card ta-card"><textarea className="ta" value={note} placeholder="小さいことでOK" onChange={e=>setNote(e.target.value)} rows={2}/></div>
      <button className="primary" disabled={!mood} onClick={()=>onSave(dayKey,{mood,tags:[],goodThings:note.trim(),why:''})}>保存する</button>
    </>
  );
}

// ============ TAG MANAGER SHEET ============
function TagManagerSheet({ tags, onChange, onClose }){
  const [list,setList]=useState(tags.map(t=>({...t})));
  const [ni,setNi]=useState(''); const [nn,setNn]=useState('');
  const upd=(i,f,v)=>{ const l=list.map((t,j)=>j===i?{...t,[f]:v}:t); setList(l); };
  const del=(i)=>setList(list.filter((_,j)=>j!==i));
  const add=()=>{ if(!nn.trim())return; setList([...list,{name:nn.trim(),icon:ni.trim()}]); setNi(''); setNn(''); };
  const commit=()=>{ onChange(list.filter(t=>t.name.trim())); onClose(); };
  return (
    <>
      <div className="grab"></div>
      <div className="sheet-date">タグを編集</div>
      {list.map((t,i)=>(
        <div key={i} className="tm-row">
          <input className="tm-ic" value={t.icon} maxLength={3} placeholder="🙂" onChange={e=>upd(i,'icon',e.target.value)}/>
          <input className="tm-nm" value={t.name} onChange={e=>upd(i,'name',e.target.value)}/>
          <button className="tm-del" onClick={()=>del(i)}>×</button>
        </div>
      ))}
      <div className="tm-add">
        <input className="tm-ic" value={ni} maxLength={3} placeholder="🙂" onChange={e=>setNi(e.target.value)}/>
        <input className="tm-nm" value={nn} placeholder="新しいタグ" onChange={e=>setNn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <button className="primary" onClick={add}>追加</button>
      </div>
      <button className="primary" style={{marginTop:18}} onClick={commit}>保存して閉じる</button>
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
  const [screen,setScreen] = useState('log');
  const [sheet,setSheet] = useState(null);
  const [toast,setToast] = useState(false);
  const toastT = useRef(null);

  // persist
  useEffect(()=>saveRecordsLS(records),[records]);
  useEffect(()=>saveTagsLS(tags),[tags]);

  const flash = useCallback(()=>{ setToast(true); clearTimeout(toastT.current); toastT.current=setTimeout(()=>setToast(false),1400); },[]);

  const saveDay = useCallback((key,data)=>{
    setRecords(prev=>({...prev,[key]:{...data,updatedAt:new Date().toISOString()}}));
    flash();
  },[flash]);
  const deleteDay = useCallback((key)=>{
    setRecords(prev=>{ const n={...prev}; delete n[key]; return n; });
    setSheet(null);
  },[]);

  const go = (id)=>{ if(id!==screen){ setScreen(id); buzz(14);} };

  return (
    <div className="device">
      <div className="aura"></div><div className="aura b"></div>
      <div className={'toast'+(toast?' show':'')}>保存しました</div>
      <div className="status">
        <span>9:41</span>
        <span className="r"><span>emlog</span></span>
        <span>100</span>
      </div>

      <div className="screen enter" key={screen}>
        {screen==='log' && <LogScreen records={records} tags={tags} onSaveToday={saveDay}
            onOpenDay={(k)=>setSheet({type:'day',dayKey:k})} onManageTags={()=>setSheet({type:'tags'})}/>}
        {screen==='calendar' && <CalendarScreen records={records} onOpenDay={(k)=>setSheet({type:'day',dayKey:k})}/>}
        {screen==='insights' && <InsightsScreen records={records}/>}
        {screen==='export' && <ExportScreen records={records} tags={tags}/>}
      </div>

      <nav className="nav">
        {TABS.map(t=>(
          <button key={t.id} className={'tab'+(screen===t.id?' on':'')} onClick={()=>go(t.id)} title={t.label}>
            <span className="ic">{t.ic}</span>
            <span className="tl">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* bottom sheet */}
      <div className={'overlay'+(sheet?' show':'')} onClick={(e)=>{ if(e.target.classList.contains('overlay')) setSheet(null); }}>
        <div className="sheet">
          {sheet && sheet.type==='day' &&
            <DaySheet dayKey={sheet.dayKey} records={records} tags={tags}
                   onSave={(k,d)=>{ saveDay(k,d); setSheet(null); }} onDelete={deleteDay} onClose={()=>setSheet(null)}/>}
          {sheet && sheet.type==='tags' &&
            <TagManagerSheet tags={tags} onChange={setTags} onClose={()=>setSheet(null)}/>}
        </div>
      </div>
    </div>
  );
}

// ============ LOG SCREEN ============
function LogScreen({ records, tags, onSaveToday, onOpenDay, onManageTags }){
  const tk = todayKey();
  const cur = records[tk] || null;
  const [mood,setMood] = useState(cur?cur.mood:null);
  const [sel,setSel] = useState(()=>new Set(cur?cur.tags:[]));
  const [good,setGood] = useState(cur?cur.goodThings||'':'');
  const [why,setWhy] = useState(cur?cur.why||'':'');
  const [ph] = useState(()=>PLACEHOLDERS[Math.floor(Math.random()*PLACEHOLDERS.length)]);
  const first = useRef(true);
  const whyShown = good.trim().length>0 || why.trim().length>0;
  const now = new Date();

  // autosave (only when a mood is chosen)
  useEffect(()=>{
    if(first.current){ first.current=false; return; }
    if(!mood) return;
    const t=setTimeout(()=>{
      onSaveToday(tk,{mood,tags:[...sel],goodThings:good.trim(),why:why.trim()});
    },450);
    return ()=>clearTimeout(t);
  },[mood,sel,good,why]); // eslint-disable-line

  const toggle=(name)=>{ const n=new Set(sel); n.has(name)?n.delete(name):n.add(name); setSel(n); };
  const pickMood=(v)=>{ setMood(v); buzz(); };

  // memories
  const mems=[]; const seen=new Set();
  const addMem=(d,label)=>{ const k=keyOf(d); if(k===tk||seen.has(k))return; const r=records[k]; if(!r)return; seen.add(k); mems.push({k,label,r}); };
  const mAgo=(n)=>{const d=new Date(now);d.setMonth(d.getMonth()-n);return d;};
  const yAgo=(n)=>{const d=new Date(now);d.setFullYear(d.getFullYear()-n);return d;};
  addMem(yAgo(1),'1Y ago'); addMem(mAgo(1),'1M ago'); addMem(mAgo(3),'3M ago');
  const memList=mems.slice(0,2);

  const tagIcon=(n)=>{ const t=tags.find(x=>x.name===n); return t&&t.icon?t.icon:''; };

  return (
    <div className="scroll">
      <div className="hero">
        <div className="eyebrow">{['SUN','MON','TUE','WED','THU','FRI','SAT'][now.getDay()]} · {ENMON[now.getMonth()]} {now.getDate()}</div>
        <div className="greet">{greeting()}</div>
      </div>

      <div className="sec">
        <div className="lbl">Mood</div>
        <MoodSelector value={mood} onPick={pickMood}/>
      </div>

      <div className="sec">
        <div className="lbl">Moments <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
        <div className="chips">
          {tags.map(t=>(
            <button key={t.name} className={'chip'+(sel.has(t.name)?' on':'')} onClick={()=>toggle(t.name)}>
              {t.icon&&<span>{t.icon}</span>}{t.name}
            </button>
          ))}
          <button className="chip ghost" onClick={onManageTags}>＋ 編集</button>
        </div>
      </div>

      <div className="sec">
        <div className="lbl">One good thing <span style={{color:'var(--dimmer)'}}>· 任意</span></div>
        <div className="card">
          <textarea className="ta" value={good} placeholder={ph} onChange={e=>setGood(e.target.value)} rows={2}/>
          <div className={'why'+(whyShown?' show':'')}>
            <div className="wl">Why · なぜできた？</div>
            <textarea className="ta" value={why} placeholder="自分のどんな工夫・選択が効いた？" onChange={e=>setWhy(e.target.value)} rows={2}/>
          </div>
        </div>

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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
