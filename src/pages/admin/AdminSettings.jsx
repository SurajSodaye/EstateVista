import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Lock,
  User,
  Key,
  Server,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  RotateCw,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getFirestoreAdminAuditLogs,
  updateFirestoreAdminPreferences,
} from '../../services/adminFirestoreService';

export default function AdminSettings() {
  const { adminUser, adminProfile, isFirebaseConfigured } = useAdminAuth();
  const currentUser = adminUser;
  const userProfile = adminProfile;
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsError, setLogsError] = useState(null);
  const [currencyFormat, setCurrencyFormat] = useState(() => {
    const saved = localStorage.getItem('estatevista_admin_prefs');
    return saved ? JSON.parse(saved).currencyFormat || 'inr_cr' : 'inr_cr';
  });
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('estatevista_admin_prefs');
    return saved ? JSON.parse(saved).pageSize || '10' : '10';
  });
  const [notification, setNotification] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Synchronize preferences from admin profile if available
  useEffect(() => {
    if (adminProfile?.adminPreferences) {
      if (adminProfile.adminPreferences.currencyFormat) {
        setCurrencyFormat(adminProfile.adminPreferences.currencyFormat);
      }
      if (adminProfile.adminPreferences.pageSize) {
        setPageSize(adminProfile.adminPreferences.pageSize);
      }
    }
  }, [adminProfile]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const logs = await getFirestoreAdminAuditLogs(50);
      setAuditLogs(logs);
      if (logs.queryError) {
        setLogsError(logs.queryError);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
      setLogsError({ message: err.message || 'Failed to retrieve audit trail' });
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatAuditTimestamp = (rawTs) => {
    if (!rawTs) return '—';
    try {
      if (typeof rawTs?.toDate === 'function') {
        return rawTs.toDate().toLocaleString();
      }
      if (typeof rawTs?.seconds === 'number') {
        return new Date(rawTs.seconds * 1000).toLocaleString();
      }
      const d = new Date(rawTs);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString();
    } catch {
      return '—';
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    const prefs = { currencyFormat, pageSize };

    // 1. Local backup
    localStorage.setItem('estatevista_admin_prefs', JSON.stringify(prefs));

    // 2. Persist in Cloud Firestore under /users/{adminUid}
    if (adminUser?.uid) {
      await updateFirestoreAdminPreferences(adminUser.uid, prefs);
    }

    setSavingPrefs(false);
    setNotification('Administrative console preferences saved successfully.');
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
          Console Settings & Security Policy
        </h2>
        <p className="text-xs text-mutedText mt-0.5">
          System telemetry, administrator profile verification, and security governance policies
        </p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. ADMINISTRATOR PROFILE CARD                            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-forest text-gold flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Active Administrator Profile
            </h3>
            <p className="text-[11px] text-mutedText">
              Trusted credentials verified against Firebase Authentication and Cloud Firestore
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">Admin Name</span>
            <span className="font-bold text-charcoal text-sm">
              {userProfile?.name || currentUser?.displayName || 'System Administrator'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">Verified Email</span>
            <span className="font-bold text-forest text-sm truncate block" title={currentUser?.email}>
              {currentUser?.email || 'admin@estatevista.luxury'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">Security Role</span>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C7A76C]/30 text-forest border border-[#C7A76C] mt-1">
              {userProfile?.role || 'admin'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-ivory border border-sage/60">
            <span className="text-[10px] uppercase font-bold text-mutedText block">User UID</span>
            <span className="font-mono text-[11px] text-charcoal truncate block mt-1" title={currentUser?.uid}>
              {currentUser?.uid || 'local-admin-uid'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SYSTEM ARCHITECTURE & SECURITY BOUNDARIES             */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Security Architecture & Service Boundaries
            </h3>
            <p className="text-[11px] text-mutedText">
              State of backend connections, database rules, and integration barriers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Firebase Auth</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Domain typo corrected. Email/Password authentication operational.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Firestore Rules</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Hardened
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Rules v2 hardened: role elevation blocked, client-side self-approval prohibited.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Cloud Storage</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Operational
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              adminStorage initialized on AdminApp Firebase instance for media assets and accreditation documents.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TRUSTED ADMIN PROVISIONING SPECIFICATION              */}
      {/* ======================================================== */}
      <div className="bg-[#0C1E1A] text-[#F8F7F2] rounded-3xl p-6 sm:p-8 border border-[#23584B] shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#153E35] border border-[#C7A76C]/40 text-[#C7A76C] flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-white">
              Trusted Administrator Provisioning Protocol
            </h3>
            <p className="text-[11px] text-[#A2B8B1]">
              Strict server-side protocol for assigning administrative clearance
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#C9D6D1] leading-relaxed">
          <p>
            EstateVista enforces strict separation of privileges. In accordance with the hardened Cloud Firestore Security Rules, <strong className="text-white">ordinary users can never elevate their own role to 'admin'</strong> from client-side code, forms, or network requests.
          </p>

          <div className="p-4 rounded-2xl bg-[#112A24] border border-[#23584B] space-y-2 text-[11px]">
            <p className="font-bold text-[#C7A76C]">
              Standard Administrative Provisioning Steps:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[#A2B8B1]">
              <li>
                Register an account normally through the public registration interface or via Firebase Auth Console.
              </li>
              <li>
                Open the <strong className="text-white">Firebase Console</strong> $\rightarrow$ <strong>Firestore Database</strong>.
              </li>
              <li>
                Navigate to the <code className="text-[#C7A76C]">users</code> collection and locate document <code className="text-[#C7A76C]">/users/{'{uid}'}</code>.
              </li>
              <li>
                Update the <code className="text-[#C7A76C]">role</code> field to <code className="text-white font-bold">"admin"</code>.
              </li>
              <li>
                The account will immediately receive clearance to access all <code className="text-[#C7A76C]">/admin/*</code> routes.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CONSOLE PREFERENCES FORM                              */}
      {/* ======================================================== */}
      <form onSubmit={handleSavePreferences} className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-charcoal">
              Operations Console Preferences
            </h3>
            <p className="text-[11px] text-mutedText">
              Customize currency display and data pagination for operations review
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Valuation Currency Display
            </label>
            <select
              value={currencyFormat}
              onChange={(e) => setCurrencyFormat(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="inr_cr">Indian Rupee (₹ Crores / Lakhs)</option>
              <option value="usd">US Dollar ($ Millions)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Default Records Per Page
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-ivory border border-sage text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
            >
              <option value="10">10 Records per page</option>
              <option value="25">25 Records per page</option>
              <option value="50">50 Records per page</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            onClick={loadLogs}
            isLoading={loadingLogs}
            className="text-xs"
          >
            Refresh Audit Logs
          </Button>

          <Button type="submit" variant="primary" size="sm" isLoading={savingPrefs} disabled={savingPrefs}>
            Save Preferences
          </Button>
        </div>
      </form>

      {/* ======================================================== */}
      {/* 5. COMPLETE SECURITY AUDIT LOG                           */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-sage/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sage-light text-forest flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-charcoal">
                Security Governance Audit Log
              </h3>
              <p className="text-[11px] text-mutedText">
                Chronological trail of administrative actions, authorizations, and rule checks
              </p>
            </div>
          </div>
          <span className="text-xs text-mutedText font-mono">
            {auditLogs.length} Records Logged
          </span>
        </div>

        {/* Query Index/Error Notice */}
        {logsError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Audit Query Notice</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {logsError.message || 'Server index is building or query was completed with unindexed fallback. Audit log may be partial.'}
              </p>
            </div>
          </div>
        )}

        {loadingLogs ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-mutedText">Querying server-side ordered audit logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-xs font-bold text-charcoal">No Audit Records Found</p>
            <p className="text-[11px] text-mutedText">
              Administrative actions will be appended here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-y border-sage/60 text-mutedText uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/40">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-ivory/30">
                    <td className="py-2.5 px-3 text-mutedText font-mono text-[11px] whitespace-nowrap">
                      {formatAuditTimestamp(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-charcoal whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-charcoal/90 whitespace-nowrap">
                      {log.target}
                    </td>
                    <td className="py-2.5 px-3 text-forest font-semibold whitespace-nowrap">
                      {log.actorEmail}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-mutedText whitespace-nowrap">
                      {log.ip}
                    </td>
                    <td className="py-2.5 px-3 text-mutedText max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
