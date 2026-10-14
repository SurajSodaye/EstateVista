import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ChevronDown,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminUsers,
  approveFirestoreUserOrAgent,
  rejectFirestoreUserOrAgent,
} from '../../services/adminFirestoreService';

export default function AdminUsers() {
  const { adminUser } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'customer' | 'agent' | 'admin' | 'pending' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingUid, setUpdatingUid] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getFirestoreAdminUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const data = await getFirestoreAdminUsers();
    setUsers(data);
    setIsRefreshing(false);
  };

  const formatUserRegistrationDate = (createdAt, joinedAt) => {
    const raw = createdAt || joinedAt;
    if (!raw) return '—';
    try {
      if (typeof raw?.toDate === 'function') {
        return raw.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
      if (typeof raw?.seconds === 'number') {
        return new Date(raw.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
      const d = new Date(raw);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Direct Status Management (Approve or Reject - The only control admin manages)
  const handleStatusDropdownChange = async (user, newStatus) => {
    if (!user || updatingUid) return;

    if (user.uid === adminUser?.uid) {
      setNotification('Security Policy: You cannot modify the approval status of your own administrator account.');
      setTimeout(() => setNotification(''), 4500);
      return;
    }

    setUpdatingUid(user.uid);
    try {
      if (newStatus === 'approved') {
        const isAdvisor =
          user.role === 'agent' ||
          user.advisorStatus === 'approved' ||
          user.advisorStatus === 'rejected' ||
          user.requestedAccountType === 'agent';

        const approvalType = isAdvisor ? 'agent' : 'user';

        const res = await approveFirestoreUserOrAgent(user.uid, {
          approvalType,
          notes: 'Approved via Admin Status Dropdown',
          adminUser,
        });

        if (res.success) {
          setNotification(res.message);
          await loadData();
          setTimeout(() => setNotification(''), 4500);
        } else {
          setNotification(`Error: ${res.message || 'Approval failed'}`);
          setTimeout(() => setNotification(''), 5000);
        }
      } else if (newStatus === 'rejected') {
        const isAdvisor =
          user.role === 'agent' ||
          user.advisorStatus === 'approved' ||
          user.advisorStatus === 'pending' ||
          user.requestedAccountType === 'agent';

        const rejectionType = isAdvisor ? 'agent' : 'user';

        const res = await rejectFirestoreUserOrAgent(user.uid, {
          rejectionType,
          reason: 'Rejected by Administrator via Status Dropdown',
          adminUser,
        });

        if (res.success) {
          setNotification(res.message);
          await loadData();
          setTimeout(() => setNotification(''), 4500);
        } else {
          setNotification(`Error: ${res.message || 'Rejection failed'}`);
          setTimeout(() => setNotification(''), 5000);
        }
      }
    } catch (err) {
      setNotification(`Error: ${err.message || 'Operation failed'}`);
      setTimeout(() => setNotification(''), 5000);
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    let matchesRole = true;
    if (roleFilter === 'all') {
      matchesRole = true;
    } else if (roleFilter === 'pending') {
      matchesRole = u.advisorStatus === 'pending' || u.requestedAccountType === 'agent';
    } else if (roleFilter === 'rejected') {
      matchesRole =
        u.accountStatus === 'rejected' ||
        u.accountStatus === 'suspended' ||
        u.status === 'rejected' ||
        u.advisorStatus === 'rejected';
    } else {
      matchesRole = u.role === roleFilter;
    }

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.displayName && u.displayName.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.uid && u.uid.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mutedText mb-1">
            <span>Operations</span>
            <span>&gt;</span>
            <span className="text-charcoal font-semibold">User Management</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
            Platform Users & Access Governance
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Manage account approval and rejection statuses
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-xs text-mutedText">
            Total Directory: <strong className="text-forest">{users.length} Users</strong>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-xs"
          >
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            notification.toLowerCase().includes('error') || notification.toLowerCase().includes('violation')
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.toLowerCase().includes('error') || notification.toLowerCase().includes('violation') ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-sage/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'customer', label: 'Customers' },
            { id: 'agent', label: 'Advisors (Agent)' },
            { id: 'admin', label: 'Admins' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                roleFilter === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-ivory text-charcoal/70 hover:bg-sage/30 border border-sage/40'
              }`}
            >
              {tab.label}
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

      {/* Table: Only Status is manageable by Admin */}
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/40">
                {filteredUsers.map((user) => {
                  const isCurrentAdmin = user.uid === adminUser?.uid;
                  const isUpdating = updatingUid === user.uid;

                  // Resolve whether account is currently rejected
                  const isRejected =
                    user.advisorStatus === 'rejected' ||
                    user.accountStatus === 'rejected' ||
                    user.accountStatus === 'suspended' ||
                    user.status === 'rejected';

                  const isPending = user.advisorStatus === 'pending';
                  const currentStatusValue = isRejected ? 'rejected' : isPending ? 'pending' : 'approved';

                  return (
                    <tr key={user.uid} className="hover:bg-ivory/40 transition-colors">
                      {/* User Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sage-light border border-sage flex items-center justify-center text-forest font-serif font-bold text-xs shrink-0">
                            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-charcoal truncate">{user.name}</p>
                              {isCurrentAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-forest/10 text-forest border border-forest/20">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-mutedText truncate">{user.email}</p>
                            <p className="text-[9px] text-mutedText/70 font-mono">UID: {user.uid}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4 text-charcoal/80 whitespace-nowrap">
                        {user.phone || '—'}
                      </td>

                      {/* Assigned Role (Read-only Badge: Admin cannot customize role) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-[#C7A76C]/30 text-forest border border-[#C7A76C]'
                              : user.role === 'agent'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {user.role || 'customer'}
                        </span>
                      </td>

                      {/* Status (Approve / Reject Dropdown - The ONLY control admin manages) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCurrentAdmin ? (
                          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-sage/30 text-forest border border-sage/60">
                            Current Session
                          </span>
                        ) : (
                          <div className="relative inline-flex items-center gap-2">
                            <div className="relative inline-block">
                              <select
                                value={currentStatusValue}
                                onChange={(e) => handleStatusDropdownChange(user, e.target.value)}
                                disabled={isUpdating}
                                className={`appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest ${
                                  currentStatusValue === 'approved'
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                    : currentStatusValue === 'rejected'
                                    ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                } ${isUpdating ? 'opacity-50' : ''}`}
                              >
                                <option value="approved">✓ Approved</option>
                                <option value="rejected">✕ Rejected</option>
                                {isPending && <option value="pending" disabled>⏳ Pending Review</option>}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-charcoal/50 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {isUpdating && (
                              <RotateCw className="w-3.5 h-3.5 text-forest animate-spin" />
                            )}
                          </div>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-right text-mutedText whitespace-nowrap">
                        {formatUserRegistrationDate(user.createdAt, user.joinedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

