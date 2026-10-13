import { post } from './api';

const MAX_BYTES = 5 * 1024 * 1024;

// Uploads an image straight to Cloudinary using a short-lived signature from our API.
// folder: 'products' | 'stores' | 'avatars'. Resolves to the hosted https URL.
export async function uploadImage(file, folder) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.size > MAX_BYTES) throw new Error('Images must be 5 MB or smaller');

  const { data: sig } = await post('/uploads/signature', { folder });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message || 'Image upload failed');
  return body.secure_url;
}
