export function getMainImageUrl(images?: { url: string; publicId: string }[]): string | undefined {
  if (!images || !Array.isArray(images)) return undefined;
  const found = images.find(img => typeof img.url === 'string' && img.url.trim());
  return found?.url;
} 