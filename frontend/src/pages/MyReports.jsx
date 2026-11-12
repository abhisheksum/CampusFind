import { Download, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { deleteReport, getReports, reportDate, reportImage, reportLocation, updateReportStatus } from '../services/reports';

function MyReports() {
  const { request, getErrorMessage } = useAuth();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');

  const loadReports = () => {
    setLoading(true);
    getReports(request, { mine: true, reportType: filter })
      .then((result) => setReports(result.reports))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  };
  useEffect(loadReports, [filter, getErrorMessage, request]);

  const runAction = async (reportId, action) => {
    setBusyId(reportId);
    setError('');
    try {
      if (action === 'delete') {
        await deleteReport(request, reportId);
        setReports((current) => current.filter((report) => report.id !== reportId));
        setMessage('Report deleted successfully.');
      } else {
        const updated = await updateReportStatus(request, reportId, action);
        setReports((current) => current.map((report) => report.id === reportId ? updated : report));
        setMessage(`Report marked ${action === 'resolve' ? 'recovered' : 'archived'}.`);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId('');
    }
  };

  const statusTone = (status) => status === 'recovered' ? 'emerald' : status === 'archived' ? 'slate' : status === 'rejected' ? 'rose' : status === 'claim_pending' ? 'amber' : 'sky';
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Your activity</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">My reports</h1><p className="mt-2 text-sm text-slate-500">Keep track of everything you&apos;ve reported to the community.</p></div><div className="flex gap-3"><Button variant="secondary"><Download size={16} /> Export</Button><Button to="/report-lost"><Plus size={16} /> New report</Button></div></div>{(error || message) && <div className={`mt-6 rounded-xl px-4 py-3 text-sm ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}<div className="mt-8 flex gap-2 overflow-auto border-b border-slate-200 pb-3"><button onClick={() => setFilter('')} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${!filter ? 'bg-[#0d2340] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>All reports</button><button onClick={() => setFilter('lost')} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${filter === 'lost' ? 'bg-[#0d2340] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Lost</button><button onClick={() => setFilter('found')} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${filter === 'found' ? 'bg-[#0d2340] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Found</button></div>{loading ? <div className="mt-6 space-y-3"><div className="h-20 animate-pulse rounded-2xl bg-slate-200" /><div className="h-20 animate-pulse rounded-2xl bg-slate-200" /></div> : reports.length ? <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="hidden grid-cols-[1.4fr_0.65fr_1fr_0.8fr_90px] gap-4 border-b border-slate-100 px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 md:grid"><span>Item</span><span>Type</span><span>Location</span><span>Status</span><span /></div>{reports.map((report) => <div key={report.id} className="grid items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0 hover:bg-sky-50/30 md:grid-cols-[1.4fr_0.65fr_1fr_0.8fr_90px] md:px-5"><Link to={`/items/${report.id}`} className="flex min-w-0 items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-sky-50">{reportImage(report) ? <img src={reportImage(report)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">—</div>}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#0d2340]">{report.title}</p><p className="mt-1 text-xs text-slate-400">{reportDate(report)}</p></div></Link><span className={`text-xs font-semibold capitalize ${report.reportType === 'lost' ? 'text-amber-600' : 'text-emerald-600'}`}>{report.reportType}</span><span className="hidden truncate text-xs text-slate-500 sm:block">{reportLocation(report)}</span><StatusBadge tone={statusTone(report.status)}>{report.status.replaceAll('_', ' ')}</StatusBadge><div className="flex items-center justify-end gap-1"><Link to={`/reports/${report.id}/edit`} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600" aria-label="Edit report"><Pencil size={15} /></Link><button disabled={busyId === report.id} onClick={() => runAction(report.id, report.status === 'published' ? 'archive' : 'delete')} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={report.status === 'published' ? 'Archive report' : 'Delete report'}>{report.status === 'published' ? <MoreHorizontal size={16} /> : <Trash2 size={15} />}</button></div></div>)}</div> : <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center"><h2 className="font-display text-lg font-bold text-[#0d2340]">No reports yet</h2><p className="mt-2 text-sm text-slate-500">Create your first lost or found report to get started.</p><div className="mt-5 flex justify-center gap-3"><Button to="/report-lost">Report lost</Button><Button to="/report-found" variant="secondary">Report found</Button></div></div>}</div>;
}

export default MyReports;

