import {useMemo,useState,ReactNode} from 'react'
import {LayoutDashboard,CalendarDays,ListChecks,Map as MapIcon,NotebookPen,Clock,BarChart3,Settings as Cog,Star,ExternalLink,Check,Undo2,Search,X,Flame,Target,Hourglass,RefreshCw,Plus,Minus,Download,Upload,Trash2} from 'lucide-react'
import {PLAN,useStore,Store,lc,today,diffDays,isRevision,blank} from './store'

const TABS=[['Dashboard',LayoutDashboard],['Calendar',CalendarDays],['Problems',ListChecks],['Roadmap',MapIcon],['Notebook',NotebookPen],['Routine',Clock],['Statistics',BarChart3],['Settings',Cog]] as const
const FLOW=['LEARN','SOLVE','RECORD','RE-SOLVE','IMPROVE']
const TOPICS=PLAN.roadmap.map(r=>r.topic)
const P=(id:number)=>PLAN.problems.find(p=>p.id===id)!

const Bar=({v,max=100,c='bg-emerald-500'}:{v:number;max?:number;c?:string})=>
  <div className="h-2 w-full rounded bg-zinc-800"><div className={`h-2 rounded ${c} transition-all`} style={{width:`${max?Math.min(100,v/max*100):0}%`}}/></div>
const Stat=({i,l,v,s}:{i:ReactNode;l:string;v:ReactNode;s?:string})=>
  <div className="card"><div className="flex items-center gap-2 text-xs text-zinc-400">{i}{l}</div><div className="mt-1 font-mono text-2xl font-semibold">{v}</div>{s&&<div className="text-xs text-zinc-500">{s}</div>}</div>
const Stars=({v,on}:{v:number;on:(n:number)=>void}):JSX.Element=>
  <span className="inline-flex">{[1,2,3,4,5].map(n=><button key={n} title={`${n}`} onClick={e=>{e.stopPropagation();on(v===n?0:n)}}><Star size={16} className={n<=v?'fill-amber-400 text-amber-400':'text-zinc-600'}/></button>)}</span>

function Notes({id,st}:{id:number;st:Store}){
  const p=st.get(id)
  const F=[['Pattern',null],['Brute Force','bf'],['Optimized Idea','opt'],['My Mistake','mist']] as const
  return <div className="space-y-3">
    <div><label className="text-xs text-zinc-400">Problem</label><div className="inp">{id}. {P(id).title}</div></div>
    <div><label className="text-xs text-zinc-400">Pattern</label><div className="inp">{P(id).pattern}</div></div>
    {F.slice(1).map(([l,k])=><div key={l}><label className="text-xs text-zinc-400">{l}</label>
      <textarea rows={2} className="inp" value={p[k!]} placeholder={l==='My Mistake'?'What went wrong?':'Plain language + complexity'} onChange={e=>st.patch(id,{[k!]:e.target.value})}/></div>)}
  </div>
}

function Modal({id,st,close}:{id:number;st:Store;close:()=>void}){
  const pr=P(id),p=st.get(id)
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center" onClick={close}>
    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 md:rounded-2xl" onClick={e=>e.stopPropagation()}>
      <div className="mb-3 flex items-start justify-between gap-3"><div><div className="font-mono text-xs text-emerald-400">#{id} · {pr.topic}</div><h2 className="text-lg font-semibold">{pr.title}</h2><div className="text-sm text-zinc-400">{pr.pattern}</div></div>
        <button onClick={close}><X/></button></div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <a className="btn" href={lc(pr)} target="_blank" rel="noreferrer"><ExternalLink size={14}/>LeetCode</a>
        <button className={`btn ${p.solved?'':'btn-p'}`} onClick={()=>st.toggleSolved(id)}>{p.solved?<><Undo2 size={14}/>Undo ({p.solved})</>:<><Check size={14}/>Mark complete</>}</button>
      </div>
      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs text-zinc-400">Confidence</div><Stars v={p.conf} on={n=>st.patch(id,{conf:n})}/></div>
        <div><div className="text-xs text-zinc-400">Re-solved ×{p.re.length}</div>
          <div className="flex gap-1"><button className="btn" onClick={()=>st.addRe(id)}><Plus size={14}/>Re-solve</button><button className="btn" disabled={!p.re.length} onClick={()=>st.undoRe(id)}><Minus size={14}/></button></div></div>
      </div>
      <Notes id={id} st={st}/>
    </div></div>
}

