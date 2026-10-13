import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  User,
  CheckCircle2,
  X,
  Edit2,
  Lock,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminUsers,
  updateFirestoreUserRole,
} from '../../services/adminFirestoreService';

export default function AdminUsers() {
  const { adminUser } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'customer' | 'agent' | 'admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState('customer');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getFirestoreAdminUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setSaving(true);
    const result = await updateFirestoreUserRole(
      selectedUser.uid,
      targetRole,
      adminUser?.email || 'Administrator'
    );
    setSaving(false);

    if (result.success) {
      setNotification(`User ${selectedUser.email || selectedUser.uid} role successfully set to: ${targetRole.toUpperCase()}`);
      setSelectedUser(null);
      await loadData();
      setTimeout(() => setNotification(''), 4500);
    } else {
      setNotification(`Error updating role: ${result.error?.message || 'Access denied'}`);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.uid.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
            Platform Users & Access Governance
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Directory of registered accounts, role clearances, and accreditation statuses
          </p>
        </div>
        <div className="text-xs text-mutedText">
          Total Directory Size: <strong className="text-forest">{users.length} Users</strong>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'customer', 'agent', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-ivory text-charcoal/70 hover:bg-sage/30 border border-sage/40'
              }`}
            >
              {r === 'agent' ? 'Advisors (Agent)' : r === 'all' ? 'All Roles' : `${r}s`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, or UID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ivory border border-sage/70 text-xs text-charcoal placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-mutedText">Loading user access directory...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-sage/60 text-center space-y-3">
          <Users className="w-10 h-10 text-mutedText mx-auto" />
          <h3 className="font-serif text-base font-bold text-charcoal">No Users Found</h3>
          <p className="text-xs text-mutedText">No users matched the selected filter and query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sage/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sage/60 text-mutedText uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Identity</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Advisor Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/40">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-ivory/40 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sage-light border border-sage flex items-center justify-center text-forest font-serif font-bold text-xs shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-charcoal truncate">{user.name}</p>
                          <p className="text-[11px] text-mutedText truncate">{user.email}</p>
                          <p className="text-[9px] text-mutedText/70 font-mono">UID: {user.uid}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-charcoal/80 whitespace-nowrap">
                      {user.phone || '—'}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-[#C7A76C]/30 text-forest border border-[#C7A76C]'
                            : user.role === 'agent'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Advisor Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          user.advisorStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-800'
                            : user.advisorStatus === 'pending'
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'text-mutedText'
                        }`}
                      >
                        {user.advisorStatus}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-mutedText whitespace-nowrap">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </td>

                    {/* Edit Role Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => {
                          setSelectedUser(user);
                          setTargetRole(user.role);
                        }}
                        className="text-xs"
                      >
                        Edit Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROLE MODIFICATION DIALOG                                 */}
      {/* ======================================================== */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-sage shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-sage/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Role Assignment & Clearance
                </span>
                <h3 className="font-serif text-xl font-bold text-charcoal mt-1">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-mutedText font-mono">
                  {selectedUser.email} • UID: {selectedUser.uid}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-xl text-mutedText hover:text-charcoal hover:bg-sage/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Radio Select */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-charcoal">
                Select Platform Clearance Role
              </label>

              <div className="space-y-2">
                {[
                  {
                    value: 'customer',
                    title: 'Customer (Unprivileged)',
                    desc: 'Standard public account. Can view listings, save favorites, submit inquiries. No portal access.',
                  },
                  {
                    value: 'agent',
                    title: 'Advisor / Agent',
                    desc: 'Accredited real estate professional. Can access Advisor Workspace, draft listings, manage inquiries.',
                  },
                  {
                    value: 'admin',
                    title: 'System Administrator',
                    desc: 'Executive governance clearance. Full access to Operations Console, role management, and audit logs.',
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`block p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      targetRole === opt.value
                        ? 'border-forest bg-sage-light/60 shadow-xs'
                        : 'border-sage/60 bg-ivory/50 hover:bg-ivory'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="userRole"
                        value={opt.value}
                        checked={targetRole === opt.value}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="mt-0.5 text-forest focus:ring-forest"
                      />
                      <div>
                        <div className="text-xs font-bold text-charcoal">{opt.title}</div>
                        <p className="text-[11px] text-mutedText mt-0.5 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Security Warning Notice */}
            <div className="p-3.5 rounded-xl bg-forest/5 border border-forest/20 text-[11px] text-charcoal space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <Lock className="w-4 h-4 text-forest shrink-0" />
                <span>Security Clearance Governance</span>
              </div>
              <p className="leading-relaxed text-mutedText">
                Modifying this account role commits an authenticated administrative update directly to Cloud Firestore document <code className="bg-sage/20 px-1 py-0.5 rounded font-mono text-charcoal">/users/{selectedUser.uid}</code> and appends a verified entry to <code className="bg-sage/20 px-1 py-0.5 rounded font-mono text-charcoal">/auditLogs</code>.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-sage/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedUser(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={CheckCircle2}
                onClick={handleSaveRole}
                isLoading={saving}
              >
                Apply Role Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
