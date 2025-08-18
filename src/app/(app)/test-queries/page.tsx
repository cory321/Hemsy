import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TestAppointmentQuery } from '@/components/test-appointment-query';
import { TestAppointmentPrefetch } from '@/components/test-appointment-prefetch';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default async function TestQueriesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!userData) redirect('/onboarding');

  const { data: shopData } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (!shopData) redirect('/onboarding');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Appointment Queries</h1>

      <div className="space-y-8">
        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Basic Query Test</h2>
          <TestAppointmentQuery shopId={shopData.id} />
        </section>

        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">
            Prefetch & Mutations Test
          </h2>
          <TestAppointmentPrefetch shopId={shopData.id} />
        </section>

        <section className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Route Test</h2>
          <p>Test the edge runtime API:</p>
          <code className="block bg-gray-100 p-2 mt-2">
            curl &quot;http://localhost:3000/api/appointments/time-range?shopId=
            {shopData.id}&amp;startDate=2024-01-01&amp;endDate=2024-01-31&quot;
          </code>
        </section>
      </div>
    </div>
  );
}
