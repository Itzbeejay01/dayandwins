import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    BookOpen, Bookmark, CalendarDays, Camera, Check, ChevronLeft, ChevronRight,
    Flame, Heart, ImagePlus, LogOut, MoreHorizontal, PenLine, Plus,
    Search, Settings2, Sparkles, Trash2, Trophy, X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './days-wins.css';

type Mood = 'radiant' | 'peaceful' | 'grounded' | 'tender' | 'reflective';
type Entry = {
    id: number; entry_date: string; mood: Mood; body: string | null;
    little_win: string | null; has_photo: boolean; is_favorite: boolean;
};
type MoodPoint = { date: string; mood: Mood | null; score: number | null };
type Stats = { streak: number; entries: number; wins: number; favorites: number; mood_flow: MoodPoint[] };
type Props = { entries: Entry[]; stats: Stats };
type Tab = 'today' | 'journal' | 'growth';
type Filter = 'all' | 'wins' | 'reflections' | 'favorites';

// Original Stitch-generated illustration URLs. The local SVG is an offline fallback.
const stitchArt = {
    journal: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvodyPv4mYkUzGv3MSmzX_fdwrKE6veXV5BDjt5V8haP9ybUVIolsYH79xObXZFyqq4d7aCXixpyiuub_nmOU5Ws_FSGlzpmzxX25YHduUHnNcq9GuAkLWsM91Bs9_8y_lNXLTHyQQ3NhXT76-dbu-9gPP8RUPIX-BAoCp33zRP1QtkVDhCCWmTuEE8dVh00RstFcvr3zH2UX33LdryZ01JyvvH2smdJNQ742I-g4kSjttHM-KBVS2kA',
    trophy: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfYysbX1xZAHCvm0kZYWOsm1bxi5Y6M7oZoqtYiSssnL9y9AHZsqleImEjCXeooFyFkthK48xN1cMQUiMgk7n-IoKLIKLTIc_kw9yhLoEVDz1xdgRPgGxMBCPednQyV-1HbpvpcOFHDYQMW4fRs6Gh2337JzP9Gs0EulGethJzD_yIIPPv27SoyLgGcrKM2bHWUuqPAIvgFRlTWsBD7qIVzVRdJhmG9YW8rr7qmUKpKp9QwvLyVmisAw',
    flame: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlwyvofVPuwLYoI3g2piZ4aV8H_E-rpcEGjzU5GwladNjRGA3iUSejRf7rtfBGcXAKULPlu31wzMiYQSKAxvj5WguuBDHULvhC3-W8M-r8q5NUKFGFhHIU9p9K6SMXcO6yhgNPCsIWXyzp_crmcs29Um7KV4Xqt6qSVqQ8lHtM9iPy0E5FOtowItGhHuvu_4X6w2GGAyY2TT-vM3NOdVuktkV0HuAhWcgrtRojTRB7WyN6Ui4qjEPbnA',
};

