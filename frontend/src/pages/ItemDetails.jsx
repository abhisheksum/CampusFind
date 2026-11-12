import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Flag, MapPin, Pencil, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, MatchCard, StatusBadge } from '../components/ui';
import ClaimForm from '../components/ClaimForm';
import ClaimReviewList from '../components/ClaimReviewList';
import { useAuth } from '../context/AuthContext';
import { getReport, getSimilarReports, reportCategory, reportDate, reportImage, reportLocation } from '../services/reports';

function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user, request, getErrorMessage } = useAuth();
  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getReport(request, itemId), getSimilarReports(request, itemId, { limit: 4 })])
      .then(([report, result]) => {
        setItem(report);
        setSimilar(result);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [getErrorMessage, itemId, request]);

  if (loading) return <div className="mx-auto max-w-7xl px-5 py-20 text-center text-sm font-semibold text-slate-500">Loading report...</div>;
  if (error || !item) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || 'Report not found.'}</p><Button to="/browse" className="mt-5">Back to browse</Button></div>;
  const isOwner = user?.id === item.ownerId?._id || user?.id === item.ownerId;
  const canClaim = item.reportType === 'found' && !isOwner && !['recovered', 'closed', 'archived', 'rejected'].includes(item.status);
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12"><Link to="/browse" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600"><ArrowLeft size={16} /> Back to browse</Link><div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"><div><div className="overflow-hidden rounded-3xl bg-sky-50">{item.images?.length ? <img src={reportImage(item)} alt={item.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-400">No photo uploaded</div>}</div>{item.images?.length > 1 && <div className="mt-4 flex gap-3">{item.images.map((image) => <img key={image.publicId || image.url} src={image.url} alt={image.altText || item.title} className="h-16 w-16 rounded-xl object-cover" />)}</div>}</div><div><div className="flex items-center justify-between"><StatusBadge tone={item.reportType === 'lost' ? 'amber' : 'emerald'}>{item.reportType} item</StatusBadge><button className="text-slate-400 hover:text-rose-500" aria-label="Report item"><Flag size={17} /></button></div><p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">{reportCategory(item)}</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">{item.title}</h1><p className="mt-5 text-sm leading-7 text-slate-500">{item.description}</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><MapPin size={17} className="text-sky-600" /><p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Location</p><p className="mt-1 text-sm font-semibold text-[#0d2340]">{reportLocation(item)}</p></div><div className="rounded-xl bg-slate-50 p-4"><CalendarDays size={17} className="text-sky-600" /><p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Occurred</p><p className="mt-1 text-sm font-semibold text-[#0d2340]">{reportDate(item)}{item.approximateTime ? ` · ${item.approximateTime}` : ''}</p></div></div>{item.identifyingAttributes && <div className="mt-5 flex flex-wrap gap-2">{Object.entries(item.identifyingAttributes).map(([key, value]) => value && <span key={key} className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold capitalize text-sky-700">{key}: {value}</span>)}</div>}<div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d2340] text-xs font-bold text-white">{item.ownerId?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'}</span><div><p className="text-sm font-bold text-[#0d2340]">{item.ownerId?.name || 'Campus member'}</p><p className="text-xs text-slate-400">Student reporter · Verified account</p></div><ShieldCheck size={18} className="ml-auto text-emerald-500" /></div>{isOwner && <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate(`/reports/${item.id}/edit`)}><Pencil size={15} /> Edit your report</Button>}</div>{canClaim && <div className="mt-5"><ClaimForm reportId={item.id} onSuccess={() => navigate('/my-claims')} /></div>}</div></div>{isOwner && item.reportType === 'found' && <section className="mt-12 border-t border-slate-200 pt-10"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-sky-600">Finder review</p><h2 className="mt-2 font-display text-2xl font-bold text-[#0d2340]">Claims for this item</h2></div><ClaimReviewList reportId={item.id} /></section>}<div className="mt-16 border-t border-slate-200 pt-10"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-sky-600">Smart discovery</p><h2 className="mt-2 font-display text-2xl font-bold text-[#0d2340]">Potential matches</h2></div>{similar.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((entry) => <MatchCard key={entry.reportId} match={entry} />)}</div> : <p className="text-sm text-slate-500">No potential matches yet.</p>}</div><div className="mt-8 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={15} className="text-emerald-500" /> Recovery decisions are recorded securely for campus accountability.</div></div>;
}

export default ItemDetails;

