import { api } from "./axios-config";

interface PresignedUrlRequest {
  contentType: string;
  quantity: number;
  mediaType: 'image' | 'video';
  customIdentifier: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  filename: string;
}

export const getPresignedUrls = async (files: File[]): Promise<PresignedUrlResponse[]> => {
  const batchPromises = files.map(file => {
    // Remove a extensão do nome do arquivo, pois o backend adiciona automaticamente
    const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');

    return api.post("/v1/storage/presigned-url", {
      contentType: file.type,
      quantity: 1,
      mediaType: 'image' as const,
      customIdentifier: fileNameWithoutExtension,
    });
  });

  const responses = await Promise.all(batchPromises);

  const allPresignedData = responses.flatMap(response => response.data.urls);

  return allPresignedData;
};

export const uploadFileToGcp = async (uploadUrl: string, file: File, onUploadProgress?: (progressEvent: any) => void) => {
  await api.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress,
  });
};

interface SavePhotosPayload {
  userId: string;
  eventId: string;
  fileNames: string[];
}

export const saveUserEventPhotos = async (payload: SavePhotosPayload) => {
  const response = await api.post("/v1/users/events/photos", payload);
  return response.data;
};

interface Photo {
  id: string;
  fileName: string;
  signedUrl: string;
  createdAt: string;
}

export interface EventGroup {
  eventId: string;
  eventName: string;
  photos: Photo[];
}

interface UserEventPhotosResponse {
  eventGroups: EventGroup[];
  totalPhotos: number;
}

export const fetchUserEventPhotos = async (userId: string): Promise<UserEventPhotosResponse> => {
  const response = await api.get(`/v1/users/events/photos/user/${userId}`);
  return response.data;
};

export const deleteUserEventPhoto = async (photoId: string): Promise<void> => {
  await api.delete(`/v1/users/events/photos/${photoId}`);
};
