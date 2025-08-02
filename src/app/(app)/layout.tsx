import { ReactNode } from 'react';
import { ResponsiveNav } from '@/components/layout/ResponsiveNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ResponsiveNav>{children}</ResponsiveNav>;
}
