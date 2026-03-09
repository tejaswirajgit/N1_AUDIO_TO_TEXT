'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type AdminLayoutProps = {
  title: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'DB' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'BK' },
  { label: 'Amenities', href: '/admin/amenities', icon: 'AM' },
  { label: 'Users', href: '/admin/users', icon: 'US' },
  { label: 'Reports', href: '/admin/reports', icon: 'RP' },
  { label: 'Settings', href: '/admin/settings', icon: 'ST' },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminLayout({ title, children, toolbar }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminInitials, setAdminInitials] = useState('AD');

  const handleLogout = async () => {
    try {
      if (!supabase) {
        router.push('/login');
        return;
      }
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    async function loadAdminName() {
      try {
        const res = await fetch('/api/admin/users', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const admin = (data.users ?? []).find((u: any) => u.role === 'admin');
        if (admin) {
          const name = admin.name || admin.email || 'Admin';
          setAdminName(name);
          const parts = name.trim().split(/\s+/);
          setAdminInitials(parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase());
        }
      } catch { /* keep defaults */ }
    }
    void loadAdminName();
  }, []);

  const activeItem = useMemo(
    () => navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0],
    [pathname],
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {mobileOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-gray-200 bg-white transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Amenity Admin</p>
            <p className="text-sm font-semibold text-gray-800">Aminity Booking</p>
          </div>
          <button
            className="rounded-md p-2 text-sm text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            X
          </button>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-gray-600 hover:bg-gray-100',
                ].join(' ')}
                onClick={() => setMobileOpen(false)}
              >
                <span
                  className={[
                    'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold',
                    active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700',
                  ].join(' ')}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                |||
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{title}</p>
                <p className="truncate text-xs text-gray-500">Current section: {activeItem.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {toolbar}
              <button
                className="relative rounded-full border border-gray-200 p-2 text-xs text-gray-600 hover:bg-gray-100"
                aria-label="Notifications"
              >
                Bell
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                  3
                </span>
              </button>

              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-2 py-1.5 hover:bg-gray-100"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="hidden text-sm font-medium sm:block">{adminName}</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {adminInitials}
                  </span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                    <Link href="/admin/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
                      Account Details
                    </Link>
                    <Link href="/admin/settings" className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100">
                      Change Password
                    </Link>
                    <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
