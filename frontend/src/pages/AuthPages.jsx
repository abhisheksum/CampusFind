import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

function AuthShell({ mode, children }) {
  return <div className="mx-auto grid min-h-[calc(100vh-105px)] max-w-6xl items-center gap-14 px-5 py-12 sm:px-8 lg:grid-cols-[0.85fr_1fr]"><div className="hidden lg:block"><div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl font-black text-sky-600">S</div><h1 className="font-display text-4xl font-extrabold leading-tight text-[#0d2340]">{mode === 'login' ? <>Welcome back to<br /><span className="text-sky-600">CampusFind.</span></> : <>Join the campus<br /><span className="text-sky-600">community.</span></>}</h1><p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">{mode === 'login' ? 'Pick up where you left off and help reunite more belongings with their owners.' : 'Create your free student account and make lost-and-found easier for everyone.'}</p><div className="mt-9 flex items-center gap-3 text-sm font-semibold text-slate-600"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</span> Trusted by 8,000+ students</div></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(13,35,64,0.07)] sm:p-10">{children}</div></div>;
}

function FormAlert({ message, success = false }) {
  if (!message) return null;
  return <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</div>;
}

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getErrorMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell mode="login"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Student portal</p><h2 className="mt-2 font-display text-2xl font-bold text-[#0d2340]">Sign in to your account</h2><p className="mt-2 text-sm text-slate-500">Use your verified email address to continue.</p></div><FormAlert message={location.state?.message || (location.search.includes('verify=1') ? 'Please verify your email address before accessing the portal.' : error)} success={Boolean(location.state?.message)} /><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><span className="relative block"><Mail size={17} className="absolute left-3 top-3.5 text-slate-400" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" className="field pl-10" /></span></label><label className="block"><span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">Password <Link to="/forgot-password" className="text-xs font-semibold text-sky-600">Forgot password?</Link></span><span className="relative block"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-slate-400" /><input required type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" className="field pl-10 pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label><Button disabled={loading} type="submit" className="w-full py-3">{loading ? 'Signing in...' : 'Sign in'}</Button></form><p className="mt-7 text-center text-sm text-slate-500">New to CampusFind? <Link to="/register" className="font-bold text-sky-600">Create an account</Link></p></AuthShell>;
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', studentId: '', department: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, getErrorMessage } = useAuth();
  const navigate = useNavigate();
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/login', { state: { message: 'Account created. Check your email to verify it.' } });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return <AuthShell mode="register"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Get started</p><h2 className="mt-2 font-display text-2xl font-bold text-[#0d2340]">Create your account</h2><p className="mt-2 text-sm text-slate-500">Use any valid email address to join in a few seconds.</p></div><FormAlert message={error} /><form onSubmit={submit} className="space-y-4"><label className="block"><span className="label">Full name</span><span className="relative block"><UserRound size={17} className="absolute left-3 top-3.5 text-slate-400" /><input required value={form.name} onChange={update('name')} placeholder="Alex Smith" className="field pl-10" /></span></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Student ID</span><input required value={form.studentId} onChange={update('studentId')} placeholder="2024-00123" className="field" /></label><label><span className="label">Department</span><input required value={form.department} onChange={update('department')} placeholder="Computer Science" className="field" /></label></div><label className="block"><span className="label">Email address</span><span className="relative block"><Mail size={17} className="absolute left-3 top-3.5 text-slate-400" /><input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className="field pl-10" /></span></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Create password</span><input required minLength="8" type="password" value={form.password} onChange={update('password')} placeholder="Strong password" className="field" /></label><label><span className="label">Confirm password</span><input required minLength="8" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Repeat password" className="field" /></label></div><p className="text-xs leading-5 text-slate-400">Use 8+ characters with uppercase, lowercase, a number, and a special character.</p><label className="flex items-start gap-3 text-xs leading-5 text-slate-500"><input required type="checkbox" className="mt-1 accent-sky-600" /> I agree to the community guidelines and privacy policy.</label><Button disabled={loading} type="submit" className="mt-2 w-full py-3">{loading ? 'Creating account...' : 'Create account'}</Button></form><p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-sky-600">Sign in</Link></p></AuthShell>;
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { const response = await apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(response.data.message); } catch (requestError) { setError(requestError.message); } };
  return <AuthShell mode="login"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Account recovery</p><h2 className="mt-2 font-display text-2xl font-bold text-[#0d2340]">Reset your password</h2><p className="mt-2 text-sm text-slate-500">We&apos;ll send instructions to your email address.</p></div><FormAlert message={error || message} success={Boolean(message)} /><form onSubmit={submit} className="space-y-5"><label><span className="label">Email address</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field" /></label><Button type="submit" className="w-full py-3">Send reset link</Button></form><p className="mt-7 text-center text-sm text-slate-500"><Link to="/login" className="font-bold text-sky-600">Back to sign in</Link></p></AuthShell>;
}

export function VerifyEmail() {
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    if (!token) { setError('Verification token is missing.'); setMessage(''); return; }
    apiRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then((response) => { setMessage(response.data.message); setTimeout(() => navigate('/login'), 1200); })
      .catch((requestError) => { setError(requestError.message); setMessage(''); });
  }, [location.search, navigate]);
  return <AuthShell mode="login"><div className="text-center"><div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{error ? '!' : '✓'}</div><h2 className="mt-5 font-display text-2xl font-bold text-[#0d2340]">{error ? 'Verification failed' : 'Email verification'}</h2><p className={`mt-3 text-sm ${error ? 'text-rose-600' : 'text-slate-500'}`}>{error || message}</p><Button to="/login" variant="soft" className="mt-6">Continue to sign in</Button></div></AuthShell>;
}

