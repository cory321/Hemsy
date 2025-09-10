import { redirect } from 'next/navigation';
import { TestAppointmentQuery } from '@/components/test-appointment-query';
import { TestAppointmentPrefetch } from '@/components/test-appointment-prefetch';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default async function TestQueriesPage() {
  try {
    // Use optimized ensureUserAndShop instead of manual queries
    const { user, shop } = await ensureUserAndShop();

    // Check if onboarding is completed (ensureUserAndShop handles user/shop creation)
    if (!shop.onboarding_completed) {
      redirect('/onboarding');
    }

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Test Appointment Queries</h1>

        <div className="space-y-8">
          <section className="border p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Basic Query Test</h2>
            <TestAppointmentQuery shopId={shop.id} />
          </section>

          <section className="border p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">
              Prefetch & Mutations Test
            </h2>
            <TestAppointmentPrefetch shopId={shop.id} />
          </section>

          <section className="border p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">API Route Test</h2>
            <p>Test the edge runtime API:</p>
            <code className="block bg-gray-100 p-2 mt-2">
              curl
              &quot;http://localhost:3000/api/appointments/time-range?shopId=
              {shop.id}&amp;startDate=2024-01-01&amp;endDate=2024-01-31&quot;
            </code>
          </section>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in TestQueriesPage:', error);
    redirect('/sign-in');
  }
}
