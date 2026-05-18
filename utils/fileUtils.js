/**
 * Converts a Cloudinary PDF URL to a JPG image URL.
 * Cloudinary supports this by simply changing the extension.
 * If the URL is already an image or not a Cloudinary URL, it returns the original.
 */
export const convertPdfToImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  // Check if it's a Cloudinary URL and ends with .pdf (case insensitive)
  if (url.includes('cloudinary.com') && url.toLowerCase().endsWith('.pdf')) {
    // Replace .pdf with .jpg
    // Also, we can add 'pg_1' to ensure only the first page is converted if it's a multi-page PDF
    // But Cloudinary defaults to the first page if not specified.
    return url.substring(0, url.lastIndexOf('.')) + '.jpg';
  }

  return url;
};
