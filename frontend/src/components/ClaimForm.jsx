import { useState } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';
import { Button } from './ui';
import { useAuth } from '../context/AuthContext';
import { createClaim, updateClaim, uploadReportImages } from '../services/claims';

function ClaimForm({ reportId, claim, onSuccess }) {
  const { request, getErrorMessage } = useAuth();
  const [message, setMessage] = useState(claim?.message || '');
  const [files, setFiles] = useState([]);
  const [existingEvidence, setExistingEvidence] = useState(claim?.evidenceImages || []);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const uploaded = files.length
        ? await uploadReportImages(request, files, setProgress)
        : [];
      const payload = {
        message,
        ...(claim ? { evidenceImages: [...existingEvidence, ...uploaded.map((image) => image.url)] } : {
          reportId,
          evidenceImages: uploaded.map((image) => image.url)
        })
      };
      const updatedClaim = claim
        ? await updateClaim(request, claim.id, payload)
        : await createClaim(request, payload);
      setSuccess(claim ? 'Your additional information was submitted.' : 'Your claim was submitted for review.');
      setFiles([]);
      setProgress(0);
      onSuccess?.(updatedClaim);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-sky-600">{claim ? 'Additional information' : 'Claim this item'}</p>
        <h2 className="mt-2 font-display text-xl font-bold text-[#0d2340]">{claim ? 'Update your ownership evidence' : 'Tell the finder why this is yours'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Only share details that help verify ownership. The finder and authorized moderators can review this information.</p>
      </div>
      <label className="mt-5 block">
        <span className="label">Ownership explanation</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={3000} required rows={5} className="field resize-y" placeholder="Describe identifying details, where you obtained the item, or other ownership evidence." />
      </label>
      <label className="mt-4 block">
        <span className="label">Supporting evidence (optional)</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles([...event.target.files])} className="mt-2 block w-full rounded-xl border border-dashed border-sky-200 bg-white p-3 text-xs text-slate-500" />
      </label>
      {existingEvidence.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{existingEvidence.map((image) => <div key={image} className="relative"><img src={image} alt="Existing evidence" className="h-14 w-14 rounded-lg object-cover" /><button type="button" onClick={() => setExistingEvidence(existingEvidence.filter((entry) => entry !== image))} className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 text-xs text-white" aria-label="Remove evidence">×</button></div>)}</div>}
      {progress > 0 && progress < 100 && <p className="mt-3 text-xs font-semibold text-sky-700">Uploading evidence: {progress}%</p>}
      {error && <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {success && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 size={16} /> {success}</p>}
      <Button type="submit" disabled={submitting} className="mt-5">{submitting ? 'Submitting...' : <><Upload size={15} /> {claim ? 'Submit information' : 'Submit claim'}</>}</Button>
    </form>
  );
}

export default ClaimForm;
