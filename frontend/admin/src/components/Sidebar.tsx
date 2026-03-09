import React from 'react';
import Link from 'next/link';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Bookings', href: '/admin/bookings' },
  { name: 'Amenities', href: '/admin/amenities' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Reports', href: '/admin/reports' },
  { name: 'Settings', href: '/admin/settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r flex flex-col min-h-screen">
      <div className="px-6 py-4 font-bold text-xl">Amenity Admin</div>
      <nav className="flex-1 px-2 space-y-2">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className="block px-4 py-2 rounded hover:bg-gray-100 text-gray-700">
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
