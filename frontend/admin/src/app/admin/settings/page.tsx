'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { supabase } from '@/lib/supabaseClient';

const activityLogSeed = [
  { action: 'Deleted Amenity: Gym', dateTime: 'Mar 3, 2026, 10:30 AM', ip: '192.168.1.1' },
  { action: 'Updated User: John Smith', dateTime: 'Mar 2, 2026, 3:45 PM', ip: '192.168.1.1' },
  { action: 'Approved Booking: BOOK-002', dateTime: 'Mar 2, 2026, 2:11 PM', ip: '192.168.1.2' },
  { action: 'Changed Building Phone', dateTime: 'Mar 1, 2026, 9:02 AM', ip: '192.168.1.3' },
  { action: 'Sent Announcement: Pool Maintenance', dateTime: 'Feb 28, 2026, 6:30 PM', ip: '192.168.1.1' },
  { action: 'Closed Report: REP-008', dateTime: 'Feb 28, 2026, 4:52 PM', ip: '192.168.1.4' },
  { action: 'Updated Amenity Rules: Swimming Pool', dateTime: 'Feb 27, 2026, 11:18 AM', ip: '192.168.1.1' },
  { action: 'Created Amenity: Rooftop Deck', dateTime: 'Feb 26, 2026, 8:24 PM', ip: '192.168.1.3' },
  { action: 'Changed Password', dateTime: 'Feb 25, 2026, 5:10 PM', ip: '192.168.1.1' },
  { action: 'Updated Notification Preferences', dateTime: 'Feb 25, 2026, 8:40 AM', ip: '192.168.1.1' },
  { action: 'Updated Theme: Light', dateTime: 'Feb 24, 2026, 10:05 PM', ip: '192.168.1.2' },
  { action: 'Added Emergency Contact', dateTime: 'Feb 24, 2026, 3:25 PM', ip: '192.168.1.1' },
];