function Dashboard({st,open}:{st:Store;open:(i:number)=>void}){
  const t=today(),{stats:x}=st
  const entries=st.byDate.get(PLAN.calendar.some(c=>c.date===t)?t:t<PLAN.start?PLAN.start:PLAN.end)||[]
  const monthOf=(pid:number)=>PLAN.calendar.find(c=>c.pid===pid)?.date.slice(0,7)
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat i={<Target size={14}/>} l="Solved" v={`${x.solved}/${x.total}`} s={`${x.pct}% complete`}/>
      <Stat i={<Flame size={14} className="text-orange-400"/>} l="Streak" v={`${x.streak}d`} s={`best ${x.best}d`}/>
      <Stat i={<Hourglass size={14}/>} l="Days left" v={x.left} s={`ends ${PLAN.end}`}/>
      <Stat i={<RefreshCw size={14}/>} l="Re-solved" v={x.resolved} s={`${x.due} due · ${x.revLeft} revision days left`}/>
    </div>
    <div className="card"><div className="mb-2 flex justify-between text-sm"><span>Overall progress</span><span className="font-mono">{x.pct}%</span></div><Bar v={x.pct}/>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">{FLOW.map((f,i)=><span key={f} className="rounded bg-zinc-800 px-2 py-1">{f}{i<4&&' →'}</span>)}</div></div>
    <div className="card"><h3 className="mb-2 font-semibold">Today · {t}</h3>
      {entries.length?entries.map((e,i)=><div key={i} className="flex items-center justify-between gap-2 border-t border-zinc-800 py-2 first:border-0">
        <div className="text-sm"><div className="text-xs text-zinc-400">{e.focus}</div>{e.pid?<button className="text-emerald-300 hover:underline" onClick={()=>open(e.pid!)}>#{e.pid} {P(e.pid).title}</button>:'Review day — revisit your notebook'}</div>
        {e.pid?<button className={`btn ${st.get(e.pid).solved?'':'btn-p'}`} onClick={()=>st.toggleSolved(e.pid!)}>{st.get(e.pid).solved?<Undo2 size={14}/>:<Check size={14}/>}</button>
          :<button className="btn" onClick={()=>st.toggleDay(e.date)}>{st.s.days[e.date]?'Undo':'Done'}</button>}</div>):<div className="text-sm text-zinc-400">Nothing scheduled.</div>}</div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card"><h3 className="mb-3 font-semibold">Monthly targets</h3>{PLAN.targets.map(m=>{
        const key=({October:'10',November:'11',December:'12'} as Record<string,string>)[m.month]
        const n=PLAN.problems.filter(p=>st.get(p.id).solved&&monthOf(p.id)?.slice(5)===key).length
        return <div key={m.month} className="mb-3"><div className="flex justify-between text-sm"><span>{m.month}</span><span className="font-mono">{n}/{m.target}</span></div><Bar v={n} max={m.target} c="bg-sky-500"/><div className="mt-1 text-xs text-zinc-500">{m.goal}</div></div>})}</div>
      <div className="card"><h3 className="mb-3 font-semibold">Topic progress</h3><div className="space-y-2">{TOPICS.map(tp=>{const ps=PLAN.problems.filter(p=>p.topic===tp),n=ps.filter(p=>st.get(p.id).solved).length
        return <div key={tp}><div className="flex justify-between text-xs"><span>{tp}</span><span className="font-mono">{n}/{ps.length}</span></div><Bar v={n} max={ps.length}/></div>})}</div></div>
    </div></div>
}

