import { uploadToStorage } from '../utils/storage';

export const UploadService = {
  async uploadVideo(buffer: Buffer, mimetype: string): Promise<string> {
    return uploadToStorage(buffer, mimetype, 'videos');
  },

  async uploadThumbnail(buffer: Buffer, mimetype: string): Promise<string> {
    return uploadToStorage(buffer, mimetype, 'thumbnails');
  },
};
