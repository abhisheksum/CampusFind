import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, MapPin, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { createReport, getReport, getReportOptions, updateReport, uploadReportImages } from '../services/reports';

const initialForm = {
  title: '',
  category: '',
  description: '',
  color: '',
  brand: '',
  model: '',
  dateOccurred: '',
  approximateTime: '',
  location: '',
  currentHoldingLocation: '',
  handlingNotes: ''
};

function ReportForm({ type }) {
  const { reportId } = useParams();
  const isEditing = Boolean(reportId);
  const [loadedType, setLoadedType] = useState('');
  const isLost = (loadedType || type) === 'lost';
  const navigate = useNavigate();
  const { request, getErrorMessage } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({ categories: [], locations: [] });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const previewsRef = useRef([]);

  useEffect(() => {
    getReportOptions(request)
      .then(setOptions)
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoadingOptions(false));
  }, [getErrorMessage, request]);

  useEffect(() => {
    if (!isEditing) return undefined;
    getReport(request, reportId)
      .then((report) => {
        setLoadedType(report.reportType);
        setForm({
          title: report.title,
          category: report.category?._id || report.category,
          description: report.description,
          color: report.identifyingAttributes?.color || '',
          brand: report.identifyingAttributes?.brand || '',
          model: report.identifyingAttributes?.model || '',
          dateOccurred: new Date(report.dateOccurred).toISOString().slice(0, 10),
          approximateTime: report.approximateTime || '',
          location: report.location?._id || report.location,
          currentHoldingLocation: report.currentHoldingLocation || '',
          handlingNotes: report.handlingNotes || ''
        });
        setExistingImages(report.images || []);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [getErrorMessage, isEditing, reportId, request]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => () => previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview)), []);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const selectFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length + existingImages.length > 5) {
      setError('You can upload up to 5 images.');
      return;
    }
    setError('');
    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };
  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((current) => current.filter((_file, fileIndex) => fileIndex !== index));
    setPreviews((current) => current.filter((_preview, previewIndex) => previewIndex !== index));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const images = files.length ? await uploadReportImages(request, files, setUploadProgress) : [];
      const payload = {
        reportType: type,
        title: form.title,
        category: form.category,
        description: form.description,
        dateOccurred: form.dateOccurred,
        approximateTime: form.approximateTime,
        location: form.location,
        currentHoldingLocation: isLost ? undefined : form.currentHoldingLocation,
        handlingNotes: isLost ? undefined : form.handlingNotes,
        identifyingAttributes: {
          ...(form.color ? { color: form.color } : {}),
          ...(form.brand ? { brand: form.brand } : {}),
          ...(form.model ? { model: form.model } : {})
        },
        images: [...existingImages, ...images]
      };
      if (isEditing) {
        delete payload.reportType;
        await updateReport(request, reportId, payload);
      } else {
        await createReport(request, payload);
      }
      navigate('/my-reports', { state: { message: `${isEditing ? 'Report updated' : `${isLost ? 'Lost' : 'Found'} item report published`} successfully.` } });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return <div className="mx-auto max-w-4xl px-5 py-9 sm:px-8 lg:py-12"><Link to="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600"><ArrowLeft size={16} /> Back to dashboard</Link><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">{isEditing ? 'Edit report' : 'Create a report'}</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#0d2340]">{isEditing ? 'Update your report' : `Report an item ${isLost ? 'you lost' : 'you found'}`}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{isLost ? 'Share as much detail as you can. It helps the right person recognize your item.' : 'Thank you for helping! Tell us where and when you found it so its owner can be reached.'}</p></div>{error && <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}<form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_290px]"><div className="space-y-6"><section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7"><h2 className="font-display text-lg font-bold text-[#0d2340]">Item details</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="label">What is the item?</span><input required value={form.title} onChange={update('title')} className="field" placeholder={isLost ? 'e.g. Navy canvas backpack' : 'e.g. Silver MacBook Pro'} /></label><label><span className="label">Category</span><select required disabled={loadingOptions} value={form.category} onChange={update('category')} className="field"><option value="">Select a category</option>{options.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label><label><span className="label">Color</span><input value={form.color} onChange={update('color')} className="field" placeholder="e.g. Navy blue" /></label><label><span className="label">Brand</span><input value={form.brand} onChange={update('brand')} className="field" placeholder="e.g. Apple" /></label><label><span className="label">Model</span><input value={form.model} onChange={update('model')} className="field" placeholder="e.g. MacBook Pro 14&quot;" /></label><label className="sm:col-span-2"><span className="label">Description</span><textarea required value={form.description} onChange={update('description')} rows="4" className="field resize-none" placeholder="Add unique details, marks, stickers, or anything else that could help identify it." /></label></div></section><section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7"><h2 className="font-display text-lg font-bold text-[#0d2340]">When and where?</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label><span className="label">{isLost ? 'Date last seen' : 'Date found'}</span><input required type="date" value={form.dateOccurred} onChange={update('dateOccurred')} className="field" /></label><label><span className="label">Approximate time</span><input type="time" value={form.approximateTime} onChange={update('approximateTime')} className="field" /></label><label className="sm:col-span-2"><span className="label">{isLost ? 'Where was it lost?' : 'Where was it found?'}</span><span className="relative block"><MapPin size={17} className="absolute left-3 top-3.5 text-slate-400" /><select required disabled={loadingOptions} value={form.location} onChange={update('location')} className="field pl-10"><option value="">Select a campus location</option>{options.locations.map((location) => <option key={location._id} value={location._id}>{location.name} · {location.building}</option>)}</select></span></label>{!isLost && <><label className="sm:col-span-2"><span className="label">Current holding location</span><input required value={form.currentHoldingLocation} onChange={update('currentHoldingLocation')} className="field" placeholder="e.g. Student Union front desk" /></label><label className="sm:col-span-2"><span className="label">Handling notes</span><textarea value={form.handlingNotes} onChange={update('handlingNotes')} rows="3" className="field resize-none" placeholder="Add safe handoff or handling information." /></label></>}</div></section></div><aside className="space-y-6"><section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-[#0d2340]">Add photos</h2><p className="mt-2 text-xs leading-5 text-slate-500">JPG, PNG, or WebP up to 5MB each. Add up to 5 images.</p>{existingImages.length > 0 && <div className="mb-3 grid grid-cols-3 gap-2">{existingImages.map((image) => <div key={image.publicId || image.url} className="group relative aspect-square overflow-hidden rounded-lg"><img src={image.url} alt={image.altText || 'Existing item'} className="h-full w-full object-cover" /><button type="button" onClick={() => setExistingImages((current) => current.filter((entry) => entry.url !== image.url))} className="absolute right-1 top-1 rounded-full bg-[#0d2340]/80 p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove existing image"><X size={12} /></button></div>)}</div>}<label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/60 p-5 text-center hover:bg-sky-50"><ImagePlus className="text-sky-500" /><span className="mt-3 text-sm font-bold text-sky-700">Choose photos</span><span className="mt-1 text-[11px] text-slate-400">{existingImages.length + files.length}/5 selected</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} className="hidden" /></label>{previews.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2">{previews.map((preview, index) => <div key={preview} className="group relative aspect-square overflow-hidden rounded-lg"><img src={preview} alt={files[index]?.name || 'Selected item'} className="h-full w-full object-cover" /><button type="button" onClick={() => removeFile(index)} className="absolute right-1 top-1 rounded-full bg-[#0d2340]/80 p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove image"><X size={12} /></button></div>)}</div>}</section><section className="rounded-2xl bg-[#0d2340] p-5 text-white"><p className="text-sm font-bold">Keep it safe</p><p className="mt-2 text-xs leading-5 text-sky-100/65">Avoid sharing sensitive information like passwords, full addresses, or financial details in your report.</p></section>{submitting && files.length > 0 && <div className="rounded-xl bg-sky-50 p-4 text-xs font-semibold text-sky-700">Uploading images: {uploadProgress}%<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-100"><div className="h-full bg-sky-600 transition-all" style={{ width: `${uploadProgress}%` }} /></div></div>}<Button disabled={submitting || loadingOptions} type="submit" className="w-full py-3">{submitting ? (isEditing ? 'Saving changes...' : 'Publishing report...') : (isEditing ? 'Save changes' : `Publish ${isLost ? 'lost' : 'found'} report`)}</Button><button type="button" disabled={submitting} onClick={() => navigate(-1)} className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel <X size={15} /></button></aside></form></div>;
}

export default ReportForm;

