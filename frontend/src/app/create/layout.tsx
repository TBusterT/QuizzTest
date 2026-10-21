import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create quiz',
};

export default function CreateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
