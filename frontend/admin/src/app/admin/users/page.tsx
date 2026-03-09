'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';

type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'INACTIVE';
type UserRole = 'admin' | 'resident' | 'user' | 'manager';

type User = {
  auth_user_id: string;
  resident_id: string;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  role: string;
  status: UserStatus;
  created_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
};

type UsersResponse = {
  users: User[];
};

type CreateUserResponse = {
  success: boolean;
  message: string;
  temporary_password: string;
  user: User;
};

const emptyForm = {
  resident_id: '',
  name: '',
  email: '',
  phone: '',
  apartment: '',
  role: 'resident' as UserRole,
};

function statusClass(status: UserStatus) {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'SUSPENDED') return 'bg-red-100 text-red-700';
  if (status === 'INACTIVE') return 'bg-gray-100 text-gray-700';
  return 'bg-amber-100 text-amber-700';
}

function roleClass(role: string) {
  return role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingSelectedUser, setIsEditingSelectedUser] = useState(false);
  const [savingSelectedUser, setSavingSelectedUser] = useState(false);
  const [selectedUserForm, setSelectedUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    apartment: '',
    role: 'resident' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ message: string; temporaryPassword: string; userName: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const payload = (await response.json()) as UsersResponse & { detail?: string };

      if (!response.ok) {
        throw new Error(payload.detail || 'Unable to load users.');
      }

      setUsers(payload.users || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setSelectedUserForm({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      phone: selectedUser.phone || '',
      apartment: selectedUser.apartment || '',
        role: (['admin', 'resident', 'user', 'manager'].includes(selectedUser.role) ? selectedUser.role : 'resident') as UserRole,
      status: selectedUser.status,
    });
    setIsEditingSelectedUser(false);
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) return users;

    return users.filter((user) => {
      return [user.resident_id, user.name, user.email, user.phone, user.apartment, user.role]
        .join(' ')
        .toLowerCase()
        .includes(cleaned);
    });
  }, [query, users]);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const payload = (await response.json()) as CreateUserResponse & { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail || 'Unable to create user.');
      }

      setUsers((currentUsers) => [payload.user, ...currentUsers.filter((user) => user.auth_user_id !== payload.user.auth_user_id)]);
      setSuccessMessage({
        message: payload.message,
        temporaryPassword: payload.temporary_password,
        userName: payload.user.name,
      });
      setFormData(emptyForm);
      setShowCreateModal(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create user.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateSelectedUser() {
    if (!selectedUser) return;
    setSavingSelectedUser(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.auth_user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUserForm),
      });

      const payload = (await response.json()) as { detail?: string; user?: User; success?: boolean; message?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.detail || 'Unable to update user.');
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.auth_user_id === payload.user!.auth_user_id ? payload.user! : user,
        ),
      );
      setSelectedUser(payload.user);
      setIsEditingSelectedUser(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update user.');
    } finally {
      setSavingSelectedUser(false);
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;

    setDeletingUser(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.auth_user_id}`, {
        method: 'DELETE',
      });

      const payload = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.detail || payload.message || 'Unable to delete user.');
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user.auth_user_id !== userToDelete.auth_user_id));
      if (selectedUser?.auth_user_id === userToDelete.auth_user_id) {
        setSelectedUser(null);
      }
      setUserToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete user.');
    } finally {
      setDeletingUser(false);
    }
  }

  return (
    <AdminLayout
      title="Users"
      toolbar={
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add User
        </button>
      }
    >
      <section className="space-y-5">
        {successMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="font-semibold">{successMessage.userName} was invited successfully.</p>
                <p>{successMessage.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="rounded-md border border-green-200 px-3 py-1.5 text-sm hover:bg-green-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by user ID, name, email, phone, or apartment..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:max-w-xl"
            />
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-semibold">No users found.</p>
              <p className="mt-2 text-sm text-gray-500">Add the first resident account from this page.</p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2">User ID</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Apt/Unit</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.auth_user_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium text-blue-600">{user.resident_id}</td>
                      <td className="py-3">{user.name || 'Unassigned'}</td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">{user.phone || 'Not provided'}</td>
                      <td className="py-3">{user.apartment || 'Not provided'}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleClass(user.role)}`}>{user.role}</span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(user.status)}`}>{user.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditingSelectedUser(true);
                            }}
                            className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Add User</h3>
                <p className="text-sm text-gray-500">Create a login account for a resident or staff member.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <form className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleCreateUser}>
              <label className="text-sm font-medium text-gray-700">
                User ID
                <input
                  required
                  value={formData.resident_id}
                  onChange={(event) => setFormData((current) => ({ ...current, resident_id: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="USR-101"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Name
                <input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Resident full name"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Email
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="resident@example.com"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Phone
                <input
                  required
                  value={formData.phone}
                  onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="+1-555-0101"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Apt/Unit
                <input
                  required
                  value={formData.apartment}
                  onChange={(event) => setFormData((current) => ({ ...current, apartment: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="A-301"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Role
                <select
                  value={formData.role}
                  onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value as UserRole }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="resident">Resident</option>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                The system will try invitation email first. If email sending is unavailable, a temporary password is generated.
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {userToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium text-gray-900">{userToDelete.name || userToDelete.email}</span>?
            </p>
            <p className="mt-2 text-xs text-gray-500">
              This removes login access and profile records. Deletion is blocked if the user has active bookings.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteUser()}
                disabled={deletingUser}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.name || 'User Profile'}</h3>
                <p className="text-sm text-gray-500">{selectedUser.resident_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 text-sm sm:grid-cols-2">
              <p><span className="font-medium">Auth User ID:</span> {selectedUser.auth_user_id}</p>
              <p><span className="font-medium">User ID:</span> {selectedUser.resident_id}</p>

              <label className="text-sm font-medium text-gray-700">
                Name
                <input
                  value={selectedUserForm.name}
                  onChange={(event) => setSelectedUserForm((current) => ({ ...current, name: event.target.value }))}
                  disabled={!isEditingSelectedUser}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  value={selectedUserForm.email}
                  onChange={(event) => setSelectedUserForm((current) => ({ ...current, email: event.target.value }))}
                  disabled={!isEditingSelectedUser}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Phone
                <input
                  value={selectedUserForm.phone}
                  onChange={(event) => setSelectedUserForm((current) => ({ ...current, phone: event.target.value }))}
                  disabled={!isEditingSelectedUser}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Apartment
                <input
                  value={selectedUserForm.apartment}
                  onChange={(event) => setSelectedUserForm((current) => ({ ...current, apartment: event.target.value }))}
                  disabled={!isEditingSelectedUser}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Role
                <select
                  value={selectedUserForm.role}
                  onChange={(event) => setSelectedUserForm((current) => ({ ...current, role: event.target.value as UserRole }))}
                  disabled={!isEditingSelectedUser}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="resident">Resident</option>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Status
                <select
                  value={selectedUserForm.status}
                  onChange={(event) => setSelectedUserForm((current) => ({ ...current, status: event.target.value as UserStatus }))}
                  disabled={!isEditingSelectedUser}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INVITED">INVITED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              <p><span className="font-medium">Created At:</span> {formatDateTime(selectedUser.created_at)}</p>
              <p><span className="font-medium">Last Sign In:</span> {formatDateTime(selectedUser.last_sign_in_at)}</p>
              <p className="sm:col-span-2"><span className="font-medium">Email Confirmed:</span> {formatDateTime(selectedUser.email_confirmed_at)}</p>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              {isEditingSelectedUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSelectedUser(false);
                      setSelectedUserForm({
                        name: selectedUser.name || '',
                        email: selectedUser.email || '',
                        phone: selectedUser.phone || '',
                        apartment: selectedUser.apartment || '',
                        role: (['admin', 'resident', 'user', 'manager'].includes(selectedUser.role) ? selectedUser.role : 'resident') as UserRole,
                        status: selectedUser.status,
                      });
                    }}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUpdateSelectedUser()}
                    disabled={savingSelectedUser}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingSelectedUser ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingSelectedUser(true)}
                  className="rounded-md border border-blue-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                >
                  Edit User
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
