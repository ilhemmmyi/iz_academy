import { supabaseStorage } from '../config/storage';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const MIME_TO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/x-msvideo': 'avi',
  'video/x-flv': 'flv',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const getExt = (mimetype: string): string =>
  MIME_TO_EXT[mimetype] ?? mimetype.split('/')[1]?.split(';')[0] ?? 'bin';

/* =========================
   UPLOAD
========================= */
export const uploadToStorage = async (
  buffer: Buffer,
  mimetype: string,
  folder: string
): Promise<string> => {
  const ext = getExt(mimetype);
  const key = `${folder}/${uuidv4()}.${ext}`;

  const { error } = await supabaseStorage.storage
    .from(config.supabase.storageBucket)
    .upload(key, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabaseStorage.storage
    .from(config.supabase.storageBucket)
    .getPublicUrl(key);

  return data.publicUrl;
};

/* =========================
   DELETE
========================= */
export const deleteFromStorage = async (url: string): Promise<void> => {
  const marker = `/object/public/${config.supabase.storageBucket}/`;
  const idx = url.indexOf(marker);

  if (idx === -1) return;

  const key = url.slice(idx + marker.length);

  await supabaseStorage.storage
    .from(config.supabase.storageBucket)
    .remove([key]);
};

/* =========================
   SIGNED URL (optional)
========================= */
export const getPresignedUrl = async (
  key: string,
  expiresIn = 3600
): Promise<string> => {
  const { data, error } = await supabaseStorage.storage
    .from(config.supabase.storageBucket)
    .createSignedUrl(key, expiresIn);

  if (error || !data) throw new Error(error?.message ?? 'Failed signed URL');

  return data.signedUrl;
};