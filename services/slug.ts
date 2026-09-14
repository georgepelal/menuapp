export const slugify = (name: string): string => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'menu';
};

export const withRandomSuffix = (slug: string): string => {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
};
