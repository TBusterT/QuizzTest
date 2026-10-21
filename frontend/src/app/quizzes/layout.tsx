import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Quizzes',
};

export default function QuizzesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
