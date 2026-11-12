import { useEffect, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../context/AuthContext';
import { getNotifications, getUnreadNotificationCount, markNotificationRead } from '../services/notifications';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Browse items', to: '/browse' },
  { label: 'My reports', to: '/my-reports' },
  { label: 'My claims', to: '/my-claims' }
];

function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${light ? 'bg-white/15 text-white' : 'bg-sky-600 text-white'}`}>
        <span className="text-lg font-black">S</span>
      </span>
      <span className={`font-display text-sm font-bold tracking-tight ${light ? 'text-white' : 'text-[#0d2340]'}`}>Campus<span className={light ? 'text-sky-200' : 'text-sky-600'}>Find</span></span>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div><Logo /><p className="mt-3 text-xs">Reconnecting our campus community, one item at a time.</p></div>
        <div className="flex gap-5"><Link to="/browse" className="hover:text-sky-600">Browse items</Link><Link to="/report-lost" className="hover:text-sky-600">Report lost</Link><Link to="/report-found" className="hover:text-sky-600">Report found</Link></div>
        <p className="text-xs">© 2024 CampusFind University</p>
      </div>
    </footer>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, request, getErrorMessage } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  useEffect(() => {
    if (!user) return undefined;
    getUnreadNotificationCount(request).then(setUnreadCount).catch(() => undefined);
    return undefined;
  }, [request, user]);
  const openNotifications = async () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      try {
        const result = await getNotifications(request, { limit: 5 });
        setNotifications(result.notifications);
        setNotificationError('');
      } catch (error) {
        setNotificationError(getErrorMessage(error));
      }
    }
  };
  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(request, notification.id);
      setUnreadCount((count) => Math.max(count - 1, 0));
    }
    setNotificationsOpen(false);
    if (notification.relatedEntityType === 'RecoveryClaim') navigate(`/claims/${notification.relatedEntityId}`);
    else if (notification.relatedEntityType === 'ItemReport') navigate(`/items/${notification.relatedEntityId}`);
    else navigate('/notifications');
  };
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-50 hover:text-[#0d2340]'}`}>{item.label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="relative"><button onClick={openNotifications} aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-[#0d2340]"><Bell size={19} />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>{notificationsOpen && <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><div className="flex items-center justify-between px-3 py-2"><p className="text-sm font-bold text-[#0d2340]">Notifications</p><Link to="/notifications" onClick={() => setNotificationsOpen(false)} className="text-xs font-bold text-sky-600">View all</Link></div>{notificationError && <p className="px-3 py-2 text-xs text-rose-600">{notificationError}</p>}{!notificationError && !notifications.length && <p className="px-3 py-5 text-center text-xs text-slate-500">No new notifications.</p>}{notifications.map((notification) => <button key={notification.id} onClick={() => openNotification(notification)} className={`block w-full rounded-xl px-3 py-3 text-left hover:bg-sky-50 ${notification.isRead ? '' : 'bg-sky-50/60'}`}><p className="truncate text-xs font-bold text-[#0d2340]">{notification.title}</p><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{notification.message}</p></button>)}</div>}</div>
          <div className="h-7 w-px bg-slate-200" />
          <Link to="/profile" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d2340] text-xs font-bold text-white">{initials}</span>
            <span className="hidden text-left xl:block"><span className="block text-xs font-bold text-[#0d2340]">{user?.name || 'Student'}</span><span className="block text-[10px] capitalize text-slate-400">{user?.role || 'Student'}</span></span>
            <ChevronDown size={14} className="text-slate-400" />
          </Link>
          <button onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut size={17} /></button>
        </div>
        <button className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && <div className="border-t border-slate-100 bg-white px-5 py-3 lg:hidden">{navItems.map((item) => <NavLink onClick={() => setOpen(false)} key={item.to} to={item.to} className={({ isActive }) => `block rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600'}`}>{item.label}</NavLink>)}<div className="mt-2 flex gap-2 border-t border-slate-100 pt-3"><Button to="/profile" variant="soft" className="flex-1">View profile</Button><Button onClick={signOut} variant="secondary" className="px-3" aria-label="Sign out"><LogOut size={16} /></Button></div></div>}
      {location.pathname === '/dashboard' && <div className="hidden" />}
    </header>
  );
}

export function AppLayout() {
  return <div className="min-h-screen bg-[#f7fafc]"><Header /><main><Outlet /></main><Footer /></div>;
}

export function AuthLayout() {
  return <div className="min-h-screen bg-[#f7fafc]"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8"><Logo /><Link to="/" className="text-sm font-semibold text-slate-500 hover:text-sky-600">Back to home</Link></div><main><Outlet /></main></div>;
}

