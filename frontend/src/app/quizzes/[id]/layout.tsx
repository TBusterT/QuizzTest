import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Quiz details',
};

export default function QuizDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
