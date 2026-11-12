import { useEffect, useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import { Button, StatusBadge } from './ui';
import { useAuth } from '../context/AuthContext';
import { getAllClaims, getReportClaims, reviewClaim } from '../services/claims';

const toneForStatus = {
  submitted: 'sky',
  under_review: 'amber',
  more_information_required: 'rose',
  accepted: 'emerald',
  rejected: 'slate'
};

function ClaimReviewList({ reportId }) {
  const { request, getErrorMessage } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClaims = () => {
    setLoading(true);
    const loader = reportId ? getReportClaims(request, reportId) : getAllClaims(request);
    loader.then((result) => setClaims(result.claims)).catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClaims();
  }, [reportId]);

  const decide = async (claim, action) => {
    const reason = window.prompt(action === 'approve' ? 'Add an approval note:' : 'Explain this decision to the claimant:');
    if (!reason) return;
    if (action === 'approve' && !window.confirm('Approve this claim and mark the report as recovered?')) return;
    try {
      await reviewClaim(request, claim.id, action === 'request-information' ? 'request-information' : action, reason);
      loadClaims();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading claims...</p>;
  if (error) return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  if (!claims.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No claims to review.</p>;

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <article key={claim.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-bold text-[#0d2340]">{claim.claimant?.name || 'Student claimant'}</p>
              <p className="mt-1 text-xs text-slate-400">{claim.report?.title || 'Report'} · {new Date(claim.createdAt).toLocaleDateString()}</p>
            </div>
            <StatusBadge tone={toneForStatus[claim.status] || 'slate'}>{claim.status.replaceAll('_', ' ')}</StatusBadge>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{claim.message}</p>
          {claim.evidenceImages?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{claim.evidenceImages.map((image) => <a href={image} target="_blank" rel="noreferrer" key={image}><img src={image} alt="Claim evidence" className="h-16 w-16 rounded-lg object-cover" /></a>)}</div>}
          {claim.decisionReason && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><strong>Decision note:</strong> {claim.decisionReason}</p>}
          {['submitted', 'under_review', 'more_information_required'].includes(claim.status) && <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => decide(claim, 'approve')}><Check size={15} /> Approve</Button><Button variant="secondary" onClick={() => decide(claim, 'request-information')}><Info size={15} /> Request information</Button><Button variant="ghost" onClick={() => decide(claim, 'reject')}><X size={15} /> Reject</Button></div>}
        </article>
      ))}
    </div>
  );
}

export default ClaimReviewList;
