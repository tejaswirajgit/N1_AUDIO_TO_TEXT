'use client';

import React, { useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';

type ReportType = 'COMPLAINT' | 'REQUEST' | 'ANNOUNCEMENT' | 'MAINTENANCE';
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

type Report = {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  reportedBy: string;
  date: string;
  priority: Priority;
  status: ReportStatus;
  emergency: boolean;
  responses: Array<{ adminName: string; timestamp: string; message: string }>;
};

const seedReports: Report[] = [
  {
    id: 'REP-001',
    type: 'COMPLAINT',
    title: 'Noise in Gym',
    description: 'The gym is too noisy after 8 PM.',
    reportedBy: 'Sarah J.',
    date: '2026-03-03',
    priority: 'HIGH',
    status: 'OPEN',
    emergency: false,
    responses: [{ adminName: 'John Manager', timestamp: '2026-03-03T16:00:00Z', message: 'We are checking this with security.' }],
  },
  {
    id: 'REP-002',
    type: 'MAINTENANCE',
    title: 'Pool heater broken',
    description: 'Pool heater is not maintaining proper temperature.',
    reportedBy: 'John S.',
    date: '2026-03-02',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    emergency: true,
    responses: [],
  },
  {
    id: 'REP-003',
    type: 'REQUEST',
    title: 'New equipment for gym',
    description: 'Request for additional treadmills.',
    reportedBy: 'Mike D.',
    date: '2026-03-01',
    priority: 'LOW',
    status: 'RESOLVED',
    emergency: false,
    responses: [],
  },
];

function typeClass(type: ReportType) {
  if (type === 'COMPLAINT') return 'bg-red-100 text-red-700';
  if (type === 'REQUEST') return 'bg-blue-100 text-blue-700';
  if (type === 'ANNOUNCEMENT') return 'bg-green-100 text-green-700';
  return 'bg-amber-100 text-amber-700';
}

function priorityClass(priority: Priority) {
  if (priority === 'CRITICAL') return 'bg-red-100 text-red-700';
  if (priority === 'HIGH') return 'bg-orange-100 text-orange-700';
  if (priority === 'MEDIUM') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-200 text-gray-700';
}

function statusClass(status: ReportStatus) {
  if (status === 'OPEN') return 'bg-blue-100 text-blue-700';
  if (status === 'IN_PROGRESS') return 'bg-orange-100 text-orange-700';
  if (status === 'RESOLVED') return 'bg-green-100 text-green-700';
  return 'bg-gray-200 text-gray-700';
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(seedReports);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | ReportType>('ALL');
  const [priority, setPriority] = useState<'ALL' | Priority>('ALL');
  const [status, setStatus] = useState<'ALL' | ReportStatus>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selected, setSelected] = useState<Report | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [nextStatus, setNextStatus] = useState<ReportStatus>('OPEN');

  const [announcementOpen, setAnnouncementOpen] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return reports.filter((r) => {
      const textMatch =
        !text ||
        r.title.toLowerCase().includes(text) ||
        r.reportedBy.toLowerCase().includes(text) ||
        r.description.toLowerCase().includes(text);
      const typeMatch = type === 'ALL' || r.type === type;
      const priorityMatch = priority === 'ALL' || r.priority === priority;
      const statusMatch = status === 'ALL' || r.status === status;
      const fromMatch = !fromDate || r.date >= fromDate;
      const toMatch = !toDate || r.date <= toDate;
      return textMatch && typeMatch && priorityMatch && statusMatch && fromMatch && toMatch;
    });
  }, [reports, search, type, priority, status, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  function openDetails(report: Report) {
    setSelected(report);
    setNextStatus(report.status);
    setNewResponse('');
  }

  function addResponse() {
    if (!selected || !newResponse.trim()) return;
    const response = {
      adminName: 'John Manager',
      timestamp: new Date().toISOString(),
      message: newResponse.trim(),
    };
    const updated = reports.map((r) => (r.id === selected.id ? { ...r, responses: [...r.responses, response] } : r));
    setReports(updated);
    setSelected(updated.find((r) => r.id === selected.id) || null);
    setNewResponse('');
  }

  function updateReportStatus() {
    if (!selected) return;
    const updated = reports.map((r) => (r.id === selected.id ? { ...r, status: nextStatus } : r));
    setReports(updated);
    setSelected(updated.find((r) => r.id === selected.id) || null);
  }

  function markEmergency() {
    if (!selected) return;
    const updated = reports.map((r) => (r.id === selected.id ? { ...r, emergency: !r.emergency } : r));
    setReports(updated);
    setSelected(updated.find((r) => r.id === selected.id) || null);
  }

  return (
    <AdminLayout title="Reports">
      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, user, description..."
                className="md:col-span-3 xl:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select value={type} onChange={(e) => setType(e.target.value as 'ALL' | ReportType)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="ALL">All Types</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="REQUEST">Request</option>
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value as 'ALL' | Priority)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="ALL">All Priority</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'ALL' | ReportStatus)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <button onClick={() => setAnnouncementOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Create Announcement
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold">Emergency Contacts</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="rounded-md border border-gray-200 p-2">Police: 911</li>
              <li className="rounded-md border border-gray-200 p-2">Building Manager: +1-555-1000</li>
              <li className="rounded-md border border-gray-200 p-2">Maintenance: +1-555-1001</li>
              <li className="rounded-md border border-gray-200 p-2">Emergency Email: emergency@building.com</li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-semibold">No reports found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2">Report ID</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Title</th>
                    <th className="py-2">Reported By</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Priority</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium text-blue-600">{report.id}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${typeClass(report.type)}`}>{report.type}</span></td>
                      <td className="py-3">{report.title}</td>
                      <td className="py-3">{report.reportedBy}</td>
                      <td className="py-3">{report.date}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass(report.priority)}`}>{report.priority}</span></td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(report.status)}`}>{report.status}</span></td>
                      <td className="py-3">
                        <button onClick={() => openDetails(report)} className="rounded-md border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm">
            <p className="text-gray-600">Page {page} of {pageCount}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{selected.id} Details</h3>
              <button onClick={() => setSelected(null)} className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <p><span className="font-medium">Type:</span> {selected.type}</p>
              <p><span className="font-medium">Priority:</span> {selected.priority}</p>
              <p><span className="font-medium">Status:</span> {selected.status}</p>
              <p><span className="font-medium">Date:</span> {selected.date}</p>
              <p className="sm:col-span-2"><span className="font-medium">Title:</span> {selected.title}</p>
              <p className="sm:col-span-2"><span className="font-medium">Description:</span> {selected.description}</p>
              <p className="sm:col-span-2"><span className="font-medium">Reported by:</span> {selected.reportedBy}</p>
            </div>

            {selected.emergency ? <p className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">EMERGENCY</p> : null}

            <div className="mt-4 rounded-lg border border-gray-200 p-3">
              <h4 className="font-medium">Response Timeline</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {selected.responses.length === 0 ? <li className="text-gray-500">No responses yet.</li> : null}
                {selected.responses.map((response) => (
                  <li key={`${response.timestamp}-${response.adminName}`} className="rounded-md border border-gray-100 p-2">
                    <p className="font-medium">{response.adminName}</p>
                    <p className="text-xs text-gray-500">{new Date(response.timestamp).toLocaleString('en-US')}</p>
                    <p className="mt-1">{response.message}</p>
                  </li>
                ))}
              </ul>

              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Add a response..."
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />
              <button onClick={addResponse} className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Add Response
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ReportStatus)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button onClick={updateReportStatus} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                Update Status
              </button>
              <button onClick={markEmergency} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                {selected.emergency ? 'Unmark Emergency' : 'Mark Emergency'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {announcementOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Create Announcement</h3>
            <div className="mt-4 space-y-3 text-sm">
              <input placeholder="Title" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <textarea placeholder="Message" className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={4} />
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option>All Residents</option>
                <option>Select Amenity</option>
                <option>Select User Group</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAnnouncementOpen(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Send
              </button>
              <button onClick={() => setAnnouncementOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
