import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../api/auth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleFormChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handlePwdChange = (e) => setPwdForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateMe({
        name: form.name,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await updateMe({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 min-h-screen">
      <div className="page-container max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-choco-gradient flex items-center justify-center text-cream text-2xl font-bold font-display shadow-choco">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-choco-900">{user?.name}</h1>
            <p className="text-choco-500 text-sm">{user?.email}</p>
            <span className="badge bg-choco-100 text-choco-700 mt-1 capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-choco-100 rounded-xl p-1 mb-8">
          {['profile', 'password'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              id={`profile-tab-${tab}`}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-choco-900 shadow-sm' : 'text-choco-600 hover:text-choco-900'}`}
            >
              {tab === 'profile' ? '👤 Profile' : '🔒 Password'}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} id="profile-form" className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
              <h2 className="font-semibold text-choco-900 mb-5">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    value={user?.email}
                    className="input-field opacity-60 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="label" htmlFor="profile-phone">Phone</label>
                  <input
                    id="profile-phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="10-digit phone"
                    className="input-field"
                  />
                </div>
              </div>

              <h3 className="font-semibold text-choco-900 mt-6 mb-4">Delivery Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="profile-street">Street Address</label>
                  <textarea
                    id="profile-street"
                    name="street"
                    value={form.street}
                    onChange={handleFormChange}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="House/Flat No., Building, Street..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="profile-city">City</label>
                    <input id="profile-city" name="city" value={form.city} onChange={handleFormChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label" htmlFor="profile-state">State</label>
                    <input id="profile-state" name="state" value={form.state} onChange={handleFormChange} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="profile-pincode">Pincode</label>
                  <input id="profile-pincode" name="pincode" value={form.pincode} onChange={handleFormChange} maxLength={6} className="input-field max-w-xs" />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  id="save-profile-btn"
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  id="profile-logout-btn"
                  className="btn-danger"
                >
                  Logout
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} id="password-form" className="bg-white rounded-2xl shadow-sm border border-choco-100 p-6">
              <h2 className="font-semibold text-choco-900 mb-5">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="current-password">Current Password</label>
                  <input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    value={pwdForm.currentPassword}
                    onChange={handlePwdChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={handlePwdChange}
                    className="input-field"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={pwdForm.confirmPassword}
                    onChange={handlePwdChange}
                    className="input-field"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                id="change-password-btn"
                className="btn-primary mt-6"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
