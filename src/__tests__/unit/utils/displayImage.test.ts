import { resolveGarmentDisplayImage } from '@/utils/displayImage';

describe('resolveGarmentDisplayImage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'demo';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('prefers photoUrl when present', () => {
    const res = resolveGarmentDisplayImage({
      photoUrl: 'https://example.com/photo.jpg',
      cloudPublicId: 'abc',
      presetIconKey: 'tops.t_shirt',
    });
    expect(res.kind).toBe('photo');
    expect(res.src).toBe('https://example.com/photo.jpg');
  });

  it('falls back to cloud delivery URL when no photo but cloud public id exists', () => {
    const res = resolveGarmentDisplayImage({ cloudPublicId: 'folder/id' });
    expect(res.kind).toBe('cloud');
    expect(res.src).toContain(
      'https://res.cloudinary.com/demo/image/upload/folder/id'
    );
  });

  it('falls back to preset icon key when no photo or cloud id', () => {
    const res = resolveGarmentDisplayImage({ presetIconKey: 'tops.t_shirt' });
    expect(res.kind).toBe('preset');
    expect(res.src).toBe('tops.t_shirt');
  });

  it('returns default when nothing is set', () => {
    const res = resolveGarmentDisplayImage({});
    expect(res.kind).toBe('default');
    expect(res.src).toBeNull();
  });
});
