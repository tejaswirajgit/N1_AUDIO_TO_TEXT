import React from 'react';
const bookings = [
  { id: 'B001', user: 'John Doe', amenity: 'Pool', date: '2026-03-05', status: 'Confirmed' },
  { id: 'B002', user: 'Jane Smith', amenity: 'Gym', date: '2026-03-06', status: 'Pending' },
  { id: 'B003', user: 'Alice Brown', amenity: 'Spa', date: '2026-03-07', status: 'Cancelled' },
  { id: 'B004', user: 'Bob Lee', amenity: 'Tennis Court', date: '2026-03-08', status: 'Confirmed' },
];

export default function BookingsTable() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="font-semibold text-lg mb-4">Recent Bookings</div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">ID</th>
            <th className="py-2">User</th>
            <th className="py-2">Amenity</th>
            <th className="py-2">Date</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b last:border-none">
              <td className="py-2">{b.id}</td>
              <td className="py-2">{b.user}</td>
              <td className="py-2">{b.amenity}</td>
              <td className="py-2">{b.date}</td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : b.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
