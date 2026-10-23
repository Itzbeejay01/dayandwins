import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { BookHeart, CalendarDays, ChartNoAxesColumn, ChevronRight, Flame, Heart, LogOut, Plus, Settings2, Sparkles, Trash2, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import './days-wins.css';

type Mood = 'radiant' | 'peaceful' | 'grounded' | 'tender' | 'reflective';
type Entry = { id: number; entry_date: string; mood: Mood; body: string | null; little_win: string | null };
type Props = { entries: Entry[]; stats: { streak: number; entries: number; wins: number } };
const moods: { value: Mood; label: string; symbol: string; color: string }[] = [
    { value: 'radiant', label: 'Radiant', symbol: '☀', color: '#ffe8a3' },
    { value: 'peaceful', label: 'Peaceful', symbol: '☁', color: '#dcd1f5' },
    { value: 'grounded', label: 'Grounded', symbol: '✿', color: '#d5f0df' },
    { value: 'tender', label: 'Tender', symbol: '♥', color: '#ffdccb' },
    { value: 'reflective', label: 'Reflect', symbol: '☾', color: '#e8e3f5' },
];
const journalImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvodyPv4mYkUzGv3MSmzX_fdwrKE6veXV5BDjt5V8haP9ybUVIolsYH79xObXZFyqq4d7aCXixpyiuub_nmOU5Ws_FSGlzpmzxX25YHduUHnNcq9GuAkLWsM91Bs9_8y_lNXLTHyQQ3NhXT76-dbu-9gPP8RUPIX-BAoCp33zRP1QtkVDhCCWmTuEE8dVh00RstFcvr3zH2UX33LdryZ01JyvvH2smdJNQ742I-g4kSjttHM-KBVS2kA';
const localDate = () => { const now = new Date(); return [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-'); };
const formatDate = (date: string) => new Date(date.slice(0,10)+'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
function Logo({ large = false }: { large?: boolean }) {
    return <span className={'dw-logo ' + (large ? 'dw-logo-large' : '')}><span className="dw-logo-book">✦</span><span>Days <i>&</i> Wins</span></span>;
}
function MoodPicker({ selected, onSelect }: { selected: Mood; onSelect: (m: Mood) => void }) {
    return <div className="dw-moods">{moods.map(m => <button key={m.value} type="button" aria-pressed={selected===m.value} className={'dw-mood '+(selected===m.value?'selected':'')} style={{background:m.color}} onClick={()=>onSelect(m.value)}><span>{m.symbol}</span><small>{m.label}</small></button>)}</div>;
}
export default function DaysWins({ entries, stats }: Props) {
    const [tab, setTab] = useState<'today'|'journal'|'growth'>('today');
    const [splash, setSplash] = useState(() => typeof window !== 'undefined' && !window.sessionStorage.getItem('dw-launched'));
    const [editing, setEditing] = useState(false);
    const [settings, setSettings] = useState(false);
    const { props } = usePage<{auth?:{user?:{name:string}}}>();
    const name = props.auth?.user?.name?.split(' ')[0] || 'there';
    const form = useForm({entry_date:localDate(), mood:'peaceful' as Mood, body:'', little_win:''});
    useEffect(()=>{ if(!splash)return; const timer=window.setTimeout(()=>{sessionStorage.setItem('dw-launched','1');setSplash(false)},1850); return ()=>window.clearTimeout(timer); },[splash]);
    const openEditor = (entry?:Entry) => {form.clearErrors();form.setData({entry_date:entry?.entry_date?.slice(0,10)||localDate(),mood:entry?.mood||'peaceful',body:entry?.body||'',little_win:entry?.little_win||''});setEditing(true);};
    const save = (e:React.FormEvent) => {e.preventDefault();form.post('/journal-entries',{preserveScroll:true,onSuccess:()=>{setEditing(false);form.reset();}})};
    const todayEntry=entries.find(e=>e.entry_date.slice(0,10)===localDate());
    const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
    return <div className="dw-root"><Head title="Days & Wins" />
        {splash && <div className="dw-splash" role="status" aria-label="Opening Days and Wins"><div className="dw-splash-mark"><div className="dw-splash-book">✦</div></div><Logo large/><p>Every little win matters.</p><span className="dw-loading" /></div>}
        <div className="dw-app">
            <header className="dw-header"><Logo/><button aria-label="Settings" className="dw-icon" onClick={()=>setSettings(true)}><Settings2 size={20}/></button></header>
            <main className="dw-main">
                {tab==='today' && <section className="dw-stack">
                    <div className="dw-greeting"><div><strong>Hey, {name} <span>✦</span></strong><p>{new Date().toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric'})}</p></div><span className="dw-avatar">{name.charAt(0).toUpperCase()}</span></div>
                    <div className="dw-hero"><div><h1>Make today <em>count.</em></h1><p>One day. One little win.</p><button className="dw-primary" onClick={()=>openEditor(todayEntry)}><Plus size={17}/> {todayEntry?'Edit today':'Capture today'}</button></div><img src={journalImage} alt="Pastel 3D journal with golden star" /></div>
                    <div className="dw-section-head"><span>HOW ARE YOU FEELING?</span><span>Daily pulse</span></div>
                    <MoodPicker selected={todayEntry?.mood||form.data.mood} onSelect={m=>{form.setData('mood',m);openEditor(todayEntry);form.setData(d=>({...d,mood:m}));}}/>
                    <div className="dw-win"><span className="dw-win-icon"><Trophy size={24}/></span><div><small>TODAY'S LITTLE WIN</small><strong>{todayEntry?.little_win||'A small win is still a win.'}</strong></div><button aria-label="Add a little win" onClick={()=>openEditor(todayEntry)}><ChevronRight size={19}/></button></div>
                    <div className="dw-section-head"><span>RECENT MOMENTS</span><button onClick={()=>setTab('journal')}>See all →</button></div>
                    {entries.length?<button className="dw-entry" onClick={()=>openEditor(entries[0])}><span className="dw-entry-icon">{moods.find(m=>m.value===entries[0].mood)?.symbol}</span><span><strong>{formatDate(entries[0].entry_date)}</strong><small>{entries[0].body||entries[0].little_win||'A little moment worth keeping'}</small></span><ChevronRight size={18}/></button>:<div className="dw-empty">Your first memory starts today. ✦</div>}
                </section>}
                {tab==='journal' && <section className="dw-stack"><div className="dw-title"><div><small>YOUR MOMENTS</small><h1>My <em>Journal</em></h1></div><button className="dw-round" aria-label="New entry" onClick={()=>openEditor()}><Plus/></button></div><div className="dw-journal-list">{entries.length?entries.map(entry=><article className="dw-journal-card" key={entry.id}><button className="dw-entry dw-entry-full" onClick={()=>openEditor(entry)}><span className="dw-entry-icon">{moods.find(m=>m.value===entry.mood)?.symbol}</span><span><strong>{formatDate(entry.entry_date)}</strong><small>{entry.body||entry.little_win||'A moment to remember'}</small>{entry.little_win&&<span className="dw-mini-win">✦ {entry.little_win}</span>}</span><ChevronRight size={18}/></button><button className="dw-delete" aria-label={'Delete '+formatDate(entry.entry_date)} onClick={()=>{if(window.confirm('Delete this entry?'))router.delete('/journal-entries/'+entry.id)}}><Trash2 size={15}/></button></article>):<div className="dw-empty">No entries yet. Start with today.</div>}</div></section>}
                {tab==='growth' && <section className="dw-stack"><div className="dw-title"><div><small>YOUR JOURNEY</small><h1>My <em>Growth</em></h1></div><span className="dw-growth-spark">✦</span></div><div className="dw-streak"><Flame size={36}/><div><strong>{stats.streak} day streak</strong><small>Keep showing up for yourself.</small></div></div><div className="dw-stats"><div><BookHeart size={20}/><strong>{stats.entries}</strong><small>Journal entries</small></div><div><Trophy size={20}/><strong>{stats.wins}</strong><small>Little wins</small></div></div><div className="dw-chart"><strong>Last 7 days</strong><div className="dw-week">{days.map(day=>{const entry=entries.find(e=>e.entry_date.slice(0,10)===day);return <div key={day}><span className={'dw-day-dot '+(entry?'filled':'')}>{entry?'✦':'·'}</span><small>{new Date(day+'T12:00:00').toLocaleDateString('en',{weekday:'short'}).slice(0,1)}</small></div>})}</div></div><div className="dw-win"><span className="dw-win-icon"><Heart size={23}/></span><div><small>EVERY LITTLE WIN MATTERS</small><strong>{stats.wins?stats.wins+' moments worth celebrating':'Your journey starts with one moment.'}</strong></div></div></section>}
            </main>
            <nav className="dw-nav" aria-label="Main navigation">{([{id:'today',label:'Today',icon:CalendarDays},{id:'journal',label:'Journal',icon:BookHeart},{id:'growth',label:'Growth',icon:ChartNoAxesColumn}] as const).map(item=><button key={item.id} className={tab===item.id?'active':''} onClick={()=>setTab(item.id)}><item.icon size={20}/><span>{item.label}</span></button>)}</nav>
        </div>
        {editing&&<div className="dw-overlay" onClick={()=>setEditing(false)}><section className="dw-sheet" role="dialog" aria-modal="true" aria-label="Capture today" onClick={e=>e.stopPropagation()}><header><div><small>A MOMENT FOR YOU</small><h2>Capture <em>today.</em></h2></div><button className="dw-icon" onClick={()=>setEditing(false)} aria-label="Close"><X/></button></header><form onSubmit={save}><label className="dw-label" htmlFor="entry-date">Date</label><input id="entry-date" type="date" max={localDate()} value={form.data.entry_date} onChange={e=>form.setData('entry_date',e.target.value)} required/><label className="dw-label">How are you feeling?</label><MoodPicker selected={form.data.mood} onSelect={m=>form.setData('mood',m)}/><label className="dw-label" htmlFor="journal-body">How was your day?</label><textarea id="journal-body" placeholder="Write a little or a lot..." value={form.data.body} onChange={e=>form.setData('body',e.target.value)} rows={5}/><label className="dw-label" htmlFor="little-win">Today's little win</label><input id="little-win" placeholder="Something worth celebrating..." value={form.data.little_win} onChange={e=>form.setData('little_win',e.target.value)}/>{Object.values(form.errors).map((error,i)=><p className="dw-error" key={i}>{error}</p>)}<button className="dw-primary dw-save" disabled={form.processing}>{form.processing?'Saving...':'Save my moment ✦'}</button></form></section></div>}
        {settings&&<div className="dw-overlay" onClick={()=>setSettings(false)}><section className="dw-sheet dw-settings" role="dialog" aria-modal="true" aria-label="Settings" onClick={e=>e.stopPropagation()}><header><h2>Settings</h2><button className="dw-icon" onClick={()=>setSettings(false)} aria-label="Close"><X/></button></header><div className="dw-setting-profile"><span className="dw-avatar">{name.charAt(0).toUpperCase()}</span><strong>{props.auth?.user?.name}</strong></div><Link href="/settings/profile"><Settings2 size={19}/> Profile & preferences <ChevronRight size={17}/></Link><Link href="/settings/appearance"><Sparkles size={19}/> Appearance <ChevronRight size={17}/></Link><Link href="/logout" method="post" as="button"><LogOut size={19}/> Sign out <ChevronRight size={17}/></Link></section></div>}
    </div>;
}
