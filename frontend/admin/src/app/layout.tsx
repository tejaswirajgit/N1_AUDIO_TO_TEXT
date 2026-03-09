import '../styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'Amenity Admin',
  description: 'Admin dashboard for amenity booking platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
