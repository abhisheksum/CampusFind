import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { Button, SectionHeading, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getAdminUsers, updateUserRole, updateUserStatus } from '../services/admin';

function AdminUsers() {
  const { request, getErrorMessage } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });
  const [error, setError] = useState('');
  const load = () => getAdminUsers(request, filters).then((result) => setUsers(result.users)).catch((requestError) => setError(getErrorMessage(requestError)));
  useEffect(() => { load(); }, [filters.role, filters.isActive]);
  const changeStatus = async (user) => {
    if (!window.confirm(`${user.isActive ? 'Deactivate' : 'Reactivate'} ${user.name}?`)) return;
    try { await updateUserStatus(request, user.id, !user.isActive); load(); } catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  const changeRole = async (user, role) => {
    if (role === user.role || !window.confirm(`Change ${user.name}'s role to ${role}?`)) return;
    try { await updateUserRole(request, user.id, role); load(); } catch (requestError) { setError(getErrorMessage(requestError)); }
  };
  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12"><SectionHeading eyebrow="Administration" title="User management" description="Manage account status and roles without exposing authentication metadata." action={<div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={15} /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onKeyDown={(event) => event.key === 'Enter' && load()} placeholder="Search users" className="field w-48 pl-9" /></div><Button variant="secondary" onClick={load}>Search</Button></div>} /><div className="mb-5 flex gap-3"><select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })} className="field w-40"><option value="">All roles</option><option value="student">Student</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select><select value={filters.isActive} onChange={(event) => setFilters({ ...filters, isActive: event.target.value })} className="field w-40"><option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option></select></div>{error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-bold text-[#0d2340]">{user.name}</p><p className="mt-1 text-xs text-slate-400">{user.email} · {user.studentId}</p></td><td className="px-5 py-4 text-slate-500">{user.department}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><ShieldCheck size={15} className="text-sky-500" /><select value={user.role} onChange={(event) => changeRole(user, event.target.value)} className="field w-32"><option value="student">Student</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></div></td><td className="px-5 py-4"><StatusBadge tone={user.isActive ? 'emerald' : 'slate'}>{user.isActive ? 'Active' : 'Inactive'}</StatusBadge></td><td className="px-5 py-4"><Button variant="ghost" onClick={() => changeStatus(user)}>{user.isActive ? 'Deactivate' : 'Reactivate'}</Button></td></tr>)}</tbody></table>{!users.length && <p className="p-8 text-center text-sm text-slate-500">No users match these filters.</p>}</div></div>;
}

export default AdminUsers;
