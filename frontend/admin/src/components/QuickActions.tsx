'use client';

import React from 'react';
const actions = [
  { label: 'Add Booking', onClick: () => alert('Add Booking') },
  { label: 'Add Amenity', onClick: () => alert('Add Amenity') },
  { label: 'Add User', onClick: () => alert('Add User') },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="font-semibold text-lg mb-4">Quick Actions</div>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
