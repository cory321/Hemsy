import { ReactNode } from 'react';
import { ResponsiveNav } from '@/components/layout/ResponsiveNav';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { redirect } from 'next/navigation';
import { preloadAllStaticData } from '@/lib/actions/static-data-cache';

async function getUserWithShop() {
  // This will create user and shop if they don't exist
  const { user, shop } = await ensureUserAndShop();

  // Check if onboarding is completed
  if (!shop.onboarding_completed) {
    redirect('/onboarding');
  }

  return { user, shop };
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userWithShop = await getUserWithShop();

  // Preload commonly needed static data for better performance
  // This initiates cache warming without blocking the layout render
  void preloadAllStaticData(userWithShop.shop.id);

  return (
    <AppointmentProvider shopId={userWithShop.shop.id}>
      <ResponsiveNav>{children}</ResponsiveNav>
    </AppointmentProvider>
  );
}
