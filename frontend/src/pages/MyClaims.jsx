import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, SectionHeading, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getMyClaims } from '../services/claims';

const toneForStatus = {
  submitted: 'sky',
  under_review: 'amber',
  more_information_required: 'rose',
  accepted: 'emerald',
  rejected: 'slate'
};

function MyClaims() {
  const { request, getErrorMessage } = useAuth();
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getMyClaims(request, filter ? { status: filter } : {})
      .then((result) => setClaims(result.claims))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [filter, getErrorMessage, request]);

  const counts = useMemo(() => ({
    review: claims.filter((claim) => ['submitted', 'under_review'].includes(claim.status)).length,
    accepted: claims.filter((claim) => claim.status === 'accepted').length,
    moreInfo: claims.filter((claim) => claim.status === 'more_information_required').length
  }), [claims]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12">
      <div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Your requests</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">My claims</h1><p className="mt-2 text-sm text-slate-500">Track ownership evidence and recovery decisions in one place.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Clock3 className="text-amber-500" size={20} /><p className="mt-4 text-2xl font-extrabold text-[#0d2340]">{counts.review}</p><p className="mt-1 text-xs text-slate-500">Under review</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="text-emerald-500" size={20} /><p className="mt-4 text-2xl font-extrabold text-[#0d2340]">{counts.accepted}</p><p className="mt-1 text-xs text-slate-500">Approved claims</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Info className="text-rose-500" size={20} /><p className="mt-4 text-2xl font-extrabold text-[#0d2340]">{counts.moreInfo}</p><p className="mt-1 text-xs text-slate-500">Needs your reply</p></div>
      </div>
      <div className="mt-12">
        <SectionHeading title="Claim history" description="Open a claim to review evidence, status changes, and decision notes." action={<select value={filter} onChange={(event) => setFilter(event.target.value)} className="field w-full sm:w-56"><option value="">All statuses</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="more_information_required">Needs information</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select>} />
        {loading && <p className="text-sm text-slate-500">Loading your claims...</p>}
        {!loading && error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {!loading && !error && !claims.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">You have not submitted any claims matching this filter.</div>}
        {!loading && !error && claims.length > 0 && <div className="space-y-3">{claims.map((claim) => <Link to={`/claims/${claim.id}`} key={claim.id} className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-sky-200 hover:shadow-sm sm:flex-row sm:items-center sm:p-5"><div className="flex min-w-0 flex-1 items-center gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${claim.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : claim.status === 'rejected' ? 'bg-slate-100 text-slate-500' : claim.status === 'more_information_required' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><Clock3 size={20} /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#0d2340]">{claim.report?.title || 'Found item report'}</p><p className="mt-1 text-xs text-slate-400">Submitted {new Date(claim.createdAt).toLocaleDateString()}</p></div></div><StatusBadge tone={toneForStatus[claim.status] || 'slate'}>{claim.status.replaceAll('_', ' ')}</StatusBadge><ArrowRight size={17} className="text-slate-400" /></Link>)}</div>}
      </div>
      <div className="mt-10 rounded-2xl bg-sky-50 p-6"><h2 className="font-display text-lg font-bold text-[#0d2340]">Looking for another item?</h2><p className="mt-2 text-sm text-slate-500">Browse the latest community reports to see if your item has appeared.</p><Link to="/browse" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-600">Browse items <ArrowRight size={15} /></Link></div>
    </div>
  );
}

export default MyClaims;
