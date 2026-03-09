'use client';

import React, { useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';

type Amenity = {
  id: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  bookedToday: number;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  rules: {
    minSlotDuration: string;
    maxBookingDuration: string;
    advanceBookingDays: number;
    allowOverlapping: boolean;
    capacityOverride: string;
    approvalRequired: boolean;
  };
};

const seedAmenities: Amenity[] = [
  {
    id: 'AM-001',
    name: 'Fitness Center',
    type: 'GYM',
    description: 'Modern gym with cardio and weights',
    capacity: 30,
    bookedToday: 15,
    openingTime: '06:00',
    closingTime: '22:00',
    isActive: true,
    rules: {
      minSlotDuration: '30 min',
      maxBookingDuration: '2 hours',
      advanceBookingDays: 7,
      allowOverlapping: false,
      capacityOverride: '',
      approvalRequired: false,
    },
  },
  {
    id: 'AM-002',
    name: 'Swimming Pool',
    type: 'POOL',
    description: 'Temperature-controlled pool',
    capacity: 50,
    bookedToday: 30,
    openingTime: '08:00',
    closingTime: '20:00',
    isActive: true,
    rules: {
      minSlotDuration: '1 hour',
      maxBookingDuration: '4 hours',
      advanceBookingDays: 14,
      allowOverlapping: false,
      capacityOverride: '',
      approvalRequired: true,
    },
  },
  {
    id: 'AM-003',
    name: 'Community Lounge',
    type: 'LOUNGE',
    description: 'Shared social and co-working lounge',
    capacity: 20,
    bookedToday: 8,
    openingTime: '10:00',
    closingTime: '22:00',
    isActive: false,
    rules: {
      minSlotDuration: '30 min',
      maxBookingDuration: '2 hours',
      advanceBookingDays: 1,
      allowOverlapping: false,
      capacityOverride: '',
      approvalRequired: false,
    },
  },
];

const typeOptions = ['Gym', 'Pool', 'Lounge', 'Spa', 'Conference Room', 'Parking'];

const emptyForm = {
  id: '',
  name: '',
  type: 'Gym',
  description: '',
  capacity: 1,
  openingTime: '06:00',
  closingTime: '22:00',
  isActive: true,
};

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>(seedAmenities);
  const [formOpen, setFormOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editing, setEditing] = useState<Amenity | null>(null);
  const [rulesTarget, setRulesTarget] = useState<Amenity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Amenity | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<{ name?: string; capacity?: string; hours?: string }>({});

  const [ruleState, setRuleState] = useState({
    minSlotDuration: '30 min',
    maxBookingDuration: '2 hours',
    advanceBookingDays: 7,
    allowOverlapping: false,
    capacityOverride: '',
    approvalRequired: false,
  });

  const futureBookingsAffected = useMemo(() => (deleteTarget ? Math.max(1, deleteTarget.bookedToday - 2) : 0), [deleteTarget]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(item: Amenity) {
    setEditing(item);
    setForm({
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description,
      capacity: item.capacity,
      openingTime: item.openingTime,
      closingTime: item.closingTime,
      isActive: item.isActive,
    });
    setErrors({});
    setFormOpen(true);
  }

  function validateForm() {
    const nextErrors: { name?: string; capacity?: string; hours?: string } = {};
    if (!form.name.trim()) nextErrors.name = 'Amenity name is required';
    const duplicate = amenities.some((a) => a.name.toLowerCase() === form.name.trim().toLowerCase() && a.id !== form.id);
    if (duplicate) nextErrors.name = 'Amenity name must be unique';
    if (Number(form.capacity) <= 0) nextErrors.capacity = 'Capacity must be greater than 0';
    if (form.closingTime <= form.openingTime) nextErrors.hours = 'Closing time must be after opening time';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveAmenity() {
    if (!validateForm()) return;

    if (editing) {
      setAmenities((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                name: form.name.trim(),
                type: form.type.toUpperCase(),
                description: form.description,
                capacity: Number(form.capacity),
                openingTime: form.openingTime,
                closingTime: form.closingTime,
                isActive: form.isActive,
              }
            : item,
        ),
      );
    } else {
      const next: Amenity = {
        id: `AM-${String(amenities.length + 1).padStart(3, '0')}`,
        name: form.name.trim(),
        type: form.type.toUpperCase(),
        description: form.description,
        capacity: Number(form.capacity),
        bookedToday: 0,
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        isActive: form.isActive,
        rules: {
          minSlotDuration: '30 min',
          maxBookingDuration: '2 hours',
          advanceBookingDays: 7,
          allowOverlapping: false,
          capacityOverride: '',
          approvalRequired: false,
        },
      };
      setAmenities((prev) => [next, ...prev]);
    }
    setFormOpen(false);
  }

  function openRules(item: Amenity) {
    setRulesTarget(item);
    setRuleState({ ...item.rules });
    setRulesOpen(true);
  }

  function saveRules() {
    if (!rulesTarget) return;
    setAmenities((prev) => prev.map((a) => (a.id === rulesTarget.id ? { ...a, rules: { ...ruleState } } : a)));
    setRulesOpen(false);
  }

  function confirmDelete(item: Amenity) {
    setDeleteTarget(item);
    setDeleteOpen(true);
  }

  function deleteAmenity() {
    if (!deleteTarget) return;
    setAmenities((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteOpen(false);
  }

  return (
    <AdminLayout title="Amenities">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Manage Amenities</h2>
          <button onClick={openCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Add New Amenity
          </button>
        </div>

        {amenities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">No amenities yet. Create your first one.</p>
            <button onClick={openCreate} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add Amenity
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {amenities.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{item.type}</span>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                    <span>{item.isActive ? 'Active' : 'Inactive'}</span>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(e) =>
                        setAmenities((prev) => prev.map((a) => (a.id === item.id ? { ...a, isActive: e.target.checked } : a)))
                      }
                    />
                  </label>
                </div>

                <p className="mt-3 text-sm text-gray-600">{item.description}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p>Current capacity: {item.bookedToday}/{item.capacity} people booked today</p>
                  <p>Operating hours: {item.openingTime} - {item.closingTime}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(item)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100">
                    Edit
                  </button>
                  <button onClick={() => openRules(item)} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100">
                    Manage Rules
                  </button>
                  <button onClick={() => confirmDelete(item)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">{editing ? 'Edit Amenity' : 'Add New Amenity'}</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Amenity Name</label>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" maxLength={100} />
                {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.capacity}
                  onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.capacity ? <p className="mt-1 text-xs text-red-600">{errors.capacity}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} maxLength={500} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} />
              </div>

              <div>
                <label className="text-sm font-medium">Opening Time</label>
                <input type="time" value={form.openingTime} onChange={(e) => setForm((prev) => ({ ...prev, openingTime: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium">Closing Time</label>
                <input type="time" value={form.closingTime} onChange={(e) => setForm((prev) => ({ ...prev, closingTime: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {errors.hours ? <p className="mt-1 text-xs text-red-600">{errors.hours}</p> : null}
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
                Active
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={saveAmenity} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Save
              </button>
              <button onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rulesOpen && rulesTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Manage Rules - {rulesTarget.name}</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Min Slot Duration</label>
                <select value={ruleState.minSlotDuration} onChange={(e) => setRuleState((prev) => ({ ...prev, minSlotDuration: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option>15 min</option>
                  <option>30 min</option>
                  <option>1 hour</option>
                  <option>90 min</option>
                  <option>2 hours</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Max Booking Duration</label>
                <select value={ruleState.maxBookingDuration} onChange={(e) => setRuleState((prev) => ({ ...prev, maxBookingDuration: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>4 hours</option>
                  <option>8 hours</option>
                  <option>All day</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Advance Booking Window (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={ruleState.advanceBookingDays}
                  onChange={(e) => setRuleState((prev) => ({ ...prev, advanceBookingDays: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity Override</label>
                <input
                  value={ruleState.capacityOverride}
                  onChange={(e) => setRuleState((prev) => ({ ...prev, capacityOverride: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ruleState.allowOverlapping}
                  onChange={(e) => setRuleState((prev) => ({ ...prev, allowOverlapping: e.target.checked }))}
                />
                Allow Overlapping Bookings
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ruleState.approvalRequired}
                  onChange={(e) => setRuleState((prev) => ({ ...prev, approvalRequired: e.target.checked }))}
                />
                Booking Approval Required
              </label>
              {ruleState.approvalRequired ? (
                <p className="sm:col-span-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">All bookings for this amenity require admin approval.</p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={saveRules} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Save Rules
              </button>
              <button onClick={() => setRulesOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen && deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-red-600">Delete Amenity</h3>
            <p className="mt-3 text-sm text-gray-700">
              Are you sure you want to delete {deleteTarget.name}? This action cannot be undone.
            </p>
            <p className="mt-2 text-sm text-gray-600">Future bookings affected: {futureBookingsAffected}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={deleteAmenity} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Delete
              </button>
              <button onClick={() => setDeleteOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
