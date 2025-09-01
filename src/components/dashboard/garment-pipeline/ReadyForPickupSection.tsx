import { getReadyForPickupGarments } from '@/lib/actions/dashboard';
import { ReadyForPickupSectionClient } from './ReadyForPickupSectionClient';

interface ReadyForPickupSectionProps {
  totalCount: number;
}

export async function ReadyForPickupSection({
  totalCount,
}: ReadyForPickupSectionProps) {
  try {
    const garments = await getReadyForPickupGarments();
    return (
      <ReadyForPickupSectionClient
        garments={garments}
        totalCount={totalCount}
      />
    );
  } catch (error) {
    console.error('Error fetching ready for pickup garments:', error);
    return (
      <ReadyForPickupSectionClient garments={[]} totalCount={totalCount} />
    );
  }
}
