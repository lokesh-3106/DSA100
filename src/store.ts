import {useCallback,useEffect,useMemo,useState} from 'react'
import raw from './data/plan.json'

export type Problem={id:number;topic:string;title:string;pattern:string;slug:string;seed?:{bf:string;opt:string;mist:string}}
export type Day={date:string;day:string;focus:string;pid:number|null}
export type Prog={solved?:string;re:string[];conf:number;bf:string;opt:string;mist:string}
export type State={prog:Record<number,Prog>;days:Record<string,boolean>}
// EXPANDING TO 250+: append problems/calendar entries to src/data/plan.json (or add plan2027.json and concat here).
export const PLAN=raw as unknown as {title:string;start:string;end:string;problems:Problem[];calendar:Day[];
  targets:{month:string;range:string;target:number;goal:string}[];roadmap:{topic:string;concepts:string[]}[];
  routine:{time:string;task:string;rule:string}[];steps:{n:string;method:string;what:string}[]}

const KEY='dsa100.v1'
export const lc=(p:Problem)=>`https://leetcode.com/problems/${p.slug}/`
export const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
export const shift=(d:string,n:number)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
export const diffDays=(a:string,b:string)=>Math.round((+new Date(b+'T00:00:00Z')-+new Date(a+'T00:00:00Z'))/864e5)
export const blank=():Prog=>({re:[],conf:0,bf:'',opt:'',mist:''})
export const isRevision=(d:Day)=>/revision|review/i.test(d.focus)

function load():State{
  try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch{}
  const sd=PLAN.problems.find(p=>p.seed)
  return {prog:sd?{[sd.id]:{...blank(),bf:sd.seed!.bf,opt:sd.seed!.opt,mist:sd.seed!.mist}}:{},days:{}}
}

export function useStore(){
  const [s,setS]=useState<State>(load)
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}},[s])
  const get=useCallback((id:number):Prog=>({...blank(),...s.prog[id]}),[s])
  const patch=(id:number,p:Partial<Prog>)=>setS(o=>({...o,prog:{...o.prog,[id]:{...blank(),...o.prog[id],...p}}}))
  const toggleSolved=(id:number)=>patch(id,{solved:get(id).solved?undefined:today()})
  const addRe=(id:number)=>patch(id,{re:[...get(id).re,today()]})
  const undoRe=(id:number)=>patch(id,{re:get(id).re.slice(0,-1)})
  const toggleDay=(d:string)=>setS(o=>({...o,days:{...o.days,[d]:!o.days[d]}}))
  const byDate=useMemo(()=>{const m=new Map<string,Day[]>();PLAN.calendar.forEach(c=>m.set(c.date,[...(m.get(c.date)||[]),c]));return m},[])
  const dayDone=(date:string)=>{const e=byDate.get(date)||[];const ps=e.filter(x=>x.pid);return ps.length?ps.every(x=>get(x.pid!).solved):!!s.days[date]}

  const stats=useMemo(()=>{
    const ids=PLAN.problems.map(p=>p.id),ps=ids.map(i=>({id:i,...blank(),...s.prog[i]}))
    const solved=ps.filter(p=>p.solved),act=new Set<string>()
    Object.keys(s.days).forEach(k=>s.days[k]&&act.add(k));ps.forEach(p=>{p.solved&&act.add(p.solved);p.re.forEach(r=>act.add(r))})
    let d=today();if(!act.has(d))d=shift(d,-1);let streak=0;while(act.has(d)){streak++;d=shift(d,-1)}
    const sorted=[...act].sort();let best=0,run=0
    sorted.forEach((x,i)=>{run=i&&diffDays(sorted[i-1],x)===1?run+1:1;best=Math.max(best,run)})
    const t=today(),total=PLAN.problems.length
    const left=Math.max(0,diffDays(t<PLAN.start?PLAN.start:t,PLAN.end)+1)
    const due=solved.filter(p=>!p.re.length&&diffDays(p.solved!,t)>=2).length
    return {solved:solved.length,total,pct:Math.round(solved.length/total*100),streak,best,left,due,
      resolved:ps.filter(p=>p.re.length).length,act,revLeft:PLAN.calendar.filter(c=>isRevision(c)&&c.date>=t&&!dayDone(c.date)).length}
  },[s])
  const reset=()=>{localStorage.removeItem(KEY);setS({prog:{},days:{}})}
  return {s,setS,get,patch,toggleSolved,addRe,undoRe,toggleDay,byDate,dayDone,stats,reset}
}
export type Store=ReturnType<typeof useStore>
