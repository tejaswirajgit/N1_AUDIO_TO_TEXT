import React from 'react';
type HeaderProps = { title: string };

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Placeholder for user avatar, notifications, etc. */}
        <span className="inline-block w-8 h-8 bg-gray-200 rounded-full" />
      </div>
    </header>
  );
}
