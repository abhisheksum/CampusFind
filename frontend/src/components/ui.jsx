import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Package, Search, Sparkles } from 'lucide-react';
import { reportCategory, reportDate, reportImage, reportLocation } from '../services/reports';

export function Button({ children, variant = 'primary', className = '', to, type = 'button', ...props }) {
  const styles = {
    primary: 'bg-[#0877c9] text-white shadow-[0_8px_20px_rgba(8,119,201,0.2)] hover:bg-[#0768ae]',
    navy: 'bg-[#0d2340] text-white shadow-[0_8px_20px_rgba(13,35,64,0.16)] hover:bg-[#16365f]',
    secondary: 'border border-slate-200 bg-white text-[#0d2340] hover:border-sky-200 hover:bg-sky-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-[#0d2340]',
    soft: 'bg-sky-50 text-[#0877c9] hover:bg-sky-100'
  };
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`;
  if (to) return <Link to={to} className={classes}>{children}</Link>;
  return <button type={type} className={classes} {...props}>{children}</button>;
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-600">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold tracking-tight text-[#0d2340] sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ItemCard({ item, compact = false }) {
  return (
    <Link to={`/items/${item.id}`} className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_16px_35px_rgba(24,93,145,0.12)] ${compact ? 'flex gap-4 p-3' : ''}`}>
      <div className={`relative overflow-hidden bg-sky-50 ${compact ? 'h-20 w-20 shrink-0 rounded-xl' : 'h-48'}`}>
        <img src={reportImage(item)} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${(item.type || item.reportType) === 'lost' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type || item.reportType}</span>
      </div>
      <div className={compact ? 'py-1' : 'p-4'}>
        <p className="text-xs font-medium text-slate-400">{reportCategory(item)}</p>
        <h3 className="mt-1 font-display text-base font-bold text-[#0d2340] group-hover:text-sky-700">{item.title}</h3>
        <p className="mt-2 text-xs text-slate-500">{reportLocation(item)}</p>
        <p className="mt-1 text-xs text-slate-400">{reportDate(item)}</p>
      </div>
    </Link>
  );
}

export function MatchCard({ match }) {
  const category = typeof match.category === 'object' ? match.category?.name : match.category;
  const location = typeof match.location === 'object'
    ? [match.location?.name, match.location?.building].filter(Boolean).join(', ')
    : match.location;

  return (
    <Link to={`/items/${match.reportId}`} className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_12px_28px_rgba(24,93,145,0.12)]">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sky-50">
        {match.itemImage
          ? <img src={match.itemImage} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full items-center justify-center text-xs font-semibold text-sky-500">No photo</div>}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-[#0d2340] group-hover:text-sky-700">{match.itemName}</p>
          <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">{match.matchPercentage}% match</span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">{[category, location].filter(Boolean).join(' · ')}</p>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{match.matchingReasons?.join(' · ') || 'Potentially related report'}</p>
      </div>
    </Link>
  );
}

export function StatusBadge({ children, tone = 'sky' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-600'
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function StatIcon({ type, tone = 'sky' }) {
  const icons = { search: Search, package: Package, check: Check, clock: Clock3, sparkle: Sparkles };
  const Icon = icons[type] || Search;
  const tones = { sky: 'bg-sky-50 text-sky-600', indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };
  return <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={20} strokeWidth={2.2} /></span>;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = 'Search by item, category, or location...' }) {
  return (
    <form onSubmit={onSubmit} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-50">
      <Search className="ml-3 text-slate-400" size={19} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400" />
      <Button type="submit" className="hidden sm:inline-flex">Search</Button>
    </form>
  );
}

