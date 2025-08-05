import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { CircularProgress, Box } from '@mui/material';
import { AppointmentsClientRefactored } from './AppointmentsClientRefactored';
import { getShopHours, getCalendarSettings } from '@/lib/actions/appointments';
import { getAllClients } from '@/lib/actions/clients';
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

export default async function AppointmentsPageRefactored() {
  // Get shop ID first
  const shopId = await getShopId();

  // Fetch only the necessary initial data (not appointments)
  const [shopHours, calendarSettings, clients] = await Promise.all([
    getShopHours(),
    getCalendarSettings(),
    getAllClients(),
  ]);

  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <AppointmentsClientRefactored
        shopId={shopId}
        shopHours={shopHours}
        calendarSettings={calendarSettings}
        clients={clients}
      />
    </Suspense>
  );
}
