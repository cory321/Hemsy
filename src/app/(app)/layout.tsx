import { ReactNode } from 'react';
import { ResponsiveNav } from '@/components/layout/ResponsiveNav';
import { AppointmentProvider } from '@/providers/AppointmentProvider';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function getUserWithShop() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError || !userData) redirect('/onboarding');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) redirect('/onboarding');

  return { user: userData, shop: shopData };
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userWithShop = await getUserWithShop();

  return (
    <AppointmentProvider shopId={userWithShop.shop.id}>
      <ResponsiveNav>{children}</ResponsiveNav>
    </AppointmentProvider>
  );
}
