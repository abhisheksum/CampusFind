import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

function NotFound() {
  return <div className="flex min-h-[70vh] items-center justify-center px-5 text-center"><div><p className="font-display text-7xl font-extrabold text-sky-200">404</p><h1 className="mt-4 font-display text-2xl font-bold text-[#0d2340]">This page went missing</h1><p className="mt-2 text-sm text-slate-500">Let&apos;s get you back to the community board.</p><Button to="/" className="mt-6">Back to home</Button></div></div>;
}

export default NotFound;