function Calendar({st,open}:{st:Store;open:(i:number)=>void}){
  const months=[...new Set(PLAN.calendar.map(c=>c.date.slice(0,7)))],[m,setM]=useState(months.find(x=>x===today().slice(0,7))||months[0])
  const [sel,setSel]=useState(today()),first=new Date(m+'-01T00:00:00Z'),pad=(first.getUTCDay()+6)%7
  const len=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate()
  const selE=st.byDate.get(sel)||[]
  return <div className="space-y-4">
    <div className="flex gap-2">{months.map(x=><button key={x} className={`btn ${x===m?'btn-p':''}`} onClick={()=>setM(x)}>{new Date(x+'-01T00:00:00Z').toLocaleString('en',{month:'long',timeZone:'UTC'})}</button>)}</div>
    <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d}>{d}</div>)}
      {Array.from({length:pad}).map((_,i)=><div key={'p'+i}/>)}
      {Array.from({length:len}).map((_,i)=>{const d=`${m}-${String(i+1).padStart(2,'0')}`,es=st.byDate.get(d)
        if(!es)return <div key={d} className="rounded-lg border border-zinc-900 p-1 opacity-30">{i+1}</div>
        const done=st.dayDone(d),rev=es.some(isRevision)
        return <button key={d} onClick={()=>setSel(d)} className={`min-h-[3.5rem] rounded-lg border p-1 text-left ${done?'border-emerald-600 bg-emerald-600/20':rev?'border-violet-700 bg-violet-600/10':'border-zinc-800 bg-zinc-900'} ${d===sel?'ring-2 ring-sky-500':''} ${d===today()?'font-bold':''}`}>
          <div className="text-xs">{i+1}</div><div className="font-mono text-[10px] text-zinc-400">{es.filter(e=>e.pid).map(e=>'#'+e.pid).join(' ')||(rev?'REV':'')}</div></button>})}</div>
    <div className="flex gap-4 text-xs text-zinc-400"><span>■ <span className="text-emerald-500">done</span></span><span>■ <span className="text-violet-500">revision/review</span></span></div>
    <div className="card"><h3 className="mb-2 font-semibold">{sel}</h3>{selE.length?selE.map((e,i)=><div key={i} className="flex items-center justify-between border-t border-zinc-800 py-2 text-sm first:border-0">
      <div><div className="text-xs text-zinc-400">{e.day} · {e.focus}</div>{e.pid?<button className="text-emerald-300 hover:underline" onClick={()=>open(e.pid!)}>#{e.pid} {P(e.pid).title} <span className="text-zinc-500">· {P(e.pid).pattern}</span></button>:<span>Review day</span>}</div>
      {!e.pid&&<button className="btn" onClick={()=>st.toggleDay(e.date)}>{st.s.days[e.date]?'Undo':'Mark done'}</button>}</div>):<div className="text-sm text-zinc-400">Not in plan.</div>}</div></div>
}

