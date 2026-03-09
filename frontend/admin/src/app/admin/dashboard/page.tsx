'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

type Range = 'Today' | 'This Week' | 'This Month';

const rangeTabs: Range[] = ['Today', 'This Week', 'This Month'];

const statsByRange: Record<Range, { bookings: number; pending: number; reports: number; capacity: number }> = {
  Today: { bookings: 12, pending: 3, reports: 2, capacity: 78 },
  'This Week': { bookings: 84, pending: 7, reports: 5, capacity: 72 },
  'This Month': { bookings: 342, pending: 11, reports: 9, capacity: 69 },
};

const todaysBookings = [
  { amenity: 'Gym', user: 'John Smith', slot: '06:00-07:00', status: 'CONFIRMED' },
  { amenity: 'Pool', user: 'Sarah Johnson', slot: '14:00-15:30', status: 'CONFIRMED' },
  { amenity: 'Lounge', user: 'Mike Davis', slot: '18:00-19:00', status: 'PENDING' },
  { amenity: 'Spa', user: 'Rachel Lee', slot: '09:00-10:00', status: 'CANCELLED' },
  { amenity: 'Conference Room', user: 'Adam Ray', slot: '11:00-12:30', status: 'CONFIRMED' },
];

const recentReports = [
  { title: 'Pool heater issue', reporter: 'Sarah Johnson', critical: true },
  { title: 'Noise in gym after 8 PM', reporter: 'Mike Davis', critical: false },
  { title: 'Broken locker handle', reporter: 'John Smith', critical: false },
  { title: 'AC not working in lounge', reporter: 'Priya Nair', critical: true },
];

function statusClass(status: string) {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-700';
  if (status === 'PENDING') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-200 text-gray-700';
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<Range>('Today');
  const stats = useMemo(() => statsByRange[range], [range]);

  return (
    <AdminLayout title="Dashboard">
      <section className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Dashboard Overview</h2>
              <p className="text-sm text-gray-600">Property manager insights for bookings, reports, and utilization.</p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              {rangeTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRange(tab)}
                  className={[
                    'rounded-md px-3 py-1.5 text-sm font-medium transition',
                    tab === range ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.bookings}</p>
            <p className="mt-1 text-xs text-gray-500">Confirmed bookings today</p>
          </article>

          <article className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Awaiting</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Awaiting admin review</p>
          </article>

          <article className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">New Reports</p>
            <p className="mt-2 text-3xl font-bold text-red-500">{stats.reports}</p>
            <p className="mt-1 text-xs text-gray-500">Complaints this week</p>
          </article>

          <article className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
            <p className="mt-2 text-3xl font-bold text-green-500">{stats.capacity}%</p>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-green-500" style={{ width: `${stats.capacity}%` }} />
            </div>
          </article>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Today's Bookings</h3>
              <Link href="/admin/bookings" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                View More
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2">Amenity</th>
                    <th className="py-2">User Name</th>
                    <th className="py-2">Time Slot</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysBookings.map((row) => (
                    <tr key={`${row.amenity}-${row.user}-${row.slot}`} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">{row.amenity}</td>
                      <td className="py-3">{row.user}</td>
                      <td className="py-3">{row.slot}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="py-3">
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Reports</h3>
                <Link href="/admin/reports" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>
              <ul className="space-y-3">
                {recentReports.map((report) => (
                  <li key={report.title} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{report.title}</p>
                      {report.critical ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Critical</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Reported by {report.reporter}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/admin/amenities" className="block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700">
                  Add Amenity
                </Link>
                <Link href="/admin/bookings" className="block rounded-lg bg-gray-800 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-900">
                  View All Bookings
                </Link>
                <Link href="/admin/users" className="block rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700">
                  Manage Users
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
