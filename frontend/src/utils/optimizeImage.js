export function optimizeImage(url, width) {
  const prefix = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;
  if (!prefix.test(url) || !Number.isInteger(width) || width < 1) return url;
  const path = url.replace(prefix, '');
  // Leave signed URLs and existing transformation chains intact.
  if (/^s--|^[a-z]{1,3}_[^/]+\//.test(path)) return url;
  return url.replace(prefix, `$&f_auto,q_auto,w_${width}/`);
}
