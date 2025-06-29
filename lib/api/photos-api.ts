import { api } from "./axios-config";

interface PresignedUrlRequest {
  contentType: string;
  quantity: number;
  mediaType: 'image' | 'video';
}

interface PresignedUrlResponse {
  uploadUrl: string;
  filename: string;
}

export const getPresignedUrls = async (files: File[]): Promise<PresignedUrlResponse[]> => {
  const requests = files.map(file => ({
    contentType: file.type,
    quantity: 1, // Always 1 for individual file upload
    mediaType: 'image', // Assuming all are images for photos upload
  }));

  const batchPromises = requests.map(request =>
    api.post("/v1/storage/presigned-url", request)
  );

  const responses = await Promise.all(batchPromises);

  // Extract and flatten the 'urls' array from each response object
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

// New types and function for fetching existing photos
interface Photo {
  id: string;
  fileName: string;
  signedUrl: string;
  createdAt: string;
}

interface EventGroup {
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
