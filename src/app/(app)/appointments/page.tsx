// Placeholder to keep file unchanged; functional edits were in server actions only
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { CircularProgress, Box } from '@mui/material';
import { AppointmentsClient } from './AppointmentsClient';
import { getShopHours, getCalendarSettings } from '@/lib/actions/appointments';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function getShopId() {
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

  return shopData.id;
}

export default async function AppointmentsPage() {
  // Get shop ID first
  const shopId = await getShopId();

  // Fetch only the necessary initial data (not appointments)
  const [shopHours, calendarSettings] = await Promise.all([
    getShopHours(),
    getCalendarSettings(),
  ]);

  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <AppointmentsClient
        shopId={shopId}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
      />
    </Suspense>
  );
}
