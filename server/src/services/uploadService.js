import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Which roles may upload into which Cloudinary folder
const FOLDERS = {
  products: ['SELLER', 'ADMIN'],
  stores: ['SELLER', 'ADMIN'],
  avatars: ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPPORT', 'DELIVERY'],
};

// Signs a direct browser → Cloudinary upload, so the API secret never leaves the server
export function signUpload(user, folder) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) throw new ApiError(503, 'Image uploads are not configured');
  if (!FOLDERS[folder]) throw ApiError.badRequest('Invalid upload folder');
  if (!FOLDERS[folder].includes(user.role)) throw ApiError.forbidden('You cannot upload to this folder');

  const params = {
    folder: `shopsphere/${folder}`,
    timestamp: Math.floor(Date.now() / 1000),
  };
  // Cloudinary signature: SHA-1 of the alphabetically sorted params joined as k=v&k=v, followed by the secret
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');

  return { ...params, signature, apiKey, cloudName };
}
