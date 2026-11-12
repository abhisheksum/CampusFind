import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui';
import { apiRequest } from '../services/api';

function ResetPassword() {
  const token = new URLSearchParams(useLocation().search).get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(token ? '' : 'Reset token is missing.');
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const response = await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ ...form, token }) });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return <div className="mx-auto max-w-md px-5 py-16"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Account recovery</p><h1 className="mt-2 font-display text-2xl font-bold text-[#0d2340]">Choose a new password</h1><p className="mt-2 text-sm text-slate-500">Use a strong password you do not reuse elsewhere.</p>{(error || message) && <div className={`mt-5 rounded-xl px-4 py-3 text-sm ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}{!message && <form onSubmit={submit} className="mt-6 space-y-4"><label><span className="label">New password</span><input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="field" /></label><label><span className="label">Confirm password</span><input required minLength="8" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="field" /></label><p className="text-xs leading-5 text-slate-400">Use uppercase, lowercase, a number, and a special character.</p><Button disabled={!token} type="submit" className="w-full">Reset password</Button></form>}<Link to="/login" className="mt-6 block text-center text-sm font-bold text-sky-600">Back to sign in</Link></div></div>;
}

export default ResetPassword;

