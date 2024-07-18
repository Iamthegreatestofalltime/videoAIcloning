'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/ai-avatar', label: 'AI Avatar' },
    { href: '/social-media', label: 'Social Media Content' },
    { href: '/blogging', label: 'Blogging Content' },
    { href: '/funnel', label: 'Funnel Creation' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4 w-64 h-screen fixed left-0 top-0">
      <h2 className="text-2xl font-bold mb-6">Navigation</h2>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <span
                className={`block px-4 py-2 rounded cursor-pointer ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;