import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '../../api/campaigns';
import { getProducts } from '../../api/products';

const OCCASIONS = [
  { value: 'Valentines', label: "💗 Valentine's Day" },
  { value: 'MothersDay', label: "🌸 Mother's Day" },
  { value: 'FathersDay', label: "👔 Father's Day" },
  { value: 'Diwali', label: '🪔 Diwali' },
  { value: 'Christmas', label: '🎄 Christmas' },
  { value: 'Eid', label: '🌙 Eid' },
  { value: 'NewYear', label: '🎆 New Year' },
  { value: 'Custom', label: '✨ Custom Occasion' },
];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Active': return 'bg-emerald-100 text-emerald-700';
    case 'Scheduled': return 'bg-blue-100 text-blue-700';
    case 'Expired': return 'bg-gray-100 text-gray-500';
    case 'Inactive': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Hamper Sub-form ──────────────────────────────────────────────────────────
const HamperForm = ({ hamper, index, onChange, onRemove, allProducts }) => {
  const handleField = (key, value) => onChange(index, { ...hamper, [key]: value });
  const toggleProduct = (pid) => {
    const included = hamper.includedItems || [];
    const next = included.includes(pid) ? included.filter((id) => id !== pid) : [...included, pid];
    handleField('includedItems', next);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-choco-800 text-sm">🎁 Hamper #{index + 1}</p>
        <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">✕ Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Hamper Name *</label>
          <input className="input-field text-sm" placeholder="e.g. Lovers' Delight Box" value={hamper.name || ''} onChange={(e) => handleField('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label text-xs">Price (₹) *</label>
            <input type="number" min="0" className="input-field text-sm" placeholder="599" value={hamper.price || ''} onChange={(e) => handleField('price', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Stock</label>
            <input type="number" min="0" className="input-field text-sm" placeholder="10" value={hamper.stock || ''} onChange={(e) => handleField('stock', e.target.value)} />
          </div>
        </div>
      </div>
      <div>
        <label className="label text-xs">Description</label>
        <textarea className="input-field text-sm resize-none" rows={2} placeholder="What's inside this hamper..." value={hamper.description || ''} onChange={(e) => handleField('description', e.target.value)} />
      </div>
      <div>
        <label className="label text-xs">Hamper Image URL <span className="text-choco-400 font-normal">(paste Cloudinary URL)</span></label>
        <input className="input-field text-sm" placeholder="https://res.cloudinary.com/..." value={hamper.imageUrl || ''} onChange={(e) => handleField('imageUrl', e.target.value)} />
      </div>
      {allProducts.length > 0 && (
        <div>
          <label className="label text-xs">Included Products <span className="text-choco-400 font-normal">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2 mt-1 max-h-28 overflow-y-auto pr-1">
            {allProducts.map((p) => {
              const sel = (hamper.includedItems || []).includes(p._id);
              return (
                <button key={p._id} type="button" onClick={() => toggleProduct(p._id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${sel ? 'bg-choco-800 text-cream border-choco-800' : 'border-choco-200 text-choco-600 hover:border-choco-500'}`}>
                  {sel ? '✓ ' : ''}{p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Campaign Modal ───────────────────────────────────────────────────────────
const CampaignModal = ({ campaign, onClose, onSaved, allProducts }) => {
  const isEdit = !!campaign;
  const bannerRef = useRef();

  const [form, setForm] = useState({
    title: campaign?.title || '',
    occasion: campaign?.occasion || 'Custom',
    description: campaign?.description || '',
    startDate: campaign?.startDate ? campaign.startDate.slice(0, 10) : '',
    endDate: campaign?.endDate ? campaign.endDate.slice(0, 10) : '',
    isActive: campaign?.isActive !== false,
  });
  const [selectedProducts, setSelectedProducts] = useState(
    (campaign?.products || []).map((p) => (typeof p === 'object' ? p._id : p))
  );
  const [hampers, setHampers] = useState(
    (campaign?.hampers || []).map((h) => ({
      ...h,
      includedItems: (h.includedItems || []).map((i) => (typeof i === 'object' ? i._id : i)),
    }))
  );
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(campaign?.bannerImageUrl || '');
  const [submitting, setSubmitting] = useState(false);

  const handleField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const toggleProduct = (pid) =>
    setSelectedProducts((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );

  const addHamper = () => setHampers((prev) => [...prev, { name: '', description: '', imageUrl: '', price: '', stock: '', includedItems: [] }]);
  const updateHamper = (idx, val) => setHampers((prev) => prev.map((h, i) => (i === idx ? val : h)));
  const removeHamper = (idx) => setHampers((prev) => prev.filter((_, i) => i !== idx));

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Campaign title is required');
    if (!form.startDate || !form.endDate) return toast.error('Start and end dates are required');
    if (new Date(form.startDate) > new Date(form.endDate)) return toast.error('End date must be after start date');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('occasion', form.occasion);
      fd.append('description', form.description);
      fd.append('startDate', form.startDate);
      fd.append('endDate', form.endDate);
      fd.append('isActive', String(form.isActive));
      fd.append('products', JSON.stringify(selectedProducts));
      fd.append('hampers', JSON.stringify(hampers.map((h) => ({ ...h, price: Number(h.price) || 0, stock: Number(h.stock) || 0 }))));
      if (bannerFile) fd.append('bannerImage', bannerFile);

      let saved;
      if (isEdit) {
        const res = await updateCampaign(campaign._id, fd);
        saved = res.data.campaign;
        toast.success('Campaign updated! 🎉');
      } else {
        const res = await createCampaign(fd);
        saved = res.data.campaign;
        toast.success('Campaign created! 🎉');
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-choco-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-choco-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-choco-900">
              {isEdit ? '✏️ Edit Campaign' : '🎉 Create Campaign'}
            </h2>
            <p className="text-xs text-choco-400 mt-0.5">Special occasion collection for your storefront</p>
          </div>
          <button onClick={onClose} className="p-2 text-choco-400 hover:text-choco-900 hover:bg-choco-50 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} id={isEdit ? 'edit-campaign-form' : 'add-campaign-form'}>
          <div className="p-6 space-y-5">
            {/* Title + Occasion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Campaign Title *</label>
                <input className="input-field" placeholder="e.g. Valentine's Day Specials" value={form.title} onChange={(e) => handleField('title', e.target.value)} />
              </div>
              <div>
                <label className="label">Occasion</label>
                <select className="input-field" value={form.occasion} onChange={(e) => handleField('occasion', e.target.value)}>
                  {OCCASIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea className="input-field resize-none" rows={3} placeholder="Share the story behind this campaign..." value={form.description} onChange={(e) => handleField('description', e.target.value)} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date *</label>
                <input type="date" className="input-field" value={form.startDate} onChange={(e) => handleField('startDate', e.target.value)} />
              </div>
              <div>
                <label className="label">End Date *</label>
                <input type="date" className="input-field" value={form.endDate} onChange={(e) => handleField('endDate', e.target.value)} />
              </div>
            </div>

            {/* Active Toggle */}
            <label className="flex items-center gap-3 cursor-pointer bg-choco-50 rounded-2xl px-4 py-3">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={form.isActive} onChange={(e) => handleField('isActive', e.target.checked)} id="campaign-active-toggle" />
                <div className="w-10 h-5 bg-choco-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-choco-900">Campaign Active</p>
                <p className="text-xs text-choco-400">When off, campaign won't appear even within date range</p>
              </div>
            </label>

            {/* Banner Image */}
            <div>
              <label className="label">Banner Image <span className="text-choco-400 font-normal">(optional, recommended 1200×400px)</span></label>
              {bannerPreview && (
                <div className="relative mb-2 rounded-xl overflow-hidden">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-28 object-cover" />
                  <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(''); }} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                </div>
              )}
              <div onClick={() => bannerRef.current?.click()}
                className="border-2 border-dashed border-choco-200 hover:border-choco-400 rounded-2xl p-4 text-center cursor-pointer transition-colors hover:bg-choco-50/50">
                <span className="text-2xl block mb-1">🖼️</span>
                <p className="text-sm text-choco-500">Click to upload banner image</p>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" id="campaign-banner-input" onChange={handleBannerChange} />
              </div>
            </div>

            {/* Featured Products */}
            {allProducts.length > 0 && (
              <div>
                <label className="label">Featured Products <span className="text-choco-400 font-normal">(individually listed under campaign)</span></label>
                <div className="flex flex-wrap gap-2 mt-1 max-h-36 overflow-y-auto pr-1 py-1">
                  {allProducts.map((p) => {
                    const sel = selectedProducts.includes(p._id);
                    return (
                      <button key={p._id} type="button" onClick={() => toggleProduct(p._id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${sel ? 'bg-choco-800 text-cream border-choco-800' : 'border-choco-200 text-choco-600 hover:border-choco-500'}`}>
                        {sel ? '✓ ' : ''}{p.name} <span className="opacity-60">₹{p.price}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedProducts.length > 0 && <p className="text-xs text-choco-400 mt-1">{selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected</p>}
              </div>
            )}

            {/* Hampers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="label mb-0">Hampers / Gift Bundles</label>
                  <p className="text-xs text-choco-400">Combo sets with their own pricing</p>
                </div>
                <button type="button" onClick={addHamper} className="btn-secondary text-xs px-4 py-2">
                  + Add Hamper
                </button>
              </div>
              <div className="space-y-3">
                {hampers.map((h, i) => (
                  <HamperForm key={i} hamper={h} index={i} onChange={updateHamper} onRemove={removeHamper} allProducts={allProducts} />
                ))}
                {hampers.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-choco-100 rounded-2xl text-choco-400 text-sm">
                    No hampers yet — click "Add Hamper" to create a bundle
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-choco-100 px-6 py-4 rounded-b-3xl flex gap-3">
            <button type="submit" disabled={submitting} id="save-campaign-btn" className="btn-primary flex-1 py-3">
              {submitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </span>
              ) : (isEdit ? '✅ Update Campaign' : '🎉 Create Campaign')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6 py-3">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Main AdminCampaigns Page ─────────────────────────────────────────────────
const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCampaign, setModalCampaign] = useState(null); // null=closed, false=new, obj=edit
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([getCampaigns(), getProducts({ limit: 200 })]);
      setCampaigns(cRes.data.campaigns || []);
      setAllProducts(pRes.data.products || []);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteCampaign(id);
      setCampaigns((p) => p.filter((c) => c._id !== id));
      toast.success('Campaign deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (saved) => {
    setCampaigns((prev) => {
      const exists = prev.find((c) => c._id === saved._id);
      if (exists) return prev.map((c) => (c._id === saved._id ? saved : c));
      return [saved, ...prev];
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-choco-900">🎉 Campaigns</h1>
          <p className="text-choco-500 mt-1 text-sm">Special occasion collections & gift hampers</p>
        </div>
        <button onClick={() => setModalCampaign(false)} id="add-campaign-btn" className="btn-primary">
          ➕ New Campaign
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-choco-100 animate-pulse rounded-2xl" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🎉</span>
          <h3 className="font-display text-xl font-bold text-choco-900 mb-2">No campaigns yet</h3>
          <p className="text-choco-500 mb-6">Create your first special occasion campaign!</p>
          <button onClick={() => setModalCampaign(false)} className="btn-primary">➕ Create Campaign</button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const status = c.status;
            return (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-choco-100 shadow-sm overflow-hidden">
                <div className="flex items-stretch">
                  {/* Banner thumbnail */}
                  {c.bannerImageUrl ? (
                    <div className="w-32 flex-shrink-0 hidden sm:block">
                      <img src={c.bannerImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-32 flex-shrink-0 hidden sm:flex items-center justify-center bg-gradient-to-br from-choco-100 to-gold-100">
                      <span className="text-3xl">{OCCASIONS.find((o) => o.value === c.occasion)?.label?.split(' ')[0] || '🎉'}</span>
                    </div>
                  )}
                  <div className="flex-1 p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-choco-900 text-lg leading-tight">{c.title}</h3>
                        <span className={`badge text-xs ${getStatusStyle(status)}`}>{status}</span>
                      </div>
                      <p className="text-choco-500 text-sm mt-1 line-clamp-1">{c.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-xs text-choco-400">📅 {formatDate(c.startDate)} → {formatDate(c.endDate)}</span>
                        <span className="text-xs text-choco-400">🍫 {c.products?.length || 0} products</span>
                        <span className="text-xs text-choco-400">🎁 {c.hampers?.length || 0} hampers</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setModalCampaign(c)} id={`edit-campaign-${c._id}`}
                        className="p-2 text-choco-600 hover:text-choco-900 hover:bg-choco-100 rounded-lg transition-colors" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(c._id, c.title)} disabled={deleting === c._id} id={`delete-campaign-${c._id}`}
                        className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Delete">
                        {deleting === c._id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {modalCampaign !== null && (
          <CampaignModal
            campaign={modalCampaign || undefined}
            onClose={() => setModalCampaign(null)}
            onSaved={handleSaved}
            allProducts={allProducts}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCampaigns;
