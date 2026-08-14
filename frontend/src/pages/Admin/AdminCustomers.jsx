import { useState, useEffect } from 'react';
import { getCustomers } from '../../api/admin';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCustomers()
      .then((res) => setCustomers(res.data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-choco-900">Customers</h1>
        <p className="text-choco-500 mt-1">{customers.length} registered customers</p>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pr-10"
          id="admin-customer-search"
        />
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-choco-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-choco-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-choco-100 bg-choco-50">
                  <th className="text-left px-5 py-3 text-choco-700 font-semibold">Customer</th>
                  <th className="text-left px-5 py-3 text-choco-700 font-semibold hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-choco-700 font-semibold hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-choco-700 font-semibold hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer._id} className="border-b border-choco-50 last:border-0 hover:bg-choco-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-choco-gradient flex items-center justify-center text-cream font-bold text-sm flex-shrink-0">
                          {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-choco-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-choco-600 hidden sm:table-cell">{customer.email}</td>
                    <td className="px-5 py-3 text-choco-600 hidden md:table-cell">{customer.phone || '—'}</td>
                    <td className="px-5 py-3 text-choco-400 text-xs hidden lg:table-cell">
                      {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-choco-400">No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
