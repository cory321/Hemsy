import ClientsList from '@/components/clients/ClientsList';
import { getClients, getArchivedClientsCount } from '@/lib/actions/clients';

export default async function ClientsListWrapper() {
  const [initialData, archivedCount] = await Promise.all([
    getClients(1, 10),
    getArchivedClientsCount(),
  ]);

  return (
    <ClientsList
      initialData={initialData}
      getClientsAction={getClients}
      archivedClientsCount={archivedCount}
    />
  );
}
