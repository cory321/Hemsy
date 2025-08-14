export interface GarmentImageSources {
  photoUrl?: string;
  cloudPublicId?: string;
  presetIconKey?: string;
}

export interface ResolvedDisplayImage {
  kind: 'photo' | 'cloud' | 'preset' | 'default';
  src: string | null; // URL for photo/cloud or URL for 'preset', null for default
}

// Returns best display image precedence: uploaded photoUrl > cloudPublicId delivery URL > presetIconKey > null
export function resolveGarmentDisplayImage(
  input: GarmentImageSources
): ResolvedDisplayImage {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // Lazy import to avoid cycles in server envs
  const { getPresetIconUrl } = require('./presetIcons') as {
    getPresetIconUrl: (key?: string | null) => string | null;
  };

  if (input.photoUrl) {
    return { kind: 'photo', src: input.photoUrl };
  }

  if (input.cloudPublicId && cloudName) {
    return {
      kind: 'cloud',
      src: `https://res.cloudinary.com/${cloudName}/image/upload/${input.cloudPublicId}`,
    };
  }

  if (input.presetIconKey) {
    const url = getPresetIconUrl(input.presetIconKey);
    return { kind: 'preset', src: url ?? null };
  }

  return { kind: 'default', src: null };
}
