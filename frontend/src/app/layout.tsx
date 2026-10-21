import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Navigation } from '@/components/navigation';

import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Quiz Builder',
    template: '%s | Quiz Builder',
  },
  description:
    'Create and organize custom quizzes with multiple question types.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header">
          <div className="header-content">
            <Link className="brand-wrapper" href="/quizzes">
              <span className="brand-icon">Q</span>
              <span className="brand-title">Quiz Builder</span>
            </Link>
            <Navigation />
          </div>
        </header>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
