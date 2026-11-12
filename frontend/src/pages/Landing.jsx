import { ArrowRight, CheckCircle2, ChevronRight, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ItemCard, SearchBar, SectionHeading } from '../components/ui';
import { useState } from 'react';
import { useEffect } from 'react';
import { apiRequest } from '../services/api';
import { getReports } from '../services/reports';

function Landing() {
  const [query, setQuery] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    getReports(apiRequest, { limit: 4, sort: 'newest' })
      .then((result) => setRecentItems(result.reports))
      .catch(() => setRecentItems([]));
  }, []);
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/browse${query ? `?search=${encodeURIComponent(query)}` : ''}`);
  };
  return (
    <div className="min-h-screen bg-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-black">S</span><span className="font-display text-sm font-bold">Campus<span className="text-sky-200">Find</span></span></Link>
          <nav className="hidden items-center gap-7 md:flex"><a href="#how-it-works" className="text-sm font-medium text-sky-50/80 hover:text-white">How it works</a><Link to="/browse" className="text-sm font-medium text-sky-50/80 hover:text-white">Browse items</Link><Link to="/login" className="text-sm font-semibold text-white">Sign in</Link><Button to="/register" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#0d2340]">Join campus</Button></nav>
          <Link to="/login" className="text-sm font-semibold text-white md:hidden">Sign in</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0b2a4a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(55,181,244,0.28),transparent_35%),radial-gradient(circle_at_10%_70%,rgba(27,110,183,0.28),transparent_36%)]" />
        <div className="absolute -right-32 top-28 h-96 w-96 rounded-full border border-white/10" /><div className="absolute -right-12 top-48 h-64 w-64 rounded-full border border-white/10" />
        <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold text-sky-100"><Sparkles size={14} className="text-sky-300" /> The smarter way to reconnect</div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">Lost something?<br /><span className="text-sky-300">Let&apos;s find it.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-sky-100/70 sm:text-lg">CampusFind brings our university community together to report, discover, and return lost belongings — quickly and securely.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button to="/report-lost" variant="primary">Report a lost item <ArrowRight size={16} /></Button><Button to="/report-found" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#0d2340]">I found something</Button></div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs text-sky-100/70"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-sky-300" /> Safe &amp; private</span><span className="flex items-center gap-2"><Users size={16} className="text-sky-300" /> Built for students</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-sky-300" /> 24/7 access</span></div>
          </div>
          <div className="relative hidden lg:block"><div className="absolute -inset-8 rounded-[36px] bg-sky-400/10 blur-2xl" /><div className="relative rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md"><div className="rounded-2xl bg-white p-5"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Community board</p><p className="mt-1 font-display text-lg font-bold text-[#0d2340]">Recent activity</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">Live now</span></div>{recentItems.slice(0, 3).map((item) => <Link to={`/items/${item.id}`} key={item.id} className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 hover:bg-sky-50"><img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#0d2340]">{item.title}</p><p className="mt-1 truncate text-xs text-slate-400">{item.location}</p></div><ChevronRight size={16} className="text-slate-300" /></Link>)}</div></div></div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-5xl px-5 sm:px-8"><div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_15px_40px_rgba(13,35,64,0.12)] sm:p-4"><div className="mb-2 flex items-center justify-between px-2"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Find an item</p><Link to="/browse" className="text-xs font-semibold text-sky-600 hover:text-sky-700">Advanced search <ArrowRight size={13} className="ml-1 inline" /></Link></div><SearchBar value={query} onChange={setQuery} onSubmit={submitSearch} /></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><SectionHeading eyebrow="Community board" title="Recently reported items" description="A quick look at what your fellow students have recently lost or found." action={<Button to="/browse" variant="ghost">View all items <ArrowRight size={16} /></Button>} /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recentItems.slice(0, 4).map((item) => <ItemCard item={item} key={item.id} />)}</div></section>

      <section id="how-it-works" className="bg-[#f3f8fc]"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><SectionHeading eyebrow="Simple by design" title="From lost to found in three steps" description="Everything you need to get your belongings back, without the back-and-forth." /><div className="grid gap-6 md:grid-cols-3">{[{ number: '01', icon: '✦', title: 'Tell us what happened', copy: 'Create a detailed report in under two minutes. Add photos to help your community recognize it.' }, { number: '02', icon: '⌕', title: 'Connect with campus', copy: 'Browse active reports or let our smart matching surface items that look like yours.' }, { number: '03', icon: '↗', title: 'Make the return', copy: 'Chat securely, verify ownership, and arrange a safe handoff at a campus location.' }].map((step) => <div key={step.number} className="rounded-2xl border border-slate-200/80 bg-white p-7"><div className="flex items-center justify-between"><span className="text-2xl text-sky-500">{step.icon}</span><span className="font-display text-sm font-bold text-slate-300">{step.number}</span></div><h3 className="mt-8 font-display text-lg font-bold text-[#0d2340]">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{step.copy}</p></div>)}</div></div></section>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#0d2340] px-7 py-9 sm:flex-row sm:items-center sm:px-12"><div><h2 className="font-display text-2xl font-bold text-white">Have something to report?</h2><p className="mt-2 text-sm text-sky-100/65">Your report could be the missing piece someone is looking for.</p></div><div className="flex flex-wrap gap-3"><Button to="/report-lost">Report lost item</Button><Button to="/report-found" variant="secondary">Report found item</Button></div></div></section>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between"><Link to="/" className="font-display font-bold text-[#0d2340]">Campus<span className="text-sky-600">Find</span></Link><p>Made for our campus community · © 2024 CampusFind University</p><div className="flex gap-5"><Link to="/login" className="hover:text-sky-600">Sign in</Link><Link to="/register" className="hover:text-sky-600">Create account</Link></div></div></footer>
    </div>
  );
}

export default Landing;

