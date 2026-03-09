import React from 'react';
const stats = [
  { label: 'Total Bookings', value: 1280 },
  { label: 'Active Amenities', value: 24 },
  { label: 'Registered Users', value: 512 },
  { label: 'Revenue (This Month)', value: '$8,400' },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-lg font-medium text-gray-600">{stat.label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
