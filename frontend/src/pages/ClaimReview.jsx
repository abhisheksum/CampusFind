import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClaimReviewList from '../components/ClaimReviewList';

function ClaimReview() {
  return <div className="mx-auto max-w-5xl px-5 py-9 sm:px-8 lg:py-12"><Link to="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600"><ArrowLeft size={16} /> Back to dashboard</Link><div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Moderation</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">Claim review queue</h1><p className="mt-2 text-sm text-slate-500">Review ownership evidence and make auditable recovery decisions.</p></div><ClaimReviewList /></div>;
}

export default ClaimReview;
