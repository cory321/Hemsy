import ClientsList from '@/components/clients/ClientsList';
import { getClients } from '@/lib/actions/clients';

export default async function ClientsListWrapper() {
  const initialData = await getClients(1, 10);
  return (
    <ClientsList initialData={initialData} getClientsAction={getClients} />
  );
}
