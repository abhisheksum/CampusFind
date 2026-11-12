import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, SectionHeading, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getAdminReports, moderateReport } from '../services/admin';

const statuses = ['published', 'under_review', 'matched', 'claim_pending', 'recovered', 'closed', 'rejected', 'archived'];

function AdminReports() {
  const { request, getErrorMessage } = useAuth();
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ status: '', reportType: '', search: '' });
  const [error, setError] = useState('');
  const load = () => getAdminReports(request, filters).then((result) => setReports(result.reports)).catch((requestError) => setError(getErrorMessage(requestError)));
  useEffect(() => { load(); }, [filters.status, filters.reportType]);
  const moderate = async (report, status) => {
    const reason = window.prompt(`Reason for setting this report to ${status}:`);
    if (reason === null) return;
    if (!window.confirm(`Confirm ${status} for "${report.title}"?`)) return;
    try { await moderateReport(request, report.id, status, reason); load(); } catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12"><SectionHeading eyebrow="Moderation" title="Report review" description="Review report content, images, and status before taking an audited action." action={<div className="flex gap-2"><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onKeyDown={(event) => event.key === 'Enter' && load()} placeholder="Search reports" className="field w-44" /><Button variant="secondary" onClick={load}>Search</Button></div>} /><div className="mb-5 flex flex-wrap gap-3"><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="field w-48"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select><select value={filters.reportType} onChange={(event) => setFilters({ ...filters, reportType: event.target.value })} className="field w-40"><option value="">All types</option><option value="lost">Lost</option><option value="found">Found</option></select></div>{error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Report</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{reports.map((report) => <tr key={report.id}><td className="px-5 py-4"><Link to={`/items/${report.id}`} className="font-bold text-[#0d2340] hover:text-sky-600">{report.title}</Link><p className="mt-1 text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</p></td><td className="px-5 py-4 capitalize text-slate-500">{report.reportType}</td><td className="px-5 py-4 text-slate-500">{report.ownerId?.name || 'Unknown'}</td><td className="px-5 py-4"><StatusBadge>{report.status.replaceAll('_', ' ')}</StatusBadge></td><td className="px-5 py-4"><select defaultValue="" onChange={(event) => event.target.value && moderate(report, event.target.value)} className="field w-40"><option value="">Moderate...</option>{statuses.filter((status) => status !== report.status).map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></td></tr>)}</tbody></table>{!reports.length && <p className="p-8 text-center text-sm text-slate-500">No reports match these filters.</p>}</div></div>;
}

export default AdminReports;
