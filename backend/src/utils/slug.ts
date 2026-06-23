import slugifyLib from 'slugify';

export function slugify(text: string): string {
  return (
    slugifyLib(text, {
      lower: true,
      strict: true,
      locale: 'zh',
    }) +
    '-' +
    Date.now().toString(36)
  );
}