function Problems({st,open}:{st:Store;open:(i:number)=>void}){
  const [q,setQ]=useState(''),[topic,setTopic]=useState(''),[status,setStatus]=useState('all'),[sort,setSort]=useState('id')
  const list=useMemo(()=>{
    let l=PLAN.problems.filter(p=>{const g=st.get(p.id)
      return (!topic||p.topic===topic)&&(`${p.title} ${p.pattern} ${p.id}`.toLowerCase().includes(q.toLowerCase()))&&
      (status==='all'||(status==='todo'&&!g.solved)||(status==='solved'&&g.solved)||(status==='re'&&g.solved&&!g.re.length)||(status==='low'&&g.solved&&g.conf>0&&g.conf<=2))})
    const k:Record<string,(a:typeof l[0],b:typeof l[0])=>number>={id:(a,b)=>a.id-b.id,title:(a,b)=>a.title.localeCompare(b.title),topic:(a,b)=>a.topic.localeCompare(b.topic)||a.id-b.id,conf:(a,b)=>st.get(a.id).conf-st.get(b.id).conf}
    return [...l].sort(k[sort])},[q,topic,status,sort,st.s])
  const sel='inp !w-auto'
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2"><div className="relative min-w-[10rem] flex-1"><Search size={14} className="absolute left-3 top-3 text-zinc-500"/><input className="inp pl-9" placeholder="Search title, pattern, #" value={q} onChange={e=>setQ(e.target.value)}/></div>
      <select className={sel} value={topic} onChange={e=>setTopic(e.target.value)}><option value="">All topics</option>{TOPICS.map(t=><option key={t}>{t}</option>)}</select>
      <select className={sel} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All</option><option value="todo">Unsolved</option><option value="solved">Solved</option><option value="re">Needs re-solve</option><option value="low">Low confidence</option></select>
      <select className={sel} value={sort} onChange={e=>setSort(e.target.value)}><option value="id">Sort: #</option><option value="title">Title</option><option value="topic">Topic</option><option value="conf">Confidence</option></select></div>
    <div className="text-xs text-zinc-500">{list.length} problems</div>
    <div className="space-y-2">{list.map(p=>{const g=st.get(p.id);return <div key={p.id} onClick={()=>open(p.id)} className="card flex cursor-pointer items-center gap-3 !p-3 hover:border-zinc-600">
      <button onClick={e=>{e.stopPropagation();st.toggleSolved(p.id)}} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${g.solved?'border-emerald-500 bg-emerald-500/20 text-emerald-300':'border-zinc-700'}`}>{g.solved&&<Check size={16}/>}</button>
      <div className="min-w-0 flex-1"><div className="truncate text-sm"><span className="font-mono text-zinc-500">{p.id}.</span> {p.title}</div><div className="truncate text-xs text-zinc-500">{p.topic} · {p.pattern}</div></div>
      <div className="hidden sm:block"><Stars v={g.conf} on={n=>st.patch(p.id,{conf:n})}/></div>
      <span className="font-mono text-xs text-zinc-400" title="re-solves">↻{g.re.length}</span>
      <a href={lc(p)} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-zinc-400 hover:text-emerald-300"><ExternalLink size={16}/></a></div>})}</div></div>
}

function Roadmap({st}:{st:Store}){
  return <div className="grid gap-3 md:grid-cols-2">{PLAN.roadmap.map(r=>{const ps=PLAN.problems.filter(p=>p.topic===r.topic),n=ps.filter(p=>st.get(p.id).solved).length
    return <div key={r.topic} className="card"><div className="mb-1 flex justify-between"><h3 className="font-semibold">{r.topic}</h3><span className="font-mono text-xs text-zinc-400">{n}/{ps.length}</span></div><Bar v={n} max={ps.length}/>
      <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-zinc-300">{r.concepts.map(c=><li key={c}>{c}</li>)}</ul></div>})}</div>
}

function Notebook({st}:{st:Store}){
  const [id,setId]=useState(PLAN.problems[0].id)
  const filled=PLAN.problems.filter(p=>{const g=st.get(p.id);return g.bf||g.opt||g.mist})
  return <div className="grid gap-4 md:grid-cols-2">
    <div className="card"><select className="inp mb-3" value={id} onChange={e=>setId(+e.target.value)}>{PLAN.problems.map(p=><option key={p.id} value={p.id}>{p.id}. {p.title}</option>)}</select><Notes id={id} st={st}/></div>
    <div className="space-y-2"><h3 className="font-semibold">Entries ({filled.length})</h3>{filled.map(p=>{const g=st.get(p.id);return <div key={p.id} onClick={()=>setId(p.id)} className="card cursor-pointer space-y-1 !p-3 text-sm hover:border-zinc-600">
      <div className="font-medium">#{p.id} {p.title} <span className="text-xs text-zinc-500">· {p.pattern}</span></div>
      {g.bf&&<div><span className="text-zinc-500">Brute:</span> {g.bf}</div>}{g.opt&&<div><span className="text-zinc-500">Optimized:</span> {g.opt}</div>}{g.mist&&<div><span className="text-zinc-500">Mistake:</span> {g.mist}</div>}</div>})}</div></div>
}

function Routine(){
  return <div className="grid gap-4 md:grid-cols-2">
    <div className="card"><h3 className="mb-3 font-semibold">Daily routine</h3>{PLAN.routine.map(r=><div key={r.task} className="border-t border-zinc-800 py-2 first:border-0"><div className="flex justify-between gap-2 text-sm"><span>{r.task}</span><span className="font-mono text-xs text-emerald-400">{r.time}</span></div><div className="text-xs text-zinc-500">{r.rule}</div></div>)}</div>
    <div className="card"><h3 className="mb-3 font-semibold">How to learn each problem</h3>{PLAN.steps.map(r=><div key={r.n} className="flex gap-3 border-t border-zinc-800 py-2 first:border-0"><span className="font-mono text-emerald-400">{r.n}</span><div className="text-sm">{r.method}<div className="text-xs text-zinc-500">{r.what}</div></div></div>)}</div></div>
}

function Statistics({st}:{st:Store}){
  const x=st.stats,weeks=Math.ceil((diffDays(PLAN.start,PLAN.end)+1)/7),per=Array(weeks).fill(0)
  PLAN.problems.forEach(p=>{const s=st.get(p.id).solved;if(s){const w=Math.floor(diffDays(PLAN.start,s)/7);if(w>=0&&w<weeks)per[w]++}})
  const conf=[1,2,3,4,5].map(n=>PLAN.problems.filter(p=>st.get(p.id).conf===n).length),elapsed=Math.max(1,Math.min(diffDays(PLAN.start,today())+1,diffDays(PLAN.start,PLAN.end)+1))
  const mx=Math.max(1,...per)
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat i={null} l="Solved" v={x.solved}/><Stat i={null} l="Best streak" v={`${x.best}d`}/><Stat i={null} l="Avg / day" v={(x.solved/elapsed).toFixed(2)}/><Stat i={null} l="Active days" v={x.act.size}/></div>
    <div className="card"><h3 className="mb-3 font-semibold">Solved per week</h3><div className="flex h-32 items-end gap-1">{per.map((n,i)=><div key={i} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="font-mono text-[10px] text-zinc-400">{n||''}</span><div className="w-full rounded-t bg-emerald-500" style={{height:`${n/mx*100}%`,minHeight:n?4:1}}/><span className="text-[10px] text-zinc-600">W{i+1}</span></div>)}</div></div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card"><h3 className="mb-3 font-semibold">Confidence</h3>{conf.map((n,i)=><div key={i} className="mb-2 flex items-center gap-2 text-xs"><span className="w-6">{i+1}★</span><div className="flex-1"><Bar v={n} max={PLAN.problems.length} c="bg-amber-400"/></div><span className="w-6 font-mono">{n}</span></div>)}</div>
      <div className="card"><h3 className="mb-3 font-semibold">By topic</h3>{TOPICS.map(tp=>{const ps=PLAN.problems.filter(p=>p.topic===tp),n=ps.filter(p=>st.get(p.id).solved).length;return <div key={tp} className="mb-2 flex items-center gap-2 text-xs"><span className="w-32 truncate">{tp}</span><div className="flex-1"><Bar v={n} max={ps.length}/></div><span className="w-10 font-mono">{n}/{ps.length}</span></div>})}</div></div></div>
}

function Settings({st}:{st:Store}){
  const exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(st.s,null,1)],{type:'application/json'}));a.download=`dsa100-backup-${today()}.json`;a.click()}
  const imp=(f?:File)=>f?.text().then(t=>{try{const j=JSON.parse(t);if(j.prog&&j.days)st.setS(j);else alert('Invalid backup')}catch{alert('Invalid backup')}})
  return <div className="card max-w-lg space-y-3"><h3 className="font-semibold">Data</h3><p className="text-sm text-zinc-400">Progress is saved in this browser (localStorage). Export a backup before clearing browser data.</p>
    <div className="flex flex-wrap gap-2"><button className="btn" onClick={exp}><Download size={14}/>Export</button>
      <label className="btn cursor-pointer"><Upload size={14}/>Import<input type="file" accept="application/json" hidden onChange={e=>imp(e.target.files?.[0])}/></label>
      <button className="btn text-red-400" onClick={()=>confirm('Erase all progress and notes?')&&st.reset()}><Trash2 size={14}/>Reset</button></div>
    <p className="text-xs text-zinc-500">Plan source: Excel workbook → src/data/plan.json · {PLAN.problems.length} problems · {PLAN.start} → {PLAN.end}</p></div>
}

export default function App(){
  const st=useStore(),[tab,setTab]=useState<string>('Dashboard'),[openId,setOpen]=useState<number|null>(null)
  void blank
  const V:Record<string,JSX.Element>={Dashboard:<Dashboard st={st} open={setOpen}/>,Calendar:<Calendar st={st} open={setOpen}/>,Problems:<Problems st={st} open={setOpen}/>,Roadmap:<Roadmap st={st}/>,Notebook:<Notebook st={st}/>,Routine:<Routine/>,Statistics:<Statistics st={st}/>,Settings:<Settings st={st}/>}
  return <div className="min-h-screen md:flex">
    <nav className="sticky top-0 z-40 flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950/95 p-2 backdrop-blur md:h-screen md:w-52 md:flex-col md:border-b-0 md:border-r md:p-3">
      <div className="hidden px-2 pb-3 font-mono text-sm font-bold text-emerald-400 md:block">{'</>'} DSA 100</div>
      {TABS.map(([n,I])=><button key={n} onClick={()=>setTab(n)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${tab===n?'bg-emerald-600/20 text-emerald-300':'text-zinc-400 hover:bg-zinc-900'}`}><I size={16}/>{n}</button>)}</nav>
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6"><h1 className="mb-4 text-xl font-semibold">{tab==='Dashboard'?PLAN.title:tab}</h1>{V[tab]}</main>
    {openId!==null&&<Modal id={openId} st={st} close={()=>setOpen(null)}/>}</div>
}