export default function SettingsPage() {
  const [adminUserId, setAdminUserId] = useState('');
  const [account, setAccount] = useState({
    name: 'John Manager',
    email: 'john.manager@amenity-admin.com',
    phone: '+1-555-1010',
  });
  const [accountLoading, setAccountLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');

  const [building, setBuilding] = useState({
    name: 'Skyline Residency',
    address: '123 Urban Avenue, Austin, TX 78701',
    phone: '+1-555-1000',
    manager: 'John Manager',
  });

  const [prefs, setPrefs] = useState({
    newBookings: true,
    pendingApprovals: true,
    emergencySms: true,
    dailySummary: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark',
    language: 'English',
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });

  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    async function loadAccount() {
      setAccountLoading(true);
      setAccountError('');
      setAccountMessage('');

      try {
        if (!supabase) {
          setAccountError('Supabase is not configured.');
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          setAccountError('Unable to read current admin session.');
          return;
        }

        const authUserId = authData.user.id;
        const response = await fetch('/api/admin/users', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          setAccountError(payload?.detail || 'Unable to load admin profile.');
          return;
        }

        const users = Array.isArray(payload?.users) ? payload.users : [];
        const currentAdmin = users.find((u: any) => u.auth_user_id === authUserId) || users.find((u: any) => u.role === 'admin');

        if (!currentAdmin?.auth_user_id) {
          setAccountError('Admin profile not found.');
          return;
        }

        setAdminUserId(currentAdmin.auth_user_id);
        setAccount({
          name: currentAdmin.name || '',
          email: currentAdmin.email || '',
          phone: currentAdmin.phone || '',
        });
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : 'Unable to load admin profile.');
      } finally {
        setAccountLoading(false);
      }
    }

    void loadAccount();
  }, []);

  const saveAccountChanges = async () => {
    setSavingAccount(true);
    setAccountError('');
    setAccountMessage('');

    try {
      if (!adminUserId) {
        setAccountError('Admin user ID is missing. Reload the page and try again.');
        return;
      }

      const response = await fetch(`/api/admin/users/${adminUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: account.name,
          email: account.email,
          phone: account.phone,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAccountError(payload?.detail || payload?.message || 'Unable to save account changes.');
        return;
      }

      setAccountMessage('Account changes saved successfully.');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Unable to save account changes.');
    } finally {
      setSavingAccount(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(activityLogSeed.length / perPage));
  const pagedLogs = useMemo(() => activityLogSeed.slice((page - 1) * perPage, page * perPage), [page]);

  const passwordStrength = useMemo(() => {
    const value = passwordForm.next;
    if (!value) return { label: 'Empty', width: '0%', color: 'bg-gray-300' };
    const hasLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const score = [hasLength, hasUpper, hasNumber].filter(Boolean).length;
    if (score <= 1) return { label: 'Weak', width: '33%', color: 'bg-red-500' };
    if (score === 2) return { label: 'Medium', width: '66%', color: 'bg-amber-500' };
    return { label: 'Strong', width: '100%', color: 'bg-green-500' };
  }, [passwordForm.next]);

  const isPasswordValid =
    passwordForm.current.trim().length > 0 &&
    passwordForm.next.length >= 8 &&
    /[A-Z]/.test(passwordForm.next) &&
    /\d/.test(passwordForm.next) &&
    passwordForm.next === passwordForm.confirm;

  return (
    <AdminLayout title="Settings">
      <section className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Account</h2>
          {accountLoading ? <p className="mt-2 text-sm text-gray-500">Loading account details...</p> : null}
          {accountError ? <p className="mt-2 text-sm text-red-600">{accountError}</p> : null}
          {accountMessage ? <p className="mt-2 text-sm text-green-700">{accountMessage}</p> : null}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Admin Name</label>
              <input value={account.name} onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" disabled={accountLoading || savingAccount} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input value={account.email} onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" disabled={accountLoading || savingAccount} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input value={account.phone} onChange={(e) => setAccount((p) => ({ ...p, phone: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" disabled={accountLoading || savingAccount} />
            </div>
            <div>
              <label className="text-sm font-medium">Profile Picture</label>
              <input type="file" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" disabled={accountLoading || savingAccount} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={saveAccountChanges} disabled={accountLoading || savingAccount} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{savingAccount ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => setPasswordOpen(true)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100">Change Password</button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Building Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Building Name</label>
              <input value={building.name} onChange={(e) => setBuilding((p) => ({ ...p, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Building Phone</label>
              <input value={building.phone} onChange={(e) => setBuilding((p) => ({ ...p, phone: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Building Address</label>
              <input value={building.address} onChange={(e) => setBuilding((p) => ({ ...p, address: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Manager Name</label>
              <input value={building.manager} onChange={(e) => setBuilding((p) => ({ ...p, manager: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Building Image</label>
              <input type="file" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Changes</button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={prefs.newBookings} onChange={(e) => setPrefs((p) => ({ ...p, newBookings: e.target.checked }))} /> Email notifications for new bookings</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={prefs.pendingApprovals} onChange={(e) => setPrefs((p) => ({ ...p, pendingApprovals: e.target.checked }))} /> Email notifications for pending approvals</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={prefs.emergencySms} onChange={(e) => setPrefs((p) => ({ ...p, emergencySms: e.target.checked }))} /> SMS alerts for emergencies</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={prefs.dailySummary} onChange={(e) => setPrefs((p) => ({ ...p, dailySummary: e.target.checked }))} /> Daily summary report</label>
          </div>
          <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Preferences</button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setAppearance((p) => ({ ...p, theme: 'light' }))} className={`rounded-lg px-3 py-2 text-sm ${appearance.theme === 'light' ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}>Light</button>
                <button onClick={() => setAppearance((p) => ({ ...p, theme: 'dark' }))} className={`rounded-lg px-3 py-2 text-sm ${appearance.theme === 'dark' ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}>Dark</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <select value={appearance.language} onChange={(e) => setAppearance((p) => ({ ...p, language: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>Hindi</option>
              </select>
            </div>
          </div>
          <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Preferences</button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2">Action</th>
                  <th className="py-2">Date/Time</th>
                  <th className="py-2">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((row) => (
                  <tr key={`${row.action}-${row.dateTime}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5">{row.action}</td>
                    <td className="py-2.5">{row.dateTime}</td>
                    <td className="py-2.5">{row.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50">Previous</button>
            <span className="text-gray-600">Page {page} of {pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50">Next</button>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
          <p className="mt-2 text-sm text-red-700">Use these actions carefully. They affect admin access permanently.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Suspend Account</button>
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete Account</button>
          </div>
        </div>
      </section>

      {passwordOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-gray-500">Must be 8+ chars with 1 uppercase and 1 number.</p>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                </div>
                <p className="mt-1 text-xs text-gray-500">Strength: {passwordStrength.label}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {passwordForm.confirm && passwordForm.next !== passwordForm.confirm ? <p className="mt-1 text-xs text-red-600">Passwords do not match.</p> : null}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (!isPasswordValid) return;
                  setPasswordOpen(false);
                  setPasswordForm({ current: '', next: '', confirm: '' });
                }}
                disabled={!isPasswordValid}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Update Password
              </button>
              <button onClick={() => setPasswordOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