const moods: { value: Mood; label: string; icon: string; bg: string }[] = [
    { value: 'radiant', label: 'Radiant', icon: '☀', bg: '#ffe8a3' },
    { value: 'peaceful', label: 'Peaceful', icon: '☁', bg: '#e4d9fa' },
    { value: 'grounded', label: 'Grounded', icon: '♧', bg: '#d5f0df' },
    { value: 'tender', label: 'Tender', icon: '♡', bg: '#ffdccb' },
    { value: 'reflective', label: 'Reflect', icon: '☾', bg: '#e9e6f4' },
];
const moodByName = (name: Mood) => moods.find(mood => mood.value === name) ?? moods[1];
const localDate = (date = new Date()) =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const parseDate = (date: string) => new Date(date.slice(0, 10) + 'T12:00:00');
const niceDate = (date: string) => parseDate(date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
const entryHeading = (entry: Entry) => (entry.body?.trim().split(/[.!?\n]/)[0] || entry.little_win || 'A quiet moment').slice(0, 62);

function MoodPicker({ value, onChange }: { value: Mood; onChange: (mood: Mood) => void }) {
    return <div className="dw-moods" role="group" aria-label="Choose your mood">
        {moods.map(m => <button type="button" key={m.value} style={{ background: m.bg }}
            className={'dw-mood ' + (value === m.value ? 'selected' : '')}
            aria-pressed={value === m.value} onClick={() => onChange(m.value)}>
            <span aria-hidden="true">{m.icon}</span><small>{m.label}</small>
        </button>)}
    </div>;
}

function MoodGraph({ flow }: { flow: MoodPoint[] }) {
    const coords = flow.map((point, i) => point.score === null ? null : {
        x: 10 + i * 50, y: 118 - point.score * 21, mood: point.mood,
    });
    const segments: string[] = [];
    let part = '';
    coords.forEach(point => {
        if (!point) {
            if (part) segments.push(part);
            part = '';
        } else {
            part += (part ? ' L ' : 'M ') + point.x + ' ' + point.y;
        }
    });
    if (part) segments.push(part);

    const available = flow.filter(p => p.score !== null);
    const avg = available.length ? (available.reduce((acc, point) => acc + (point.score ?? 0), 0) / available.length).toFixed(1) : null;
    return <div className="dw-flow-card">
        <div className="dw-flow-heading"><div><h2>7-Day Mood Flow</h2><small>Rhythm of calm reflection</small></div><span>{avg ? 'Average: ' + avg + ' / 5' : 'No mood data yet'}</span></div>
        <svg className="dw-flow-svg" viewBox="0 0 320 132" role="img" aria-label="Mood scores for the last seven days">
            {[25, 55, 85, 115].map(y => <line key={y} x1="10" x2="310" y1={y} y2={y} stroke="#eee8f8" strokeDasharray="3 5" />)}
            {segments.map((segment, i) => <path key={i} d={segment} stroke="#8465c5" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>)}
            {coords.map((point, i) => point ? <circle key={i} cx={point.x} cy={point.y} r="4.3" stroke="#8465c5" strokeWidth="2" fill="#fff" /> : null)}
        </svg>
        <div className="dw-flow-legend">{flow.map(p => <div key={p.date}><span>{parseDate(p.date).toLocaleDateString('en', { weekday: 'short' })}</span><small style={{ background: p.mood ? moodByName(p.mood).bg : '#f4f0f9' }}>{p.mood ? moodByName(p.mood).label : '—'}</small></div>)}</div>
    </div>;
}

export default function DaysWins({ entries, stats }: Props) {
    const [tab, setTab] = useState<Tab>('today');
    const [editing, setEditing] = useState(false);
    const [settings, setSettings] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const { props } = usePage<{ auth: { user: { name: string; email: string } } }>();
    const firstName = props.auth?.user?.name?.trim().split(' ')[0] || 'friend';
    const today = localDate();
    const todayEntry = entries.find(entry => entry.entry_date.slice(0, 10) === today);
    const form = useForm({
        entry_date: today,
        mood: 'peaceful' as Mood,
        body: '',
        little_win: '',
        photo: null as File | null,
        remove_photo: false,
    });

    useEffect(() => {
        if (!form.data.photo) {
            setPhotoPreview(null);
            return;
        }
        const url = URL.createObjectURL(form.data.photo);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.photo]);

    const openEditor = (entry?: Entry, preferredMood?: Mood) => {
        form.clearErrors();
        form.setData({
            entry_date: entry?.entry_date.slice(0, 10) ?? today,
            mood: preferredMood ?? entry?.mood ?? 'peaceful',
            body: entry?.body ?? '',
            little_win: entry?.little_win ?? '',
            photo: null,
            remove_photo: false,
        });
        setEditing(true);
    };

    const saveEntry = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/journal-entries', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditing(false);
                form.reset();
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2500);
            },
        });
    };

    const filteredEntries = useMemo(() => entries.filter(entry => {
        if (selectedDay && entry.entry_date.slice(0, 10) !== selectedDay) return false;
        if (filter === 'wins' && !entry.little_win) return false;
        if (filter === 'reflections' && !entry.body) return false;
        if (filter === 'favorites' && !entry.is_favorite) return false;
        const q = search.trim().toLowerCase();
        return !q || [entry.body, entry.little_win, entry.mood, niceDate(entry.entry_date)].some(value => value?.toLowerCase().includes(q));
    }), [entries, selectedDay, filter, search]);

    const daysInWeek = useMemo(() => {
        const base = new Date();
        base.setDate(base.getDate() + weekOffset * 7);
        const day = base.getDay();
        base.setDate(base.getDate() - ((day + 6) % 7));
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(base);
            date.setDate(base.getDate() + i);
            return localDate(date);
        });
    }, [weekOffset]);

    const editExistingPhoto = entries.find(e => e.entry_date.slice(0, 10) === form.data.entry_date);
    const existingPhoto = editExistingPhoto?.has_photo && !form.data.remove_photo && !form.data.photo;
    const lastReflection = entries.find(entry => entry.body);

    return <div className="dw-root">
        <Head title="Days & Wins" />
        <div className="dw-app">
            <header className="dw-topbar">
                <div className="dw-topbar-brand"><img src="/brand/journal.svg" alt="" /><strong>{tab === 'today' ? 'Today' : tab === 'journal' ? 'Journal' : 'Growth'}</strong></div>
                <div className="dw-topbar-actions"><button type="button" aria-label="Capture an entry" onClick={() => openEditor(todayEntry)}><PenLine size={19}/></button>
                    <button type="button" aria-label="Open settings" onClick={() => setSettings(true)} className="dw-user-photo">{firstName.charAt(0).toUpperCase()}</button></div>
            </header>
            <main className="dw-main dw-stitch-main">
                {tab === 'today' && <section className="dw-stitch-stack">
                    <div className="dw-today-date"><span>{new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
                    <div className="dw-stitch-hero">
                        <div><h1>Make today count.</h1><p>Reflect on 1 little win &amp; mood.</p>
                        <button type="button" className="dw-stitch-cta" onClick={() => openEditor(todayEntry)}><Plus size={16}/>{todayEntry ? 'Edit today' : 'Capture today'}</button></div>
                        <img src={stitchArt.journal} alt="Floating lavender journal with golden star" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/brand/journal.svg'; }} />
                    </div>
                    <div className="dw-stitch-heading"><strong>HOW ARE YOU FEELING?</strong><small>Daily Pulse</small></div>
                    <MoodPicker value={todayEntry?.mood ?? 'peaceful'} onChange={m => openEditor(todayEntry, m)}/>
                    <div className="dw-stitch-heading"><strong>HIGHLIGHT OF THE DAY</strong><small>✦ {stats.streak} Day Streak</small></div>
                    <button type="button" className="dw-today-highlight" onClick={() => openEditor(todayEntry)}>
                        <span className="dw-highlight-art"><img src={stitchArt.trophy} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /><Trophy size={19}/></span><span><small>LITTLE WIN</small><strong>{todayEntry?.little_win ? '“' + todayEntry.little_win + '”' : 'A little win deserves to be remembered.'}</strong></span><MoreHorizontal size={18}/>
                    </button>
                    <div className="dw-stitch-heading"><strong>RECENT REFLECTION</strong><button type="button" onClick={() => setTab('journal')}>View all →</button></div>
                    {lastReflection ? <button type="button" className="dw-reflection" onClick={() => openEditor(lastReflection)}>
                        <span className="dw-reflection-title"><span className="dw-purple-dot"/> <strong>{entryHeading(lastReflection)}</strong><small>{niceDate(lastReflection.entry_date)}</small></span>
                        <p>“{lastReflection.body?.slice(0, 130)}{(lastReflection.body?.length ?? 0) > 130 ? '…' : ''}”</p>
                        <div><span>{moodByName(lastReflection.mood).label}</span><span>{lastReflection.little_win ? '✦ Little win' : '♡ Cherish'}</span></div>
                    </button> : <div className="dw-empty">Your first reflection starts here. ✦</div>}
                    <div className="dw-rhythm"><div><strong>This Week’s Rhythm</strong><small>{stats.mood_flow.filter(point => point.mood).length} of 7 logged</small></div><div className="dw-rhythm-week">{stats.mood_flow.map(point => <div key={point.date}><small>{parseDate(point.date).toLocaleDateString('en', { weekday: 'narrow' })}</small><span className={point.mood ? 'logged' : ''}>{point.mood ? '✓' : '–'}</span></div>)}</div></div>
                </section>}
                {tab === 'journal' && <section className="dw-stitch-stack">
                    <div className="dw-page-heading"><div><span>EVERY MOMENT COUNTS</span><h1>My Journal</h1></div><button type="button" className="dw-stitch-cta" onClick={() => openEditor()}><Plus size={16}/> New entry</button></div>
                    <div className="dw-calendar-card"><div className="dw-calendar-top"><strong><CalendarDays size={15}/>{parseDate(daysInWeek[0]).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</strong><div><button type="button" aria-label="Previous week" onClick={() => setWeekOffset(n => n - 1)}><ChevronLeft size={18}/></button><span>Week view</span><button type="button" aria-label="Next week" disabled={weekOffset >= 0} onClick={() => setWeekOffset(n => n + 1)}><ChevronRight size={18}/></button></div></div><div className="dw-calendar-days">{daysInWeek.map(day => <button type="button" key={day} className={(selectedDay === day ? 'selected ' : '') + (day === today ? 'today ' : '')} onClick={() => setSelectedDay(prev => prev === day ? null : day)}><small>{parseDate(day).toLocaleDateString('en', { weekday: 'narrow' })}</small><strong>{parseDate(day).getDate()}</strong>{entries.some(entry => entry.entry_date.slice(0, 10) === day) && <i/>}</button>)}</div></div>
                    <label className="dw-search"><Search size={18}/><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories, wins..." aria-label="Search journal entries"/></label>
                    <div className="dw-filter-row">{([['all','All entries'],['wins','✦ Wins only'],['reflections','Reflections'],['favorites','Saved']] as const).map(([key,label]) => <button type="button" key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}{key === 'all' && ' (' + stats.entries + ')'}</button>)}{selectedDay && <button type="button" onClick={() => setSelectedDay(null)}>Clear date ×</button>}</div>
                    <div className="dw-entry-list">{filteredEntries.length ? filteredEntries.map(entry => <article className="dw-entry-card" key={entry.id}>
                        <div className="dw-entry-metadata"><span className="dw-entry-mood" style={{background:moodByName(entry.mood).bg}}>{moodByName(entry.mood).icon} {moodByName(entry.mood).label}</span><span>{niceDate(entry.entry_date)}</span><span>·</span><span>{Math.max(1, Math.ceil((entry.body?.split(/\s+/).length ?? 0) / 200))} min read</span></div>
                        <button type="button" className="dw-entry-content" onClick={() => openEditor(entry)}><strong>{entryHeading(entry)}</strong>{entry.body && <p>{entry.body}</p>}{entry.has_photo && <span className="dw-entry-has-photo"><Camera size={13}/> Photo attached</span>}</button>
                        <div className="dw-entry-footer">{entry.little_win ? <span className="dw-entry-win">✦ {entry.little_win}</span> : <span className="dw-entry-win dw-entry-no-win">A moment of reflection</span>}<div>
                            <button type="button" aria-label={entry.is_favorite ? 'Remove from saved' : 'Save entry'} title="Save entry" onClick={() => router.patch('/journal-entries/' + entry.id + '/favorite', {}, { preserveScroll: true })}><Bookmark size={17} fill={entry.is_favorite ? '#8465c5' : 'none'}/></button>
                            <button type="button" aria-label="Delete entry" title="Delete entry" onClick={() => { if (window.confirm('Delete this memory? This cannot be undone.')) router.delete('/journal-entries/' + entry.id, { preserveScroll: true }); }}><Trash2 size={16}/></button>
                        </div></div>
                    </article>) : <div className="dw-empty">Nothing here yet. Try another search or capture a moment.</div>}</div>
                </section>}
                {tab === 'growth' && <section className="dw-stitch-stack">
                    <div className="dw-page-heading"><div><span>A JOURNEY WORTH KEEPING</span><h1>My Growth</h1></div></div>
                    <div className="dw-growth-feature"><div><small>♧ CURRENT STREAK</small><strong>{stats.streak} <span>Days</span></strong><p>✦ Every day is a fresh start</p></div><span className="dw-growth-flame"><img src={stitchArt.flame} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /><Flame size={27} fill="#ffd7a7" stroke="#bd7b3b"/></span></div>
                    <div className="dw-growth-metrics"><div><BookOpen size={17}/><strong>{stats.entries}</strong><small>Journal Entries</small></div><div><Trophy size={17}/><strong>{stats.wins}</strong><small>Wins Logged</small></div><div><Heart size={17}/><strong>{stats.favorites}</strong><small>Saved Moments</small></div></div>
                    <MoodGraph flow={stats.mood_flow}/>
                    <div className="dw-milestones"><div className="dw-flow-heading"><h2>Recent Milestones</h2></div>
                        <div><span className="dw-milestone-icon">✦</span><div><strong>Little wins add up</strong><small>{stats.wins >= 25 ? 'First 25 little wins achieved!' : stats.wins + ' / 25 little wins'}</small><span className="dw-milestone-bar"><i style={{ width: Math.min(100, stats.wins / 25 * 100) + '%' }}/></span></div><b>{Math.min(stats.wins, 25)}/25</b></div>
                        <div><span className="dw-milestone-icon dw-milestone-lavender"><Flame size={20}/></span><div><strong>Showing up for yourself</strong><small>{stats.streak >= 10 ? '10-day streak achieved!' : stats.streak + ' / 10-day streak'}</small><span className="dw-milestone-bar"><i style={{ width: Math.min(100, stats.streak / 10 * 100) + '%' }}/></span></div><b>{Math.min(stats.streak, 10)}/10</b></div>
                    </div>
                    <blockquote className="dw-growth-quote">“Notice what is going right. What you appreciate, appreciates.”<small>— Daily Growth Reflection</small></blockquote>
                </section>}
            </main>
            <nav className="dw-floating-nav" aria-label="Main navigation">
                <button type="button" className={tab === 'today' ? 'active' : ''} aria-current={tab === 'today' ? 'page' : undefined} onClick={() => setTab('today')}><Sparkles size={18}/> Today</button>
                <button type="button" className={tab === 'journal' ? 'active' : ''} aria-current={tab === 'journal' ? 'page' : undefined} onClick={() => setTab('journal')}><BookOpen size={18}/> Journal</button>
                <button type="button" className={tab === 'growth' ? 'active' : ''} aria-current={tab === 'growth' ? 'page' : undefined} onClick={() => setTab('growth')}><Flame size={18}/> Growth</button>
            </nav>
        </div>
        {saved && <div className="dw-save-toast" role="status"><Check size={17}/> Your moment is saved ✦</div>}
        {editing && <div className="dw-overlay" onClick={() => setEditing(false)}><section className="dw-sheet dw-capture-sheet" role="dialog" aria-modal="true" aria-label="Capture today" onClick={e => e.stopPropagation()}>
            <header><div><small>A MOMENT FOR YOU</small><h2>Capture <em>today.</em></h2></div><button type="button" className="dw-icon" aria-label="Close journal editor" onClick={() => setEditing(false)}><X size={21}/></button></header>
            <form onSubmit={saveEntry}>
                <label className="dw-label" htmlFor="dw-entry-date">Day</label>
                <input id="dw-entry-date" type="date" required max={today} value={form.data.entry_date} onChange={e => form.setData('entry_date', e.target.value)}/>
                <span className="dw-label">How are you feeling?</span><MoodPicker value={form.data.mood} onChange={value => form.setData('mood', value)}/>
                <label className="dw-label" htmlFor="dw-entry-body">How was your day?</label><textarea id="dw-entry-body" rows={5} maxLength={10000} placeholder="The little moments, the big feelings..." value={form.data.body} onChange={e => form.setData('body', e.target.value)}/>
                <label className="dw-label" htmlFor="dw-entry-win">Today's little win</label><input id="dw-entry-win" maxLength={500} placeholder="Something worth celebrating..." value={form.data.little_win} onChange={e => form.setData('little_win', e.target.value)}/>
                <span className="dw-label">Add a photo (optional)</span>
                <label className="dw-photo-picker" htmlFor="dw-entry-photo"><ImagePlus size={18}/> {form.data.photo ? form.data.photo.name : existingPhoto ? 'Replace photo' : 'Choose a photo'}<small>JPG, PNG, HEIC or WebP · Max 10 MB</small></label>
                <input id="dw-entry-photo" className="dw-hidden-file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e => form.setData('photo', e.target.files?.[0] ?? null)}/>
                {photoPreview && <img className="dw-photo-preview" src={photoPreview} alt="Selected journal photo preview"/>}
                {existingPhoto && <div className="dw-photo-existing"><img src={'/journal-entries/' + editExistingPhoto?.id + '/photo'} alt="Attached journal memory"/><button type="button" onClick={() => form.setData('remove_photo', true)}>Remove photo</button></div>}
                {form.data.remove_photo && <button className="dw-undo-remove" type="button" onClick={() => form.setData('remove_photo', false)}>Undo photo removal</button>}
                {Object.entries(form.errors).map(([field, message]) => <p className="dw-error" key={field}>{message}</p>)}
                <button type="submit" className="dw-primary dw-save" disabled={form.processing}>{form.processing ? 'Saving your memory...' : 'Save this moment ✦'}</button>
            </form>
        </section></div>}
        {settings && <div className="dw-overlay" onClick={() => setSettings(false)}><section className="dw-sheet dw-settings" role="dialog" aria-modal="true" aria-label="Settings" onClick={event => event.stopPropagation()}>
            <header><h2>Settings</h2><button type="button" className="dw-icon" aria-label="Close settings" onClick={() => setSettings(false)}><X size={21}/></button></header>
            <div className="dw-setting-profile"><span className="dw-avatar">{firstName.charAt(0).toUpperCase()}</span><div><strong>{props.auth.user.name}</strong><small>{props.auth.user.email}</small></div></div>
            <Link href="/settings/profile"><Settings2 size={19}/> Profile & privacy <ChevronRight size={17}/></Link>
            <Link href="/settings/appearance"><Sparkles size={19}/> Appearance <ChevronRight size={17}/></Link>
            <Link href="/logout" method="post" as="button"><LogOut size={19}/> Sign out <ChevronRight size={17}/></Link>
        </section></div>}
    </div>;
}
