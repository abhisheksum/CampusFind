import { useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, SectionHeading } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications';

function notificationPath(notification) {
  if (!notification.relatedEntityId) return '/notifications';
  return notification.relatedEntityType === 'RecoveryClaim'
    ? `/claims/${notification.relatedEntityId}`
    : notification.relatedEntityType === 'ItemReport'
      ? `/items/${notification.relatedEntityId}`
      : '/notifications';
}

function Notifications() {
  const { request, getErrorMessage } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getNotifications(request, filter ? { read: filter } : {})
      .then((result) => setNotifications(result.notifications))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const markAll = async () => {
    await markAllNotificationsRead(request);
    load();
  };

  const markRead = async (notification) => {
    if (!notification.isRead) await markNotificationRead(request, notification.id);
    load();
  };

  const remove = async (event, id) => {
    event.preventDefault();
    await deleteNotification(request, id);
    load();
  };

  return <div className="mx-auto max-w-4xl px-5 py-9 sm:px-8 lg:py-12"><SectionHeading eyebrow="Updates" title="Notifications" description="Stay informed about claims, report decisions, and potential matches." action={<div className="flex gap-2"><select value={filter} onChange={(event) => setFilter(event.target.value)} className="field w-32"><option value="">All</option><option value="false">Unread</option><option value="true">Read</option></select><Button variant="secondary" onClick={markAll}><Check size={15} /> Mark all read</Button></div>} />{loading && <p className="text-sm text-slate-500">Loading notifications...</p>}{!loading && error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{!loading && !error && !notifications.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Bell className="mx-auto text-sky-500" size={25} /><p className="mt-3 text-sm font-bold text-[#0d2340]">You&apos;re all caught up</p><p className="mt-1 text-xs text-slate-500">New account and report activity will appear here.</p></div>}{!loading && !error && notifications.length > 0 && <div className="space-y-3">{notifications.map((notification) => <Link onClick={() => markRead(notification)} to={notificationPath(notification)} key={notification.id} className={`flex gap-4 rounded-2xl border p-4 transition hover:border-sky-200 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-sky-100 bg-sky-50/60'}`}><span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600"><Bell size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row"><p className="text-sm font-bold text-[#0d2340]">{notification.title}</p><time className="text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p></div><button type="button" aria-label="Delete notification" onClick={(event) => remove(event, notification.id)} className="self-start rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></Link>)}</div>}</div>;
}

export default Notifications;
