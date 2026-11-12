import { useEffect, useState } from 'react';
import { Grid2X2, List, Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, ItemCard } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getReportOptions, getReports } from '../services/reports';

const initialFilters = { search: '', reportType: '', category: '', location: '', status: '', from: '', to: '', sort: 'newest', page: 1 };

function BrowseItems() {
  const [params, setParams] = useSearchParams();
  const { request, getErrorMessage } = useAuth();
  const [filters, setFilters] = useState({ ...initialFilters, search: params.get('search') || '' });
  const [options, setOptions] = useState({ categories: [], locations: [] });
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [grid, setGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([getReportOptions(request), getReports(request, filters)])
      .then(([reportOptions, result]) => {
        setOptions(reportOptions);
        setReports(result.reports);
        setPagination(result.pagination);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [filters, getErrorMessage, request]);

  const update = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value, page: 1 }));
  const submit = (event) => {
    event.preventDefault();
    setParams(filters.search ? { search: filters.search } : {});
    setFilters((current) => ({ ...current, page: 1 }));
  };
  const clearFilters = () => {
    setFilters(initialFilters);
    setParams({});
  };

  return <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Community board</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">Browse items</h1><p className="mt-2 text-sm text-slate-500">Explore lost and found reports from around campus.</p></div><form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-50"><Search className="ml-3 text-slate-400" size={19} /><input value={filters.search} onChange={update('search')} placeholder="Search items, locations, categories..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400" /><Button type="submit" className="hidden sm:inline-flex">Search</Button><button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden" aria-label="Toggle filters"><SlidersHorizontal size={17} /></button></form><div className={`${showFilters ? 'grid' : 'hidden'} mt-4 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid sm:grid-cols-2 lg:grid-cols-5`}><label><span className="label">Type</span><select value={filters.reportType} onChange={update('reportType')} className="field"><option value="">All types</option><option value="lost">Lost</option><option value="found">Found</option></select></label><label><span className="label">Category</span><select value={filters.category} onChange={update('category')} className="field"><option value="">All categories</option>{options.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label><label><span className="label">Location</span><select value={filters.location} onChange={update('location')} className="field"><option value="">All locations</option>{options.locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}</select></label><label><span className="label">From</span><input type="date" value={filters.from} onChange={update('from')} className="field" /></label><label><span className="label">To</span><input type="date" value={filters.to} onChange={update('to')} className="field" /></label><div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5"><label className="max-w-xs flex-1"><span className="label">Sort</span><select value={filters.sort} onChange={update('sort')} className="field"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><Button type="button" variant="ghost" onClick={clearFilters}>Clear filters</Button></div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4"><div className="flex gap-2"><button onClick={() => setFilters((current) => ({ ...current, reportType: '', page: 1 }))} className={`rounded-full px-4 py-2 text-xs font-bold transition ${!filters.reportType ? 'bg-[#0d2340] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-sky-50'}`}>All items</button><button onClick={() => setFilters((current) => ({ ...current, reportType: 'lost', page: 1 }))} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filters.reportType === 'lost' ? 'bg-[#0d2340] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-sky-50'}`}>Lost items</button><button onClick={() => setFilters((current) => ({ ...current, reportType: 'found', page: 1 }))} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filters.reportType === 'found' ? 'bg-[#0d2340] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-sky-50'}`}>Found items</button></div><div className="flex items-center gap-3 text-xs text-slate-400"><span>{pagination.total} results</span><span className="h-4 w-px bg-slate-200" /><button onClick={() => setGrid(true)} className={grid ? 'text-sky-600' : ''} aria-label="Grid view"><Grid2X2 size={17} /></button><button onClick={() => setGrid(false)} className={!grid ? 'text-sky-600' : ''} aria-label="List view"><List size={18} /></button></div></div>{error && <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}{loading ? <div className="grid gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /></div> : reports.length ? <><div className={`mt-7 ${grid ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-3'}`}>{reports.map((report) => <ItemCard item={report} compact={!grid} key={report.id} />)}</div>{pagination.totalPages > 1 && <div className="mt-8 flex items-center justify-center gap-3"><Button disabled={pagination.page <= 1} variant="secondary" onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button><span className="text-xs font-semibold text-slate-500">Page {pagination.page} of {pagination.totalPages}</span><Button disabled={pagination.page >= pagination.totalPages} variant="secondary" onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button></div>}</> : <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center"><Search className="mx-auto text-slate-300" size={28} /><h2 className="mt-4 font-display text-lg font-bold text-[#0d2340]">No items found</h2><p className="mt-2 text-sm text-slate-500">Try a different search term or browse all reports.</p><Button variant="soft" className="mt-5" onClick={clearFilters}>Clear filters</Button></div>}</div>;
}

export default BrowseItems;

