import { useEffect, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, ChevronRight, Plus, Sparkles, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, MatchCard, SectionHeading, StatIcon, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getMatches, getReports, reportDate, reportImage, reportLocation } from '../services/reports';
import { getMyClaims } from '../services/claims';
import { getNotifications } from '../services/notifications';

function Dashboard() {
  const { request, user, getErrorMessage } = useAuth();
  const [matches, setMatches] = useState([]);
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    Promise.all([
      getMatches(request, { limit: 6 }),
      getReports(request, { mine: 'true', limit: 5, sort: 'newest' }),
      getReports(request, { mine: 'true', reportType: 'lost', limit: 1 }),
      getReports(request, { mine: 'true', reportType: 'found', limit: 1 }),
      getReports(request, { mine: 'true', status: 'recovered', limit: 1 }),
      getMyClaims(request, { limit: 1 }),
      getNotifications(request, { limit: 4 })
    ])
      .then(([matchResults, recentResults, lostResults, foundResults, recoveredResults, claimResults, notificationResults]) => {
        setMatches(matchResults);
        setReports(recentResults.reports);
        setActivities(notificationResults.notifications);
        setStats([
          { label: 'Lost items', value: lostResults.pagination.total, icon: 'search', tone: 'sky' },
          { label: 'Found items', value: foundResults.pagination.total, icon: 'package', tone: 'indigo' },
          { label: 'Recovered', value: recoveredResults.pagination.total, icon: 'check', tone: 'emerald' },
          { label: 'Pending claims', value: claimResults.pagination.total, icon: 'clock', tone: 'amber' }
        ]);
      })
      .catch((error) => {
        setMatchesError(getErrorMessage(error));
        setDashboardError(getErrorMessage(error));
      })
      .finally(() => {
        setMatchesLoading(false);
        setDashboardLoading(false);
      });
  }, [getErrorMessage, request]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12">
      <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-sky-600">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">Good morning, {user?.name?.split(' ')[0] || 'there'} <span aria-hidden>👋</span></h1>
          <p className="mt-2 text-sm text-slate-500">Here&apos;s what&apos;s happening with your items today.</p>
        </div>
        <div className="flex gap-3">
          <Button to="/report-lost" variant="secondary"><Plus size={16} /> Report lost</Button>
          <Button to="/report-found"><Upload size={16} /> Report found</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="flex items-start justify-between"><StatIcon type={stat.icon} tone={stat.tone} /><span className="text-xs font-semibold text-slate-400">This year</span></div>
            <p className="mt-5 text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-[#0d2340]">{stat.value}</p>
            <p className="mt-2 text-xs font-semibold text-slate-400">From your reports</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <SectionHeading
          eyebrow="Smart discovery"
          title="Potential matches"
          description="Transparent rule-based matches found across active campus reports."
          action={matches.length > 0 && <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700"><Bell size={14} /> {matches.length} new match{matches.length === 1 ? '' : 'es'}</span>}
        />
        {matchesLoading && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Looking for potential matches...</div>}
        {!matchesLoading && matchesError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{matchesError}</p>}
        {!matchesLoading && !matchesError && matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Sparkles className="mx-auto text-sky-500" size={24} />
            <p className="mt-3 text-sm font-bold text-[#0d2340]">No potential matches yet</p>
            <p className="mt-1 text-xs text-slate-500">We&apos;ll compare your active reports with newly published campus reports.</p>
          </div>
        )}
        {!matchesLoading && !matchesError && matches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{matches.map((match) => <MatchCard key={match.reportId} match={match} />)}</div>
        )}
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_330px]">
        <div>
          <SectionHeading title="Recent reports" description="Your latest lost and found activity." action={<Button to="/my-reports" variant="ghost">View all <ArrowRight size={16} /></Button>} />
          {dashboardLoading && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading your reports...</div>}
          {!dashboardLoading && dashboardError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{dashboardError}</p>}
          {!dashboardLoading && !dashboardError && <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-slate-100 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:grid"><span>Item</span><span>Type</span><span>Reported</span><span>Status</span></div>
            {reports.length ? reports.map((report) => (
              <Link to={`/items/${report.id}`} key={report.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-0 hover:bg-sky-50/40 sm:grid-cols-[1fr_0.8fr_0.8fr_0.7fr] sm:px-5">
                <div className="flex min-w-0 items-center gap-3"><div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-sky-50">{reportImage(report) ? <img src={reportImage(report)} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-slate-400">—</span>}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#0d2340]">{report.title}</p><p className="mt-1 truncate text-xs text-slate-400">{reportLocation(report)}</p></div></div>
                <span className={`text-xs font-semibold capitalize ${report.reportType === 'lost' ? 'text-amber-600' : 'text-emerald-600'}`}>{report.reportType}</span>
                <span className="hidden text-xs text-slate-500 sm:block">{reportDate(report)}</span>
                <StatusBadge tone={report.status === 'recovered' ? 'emerald' : report.status === 'rejected' ? 'rose' : 'sky'}>{report.status.replaceAll('_', ' ')}</StatusBadge>
              </Link>
            )) : <p className="p-6 text-sm text-slate-500">You have not submitted any reports yet.</p>}
          </div>
          }
        </div>
        <aside>
          <SectionHeading title="Activity" action={<Link to="/my-claims" className="text-xs font-bold text-sky-600">See all</Link>} />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-2">{activities.length ? activities.map((activity) => <div key={activity.id} className="flex gap-3 rounded-xl p-3 hover:bg-slate-50"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><CalendarDays size={15} /></span><div><p className="text-xs font-bold text-[#0d2340]">{activity.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{activity.message}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(activity.createdAt).toLocaleDateString()}</p></div></div>) : <p className="p-3 text-xs text-slate-500">No recent notifications.</p>}</div>
          <div className="mt-6 rounded-2xl bg-sky-50 p-5"><p className="font-display text-sm font-bold text-[#0d2340]">Looking for something?</p><p className="mt-2 text-xs leading-5 text-slate-500">Browse reports from across campus and see if your item has turned up.</p><Button to="/browse" variant="soft" className="mt-4 w-full">Browse items <ChevronRight size={15} /></Button></div>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;
