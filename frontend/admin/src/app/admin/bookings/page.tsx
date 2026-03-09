'use client';

import React, { useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';

type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

type Booking = {
  id: string;
  amenity: string;
  user: string;
  userEmail: string;
  date: string;
  time: string;
  capacity: string;
  status: BookingStatus;
  notes: string;
};

const initialBookings: Booking[] = [
  { id: 'BOOK-001', amenity: 'Gym', user: 'John Smith', userEmail: 'john@email.com', date: '2026-03-03', time: '06:00 - 07:00', capacity: '15/30', status: 'CONFIRMED', notes: 'Morning slot' },
  { id: 'BOOK-002', amenity: 'Pool', user: 'Sarah Johnson', userEmail: 'sarah@email.com', date: '2026-03-04', time: '14:00 - 15:30', capacity: '8/50', status: 'PENDING', notes: 'Guest pass requested' },
  { id: 'BOOK-003', amenity: 'Lounge', user: 'Mike Davis', userEmail: 'mike@email.com', date: '2026-03-04', time: '18:00 - 19:00', capacity: '6/20', status: 'CONFIRMED', notes: 'Team meetup' },
  { id: 'BOOK-004', amenity: 'Spa', user: 'Emma Clark', userEmail: 'emma@email.com', date: '2026-03-05', time: '10:00 - 11:00', capacity: '2/10', status: 'CANCELLED', notes: 'Cancelled by user' },
  { id: 'BOOK-005', amenity: 'Conference Room', user: 'Daniel Green', userEmail: 'daniel@email.com', date: '2026-03-05', time: '15:00 - 16:00', capacity: '12/15', status: 'PENDING', notes: 'Requires projector' },
  { id: 'BOOK-006', amenity: 'Pool', user: 'Olivia Moore', userEmail: 'olivia@email.com', date: '2026-03-06', time: '08:00 - 09:00', capacity: '10/50', status: 'CONFIRMED', notes: 'Training batch' },
  { id: 'BOOK-007', amenity: 'Gym', user: 'Noah White', userEmail: 'noah@email.com', date: '2026-03-06', time: '19:00 - 20:00', capacity: '16/30', status: 'PENDING', notes: '' },
  { id: 'BOOK-008', amenity: 'Lounge', user: 'Ava Turner', userEmail: 'ava@email.com', date: '2026-03-07', time: '13:00 - 14:00', capacity: '9/20', status: 'CONFIRMED', notes: '' },
  { id: 'BOOK-009', amenity: 'Spa', user: 'Liam Scott', userEmail: 'liam@email.com', date: '2026-03-07', time: '09:00 - 10:00', capacity: '5/10', status: 'CONFIRMED', notes: '' },
  { id: 'BOOK-010', amenity: 'Pool', user: 'Sophia Hall', userEmail: 'sophia@email.com', date: '2026-03-08', time: '17:00 - 18:00', capacity: '22/50', status: 'CANCELLED', notes: 'Weather issue' },
  { id: 'BOOK-011', amenity: 'Gym', user: 'Mason Reed', userEmail: 'mason@email.com', date: '2026-03-08', time: '07:00 - 08:00', capacity: '11/30', status: 'CONFIRMED', notes: '' },
  { id: 'BOOK-012', amenity: 'Conference Room', user: 'Isabella Young', userEmail: 'isabella@email.com', date: '2026-03-09', time: '11:00 - 12:00', capacity: '6/15', status: 'PENDING', notes: 'Client meeting' },
];

const amenities = ['All', 'Gym', 'Pool', 'Lounge', 'Spa', 'Conference Room'];
const statusOptions: Array<'All' | BookingStatus> = ['All', 'CONFIRMED', 'PENDING', 'CANCELLED'];

function statusClass(status: BookingStatus) {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-700';
  if (status === 'PENDING') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-200 text-gray-700';
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState<'All' | BookingStatus>('All');
  const [amenity, setAmenity] = useState('All');
  const [applied, setApplied] = useState({ search: '', fromDate: '', toDate: '', status: 'All' as 'All' | BookingStatus, amenity: 'All' });

  const [selected, setSelected] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    return bookings.filter((item) => {
      const text = applied.search.trim().toLowerCase();
      const textMatch =
        !text ||
        item.id.toLowerCase().includes(text) ||
        item.user.toLowerCase().includes(text) ||
        item.amenity.toLowerCase().includes(text);

      const statusMatch = applied.status === 'All' || item.status === applied.status;
      const amenityMatch = applied.amenity === 'All' || item.amenity === applied.amenity;
      const fromMatch = !applied.fromDate || item.date >= applied.fromDate;
      const toMatch = !applied.toDate || item.date <= applied.toDate;

      return textMatch && statusMatch && amenityMatch && fromMatch && toMatch;
    });
  }, [bookings, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  function applyFilters() {
    setApplied({ search, fromDate, toDate, status, amenity });
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setFromDate('');
    setToDate('');
    setStatus('All');
    setAmenity('All');
    setApplied({ search: '', fromDate: '', toDate: '', status: 'All', amenity: 'All' });
    setPage(1);
  }

  function openEditModal(item: Booking) {
    setEditTarget(item);
    setEditDate(item.date);
    setEditTime(item.time);
  }

  function saveEdit(nextStatus: BookingStatus) {
    if (!editTarget) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === editTarget.id
          ? {
              ...b,
              date: editDate || b.date,
              time: editTime || b.time,
              status: nextStatus,
            }
          : b,
      ),
    );
    setEditTarget(null);
  }

  function cancelBooking(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
  }

  return (
    <AdminLayout title="Bookings">
      <section className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name, amenity, booking ID..."
              className="xl:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <select value={status} onChange={(e) => setStatus(e.target.value as 'All' | BookingStatus)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={amenity} onChange={(e) => setAmenity(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {amenities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={applyFilters} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Apply Filters
            </button>
            <button onClick={resetFilters} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-base font-semibold">No bookings found</p>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create a booking</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2">Booking ID</th>
                    <th className="py-2">Amenity</th>
                    <th className="py-2">User</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">Capacity</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 align-top last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium text-blue-600">{item.id}</td>
                      <td className="py-3">{item.amenity}</td>
                      <td className="py-3">{item.user}</td>
                      <td className="py-3">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="py-3">{item.time}</td>
                      <td className="py-3">{item.capacity} people</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setSelected(item)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                            View Details
                          </button>
                          <button onClick={() => cancelBooking(item.id)} className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                            Cancel
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            disabled={item.status !== 'PENDING'}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Items per page</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-gray-300 px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Booking Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p><span className="font-medium">Booking ID:</span> {selected.id}</p>
              <p><span className="font-medium">User Name:</span> {selected.user}</p>
              <p><span className="font-medium">User Email:</span> {selected.userEmail}</p>
              <p><span className="font-medium">Amenity:</span> {selected.amenity}</p>
              <p><span className="font-medium">Date/Time:</span> {selected.date} | {selected.time}</p>
              <p><span className="font-medium">Capacity Used:</span> {selected.capacity}</p>
              <p><span className="font-medium">Status:</span> {selected.status}</p>
              <p><span className="font-medium">Notes:</span> {selected.notes || 'N/A'}</p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {selected.status === 'PENDING' ? (
                <button
                  onClick={() => {
                    setBookings((prev) => prev.map((b) => (b.id === selected.id ? { ...b, status: 'CONFIRMED' } : b)));
                    setSelected(null);
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Approve
                </button>
              ) : null}
              <button
                onClick={() => {
                  cancelBooking(selected.id);
                  setSelected(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selected.status === 'PENDING') openEditModal(selected);
                  setSelected(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button onClick={() => setSelected(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Edit Pending Booking</h3>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">Booking: {editTarget.id} ({editTarget.user})</p>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <input value={editTime} onChange={(e) => setEditTime(e.target.value)} placeholder="Time slot (e.g. 14:00 - 15:00)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => saveEdit('CONFIRMED')} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Approve
              </button>
              <button onClick={() => saveEdit('CANCELLED')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Reject
              </button>
              <button onClick={() => setEditTarget(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
