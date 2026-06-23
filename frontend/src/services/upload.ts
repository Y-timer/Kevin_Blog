import api from './api';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export function getAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${assetBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
