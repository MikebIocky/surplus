export function getMainImageUrl(images?: { url: string }[] | undefined): string | undefined {
  if (
    Array.isArray(images) &&
    images.length > 0 &&
    images[0].url &&
    !images[0].url.includes('your_cloud_name') &&
    !images[0].url.includes('placeholder.jpg')
  ) {
    return images[0].url;
  }
  return undefined; // or return '/no-image.png' for a local fallback
} 