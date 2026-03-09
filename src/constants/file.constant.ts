import path from 'path';

export const UPLOAD_DIR_IMAGE_TEMP = path.resolve('uploads', 'images', 'temp');
export const UPLOAD_DIR_IMAGE = path.resolve('uploads', 'images');
export const UPLOAD_DIR_VIDEO_TEMP = path.resolve('uploads', 'videos', 'temp');
export const UPLOAD_DIR_VIDEO = path.resolve('uploads', 'videos');

export const MAX_FILES_IMAGE = 4;
export const MAX_FILE_SIZE_IMAGE = 1024 * 1024 * 5; // 5MB
export const MAX_TOTAL_FILE_SIZE_IMAGE = MAX_FILE_SIZE_IMAGE * MAX_FILES_IMAGE;

export const MAX_FILES_VIDEO = 1;
export const MAX_FILE_SIZE_VIDEO = 1024 * 1024 * 50; // 50MB
// export const MAX_TOTAL_FILE_SIZE_VIDEO = MAX_FILE_SIZE_VIDEO * MAX_FILES_VIDEO;
