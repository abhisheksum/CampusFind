import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button, StatusBadge } from '../components/ui';
import ClaimForm from '../components/ClaimForm';
import { useAuth } from '../context/AuthContext';
import { getClaim } from '../services/claims';

const toneForStatus = {
  submitted: 'sky',
  under_review: 'amber',
  more_information_required: 'rose',
  accepted: 'emerald',
  rejected: 'slate'
};

function ClaimDetails() {
  const { claimId } = useParams();
  const { request, getErrorMessage } = useAuth();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getClaim(request, claimId).then(setClaim).catch((requestError) => setError(getErrorMessage(requestError)));
  }, [claimId, getErrorMessage, request]);

  if (error) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p><Button to="/my-claims" className="mt-5">Back to claims</Button></div>;
  if (!claim) return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-sm text-slate-500">Loading claim...</div>;

  return (
    <div className="mx-auto max-w-4xl px-5 py-9 sm:px-8 lg:py-12">
      <Link to="/my-claims" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600"><ArrowLeft size={16} /> Back to claims</Link>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-600">Claim details</p><h1 className="mt-2 font-display text-2xl font-extrabold text-[#0d2340]">{claim.report?.title || 'Found item claim'}</h1></div><StatusBadge tone={toneForStatus[claim.status] || 'slate'}>{claim.status.replaceAll('_', ' ')}</StatusBadge></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><Clock3 size={16} className="text-sky-600" /><p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted</p><p className="mt-1 text-sm font-semibold text-[#0d2340]">{new Date(claim.createdAt).toLocaleString()}</p></div><div className="rounded-xl bg-slate-50 p-4"><CheckCircle2 size={16} className="text-emerald-600" /><p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Reviewed</p><p className="mt-1 text-sm font-semibold text-[#0d2340]">{claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleString() : 'Pending review'}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Decision note</p><p className="mt-1 text-sm text-slate-600">{claim.decisionReason || 'No decision note yet.'}</p></div></div>
        <div className="mt-8"><h2 className="font-display text-lg font-bold text-[#0d2340]">Your explanation</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{claim.message}</p></div>
        {claim.evidenceImages?.length > 0 && <div className="mt-7"><h2 className="font-display text-lg font-bold text-[#0d2340]">Evidence</h2><div className="mt-3 flex flex-wrap gap-3">{claim.evidenceImages.map((image) => <a href={image} target="_blank" rel="noreferrer" key={image}><img src={image} alt="Claim evidence" className="h-24 w-24 rounded-xl object-cover" /></a>)}</div></div>}
        {claim.status === 'more_information_required' && <div className="mt-8"><ClaimForm claim={claim} onSuccess={setClaim} /></div>}
      </div>
    </div>
  );
}

export default ClaimDetails;
