import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { submitCustomOrder } from '../api/customOrders';

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;

const CustomizeChocolate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({ title: '', description: '' });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFiles = (files) => {
    const valid = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not an image`); return false; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`${f.name} exceeds 5MB`); return false; }
      return true;
    });
    if (images.length + valid.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setImages((p) => [...p, ...valid]);
    setPreviews((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!form.title.trim()) return toast.error('Please give your request a title');
    if (!form.description.trim()) return toast.error('Please describe your custom chocolate');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      images.forEach((img) => fd.append('referenceImages', img));

      await submitCustomOrder(fd);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="bg-choco-gradient py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-choco-700/25 blur-3xl" />
        </div>
        <div className="page-container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-400 text-sm font-medium mb-6">
              ✨ Personalized Just for You
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-cream mb-4">
              Customize Your Chocolate
            </h1>
            <p className="text-choco-200 text-lg max-w-2xl mx-auto leading-relaxed">
              Dream up your perfect chocolate — we'll craft it fresh and send you a personalized price quote.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 60H1440V30C1200 0 960 60 720 30C480 0 240 60 0 30V60Z" fill="#FFF8F0" /></svg>
        </div>
      </section>

      <section className="py-16 bg-cream">
        <div className="page-container max-w-3xl">
          {submitted ? (
            /* ─── Success State ─────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-white rounded-3xl shadow-choco p-12"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-choco-900 mb-3">Request Submitted!</h2>
              <p className="text-choco-500 text-lg max-w-md mx-auto leading-relaxed mb-8">
                We've received your customization request. Our team will review it and send you a personalized price quote shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/my-custom-orders" className="btn-primary px-8 py-3">
                  📋 Track My Requests
                </Link>
                <Link to="/products" className="btn-secondary px-8 py-3">
                  Browse Products
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ─── Form ───────────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-4">
                <span className="text-2xl flex-shrink-0">💡</span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">How it works</p>
                  <ol className="text-amber-700 text-sm mt-1 space-y-0.5 list-decimal ml-4">
                    <li>Describe your dream chocolate below</li>
                    <li>We'll review and send you a price quote via email</li>
                    <li>Accept the quote and pay — we'll craft it fresh!</li>
                  </ol>
                </div>
              </div>

              {!user && (
                <div className="bg-choco-50 border border-choco-200 rounded-2xl p-4 mb-6 text-center">
                  <p className="text-choco-700 text-sm">
                    <Link to="/login" className="text-choco-900 font-semibold underline">Log in</Link> to submit your custom request.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} id="customize-chocolate-form" className="bg-white rounded-3xl shadow-choco p-8 space-y-6">
                {/* Title */}
                <div>
                  <label className="label" htmlFor="custom-title">
                    Request Name *
                    <span className="text-choco-400 font-normal ml-1">(give it a name so you can track it)</span>
                  </label>
                  <input
                    id="custom-title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Happy Birthday Kunafa Chocolate"
                    className="input-field"
                    maxLength={100}
                  />
                  <p className="text-xs text-choco-400 mt-1 text-right">{form.title.length}/100</p>
                </div>

                {/* Description */}
                <div>
                  <label className="label" htmlFor="custom-description">
                    Describe Your Chocolate *
                  </label>
                  <textarea
                    id="custom-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us about:
• Flavor / filling (e.g. pistachio, dark chocolate, kunafa)
• Occasion (birthday, anniversary, festival)
• Size or quantity
• Message to be written on the chocolate
• Any other preferences..."
                    className="input-field resize-none leading-relaxed"
                  />
                  <p className="text-xs text-choco-400 mt-1">{form.description.length} characters</p>
                </div>

                {/* Reference images */}
                <div>
                  <label className="label">
                    Reference Images
                    <span className="text-choco-400 font-normal ml-1">(optional, up to {MAX_IMAGES})</span>
                  </label>
                  {previews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-choco-200" />
                          <button type="button" onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length < MAX_IMAGES && (
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-choco-200 hover:border-choco-400 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:bg-choco-50/50">
                      <span className="text-3xl block mb-2">📸</span>
                      <p className="text-sm text-choco-500">Upload inspiration images — Pinterest screenshots, reference photos, etc.</p>
                      <p className="text-xs text-choco-400 mt-1">JPG, PNG, WEBP · Max 5MB each</p>
                      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                        id="custom-order-images" onChange={(e) => handleFiles(e.target.files)} />
                    </div>
                  )}
                </div>

                {/* No price note */}
                <div className="bg-choco-900 rounded-2xl p-5 text-center">
                  <p className="text-gold-400 font-semibold text-sm">✨ No price shown upfront</p>
                  <p className="text-choco-200 text-sm mt-1">
                    Our team will review your request and share a personalized price quote with you shortly. You only pay after seeing and approving the quote.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !user}
                  id="submit-custom-order-btn"
                  className="btn-gold w-full py-4 text-base"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Submitting Request...
                    </span>
                  ) : '🍫 Submit My Customization Request'}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomizeChocolate;
