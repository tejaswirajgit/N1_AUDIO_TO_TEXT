import React from 'react';
const reports = [
  { title: 'Monthly Revenue', value: '$8,400', trend: '+12%' },
  { title: 'Cancelled Bookings', value: '32', trend: '-5%' },
  { title: 'New Users', value: '48', trend: '+8%' },
];

export default function ReportsWidget() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="font-semibold text-lg mb-4">Reports</div>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.title} className="flex justify-between items-center">
            <span>{r.title}</span>
            <span className="font-bold">{r.value}</span>
            <span className={`ml-2 text-xs ${r.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{r.trend}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
