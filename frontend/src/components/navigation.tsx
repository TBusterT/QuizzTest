'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/quizzes', label: 'Quizzes' },
  { href: '/create', label: 'Create a quiz' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      {links.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (href === '/quizzes' && pathname.startsWith('/quizzes'));
        return (
          <Link
            key={href}
            href={href}
            className="nav-link"
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
