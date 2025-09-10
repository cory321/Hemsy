import ClientsList from '@/components/clients/ClientsList';
import { getClients, getArchivedClientsCount } from '@/lib/actions/clients';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';

export default async function ClientsListWrapper() {
  const [initialData, archivedCount] = await Promise.all([
    getClients(1, 10),
    getArchivedClientsCount(),
  ]);

  // Prefetch for SSR hydration so the client does not refetch on mount
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['clients', 0, initialData.pageSize, '', false],
    queryFn: () =>
      getClients(1, initialData.pageSize, {
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeArchived: false,
      }),
    staleTime: 30 * 1000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientsList
        initialData={initialData}
        getClientsAction={getClients}
        archivedClientsCount={archivedCount}
      />
    </HydrationBoundary>
  );
}
