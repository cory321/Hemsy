export function assignDefaultGarmentNames<T extends { name?: string | null }>(
  garments: T[]
): (T & { name: string })[] {
  return garments.map((garment, index) => {
    const trimmed = garment.name?.trim() ?? '';
    const name = trimmed.length > 0 ? trimmed : `Garment ${index + 1}`;
    return { ...garment, name } as T & { name: string };
  });
}
