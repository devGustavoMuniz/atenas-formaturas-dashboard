"use client"

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { fetchUserById } from "@/lib/api/users-api";
import { fetchInstitutionById } from "@/lib/api/institutions-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  getPresignedUrls, 
  uploadFileToGcp, 
  saveUserEventPhotos, 
  fetchUserEventPhotos,
  deleteUserEventPhoto
} from "@/lib/api/photos-api";

interface UserPhotosUploadFormProps {
  userId: string;
}

import { ImagePreviewCard } from "./image-preview-card";

interface FileWithPreview extends File {
  id: string; // Add unique ID
  preview: string;
  progress?: number; // Add progress property
}

export function UserPhotosUploadForm({ userId }: UserPhotosUploadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<{ [eventId: string]: FileWithPreview[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  
  useEffect(() => {
    return () => {
      Object.values(selectedFiles).forEach(files => {
        files.forEach(file => URL.revokeObjectURL(file.preview));
      });
    };
  }, [selectedFiles]);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  });

  const institutionId = user?.institutionId;

  const { data: institution, isLoading: isLoadingInstitution } = useQuery({
    queryKey: ["institution", institutionId],
    queryFn: () => fetchInstitutionById(institutionId!),
    enabled: !!institutionId,
  });

  const { data: existingPhotosData, isLoading: isLoadingExistingPhotos } = useQuery({
    queryKey: ["userExistingPhotos", userId],
    queryFn: () => fetchUserEventPhotos(userId),
    enabled: !!userId,
  });

  const deletePhotoMutation = useMutation({
    mutationFn: deleteUserEventPhoto,
    onMutate: (photoId) => {
      setDeletingPhotoId(photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userExistingPhotos", userId] });
      toast({
        title: "Foto excluída",
        description: "A foto foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error deleting photo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir foto",
        description: "Ocorreu um erro ao excluir a foto. Tente novamente.",
      });
    },
    onSettled: () => {
      setDeletingPhotoId(null);
    },
  });

  const handleDeleteExistingPhoto = (photoId: string) => {
    deletePhotoMutation.mutate(photoId);
  };

  const handleFileChange = (eventId: string, files: File[] | null) => {
    if (files) {
      const filesWithPreview = files.map(file => 
        Object.assign(file, {
          id: crypto.randomUUID(), // Generate unique ID
          preview: URL.createObjectURL(file)
        })
      );
      setSelectedFiles(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), ...filesWithPreview],
      }));
    }
  };

  const handleRemoveFile = (eventId: string, fileId: string) => {
    setSelectedFiles(prev => ({
      ...prev,
      [eventId]: prev[eventId]?.filter(file => file.id !== fileId) || [],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    toast({ title: "Iniciando upload...", description: "Por favor, aguarde." });

    try {
      for (const eventId in selectedFiles) {
        const files = selectedFiles[eventId];
        if (files.length === 0) continue;

        // 1. Get presigned URLs
        const presignedUrls = await getPresignedUrls(files);

        // 2. Upload files to GCP
        await Promise.all(
          presignedUrls.map((urlInfo, index) => {
            const file = files[index];
            return uploadFileToGcp(urlInfo.uploadUrl, file, (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setSelectedFiles(prev => ({
                ...prev,
                [eventId]: prev[eventId].map(f => 
                  f === file ? { ...f, progress } : f
                ),
              }));
            });
          })
        );

        // 3. Save file references to DB
        const fileNames = presignedUrls.map(url => url.filename);
        await saveUserEventPhotos({ userId, eventId, fileNames });

        // Invalidate existing photos query to refetch and display new photos
        queryClient.invalidateQueries({ queryKey: ["userExistingPhotos", userId] });

        // Clear selected files for this event
        setSelectedFiles(prev => {
          const newState = { ...prev };
          delete newState[eventId];
          return newState;
        });

        toast({ 
          title: `Sucesso no evento: ${institution?.events.find(e => e.id === eventId)?.name}`,
          description: `${files.length} fotos enviadas com sucesso.`
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({ 
        variant: "destructive",
        title: "Erro no Upload", 
        description: "Ocorreu um erro ao enviar as fotos. Tente novamente." 
      });
    }
 finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser || isLoadingInstitution || isLoadingExistingPhotos) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!institution?.events || institution.events.length === 0) {
    return <p>Nenhum evento encontrado para a instituição deste usuário.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos de {institution.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={institution.events[0].id}>
          <TabsList>
            {institution.events.map(event => (
              <TabsTrigger key={event.id} value={event.id}>
                {event.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {institution.events.map(event => {
            const existingPhotosForEvent = existingPhotosData?.eventGroups.find(group => group.eventId === event.id)?.photos || [];
            return (
            <TabsContent key={event.id} value={event.id}>
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione as fotos para o evento {event.name}.
                </p>
                
                
                {existingPhotosForEvent.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Fotos Existentes:</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {existingPhotosForEvent.map(photo => (
                        <ImagePreviewCard 
                          key={photo.id}
                          src={photo.signedUrl}
                          alt={photo.fileName}
                          onRemove={() => handleDeleteExistingPhoto(photo.id)}
                          isDeleting={deletingPhotoId === photo.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Novas Fotos:</h3>
                  <Dropzone 
                    onDrop={(acceptedFiles) => handleFileChange(event.id, acceptedFiles)}
                  />
                  {selectedFiles[event.id] && selectedFiles[event.id].length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {selectedFiles[event.id].map((file, index) => (
                        <ImagePreviewCard 
                          key={file.id} // Use unique ID as key
                          src={file.preview}
                          alt={file.name}
                          onRemove={() => handleRemoveFile(event.id, file.id)}
                          progress={file.progress}
                        />
                      ))}
                    </div>
                  )}
                  {selectedFiles[event.id] && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {selectedFiles[event.id]?.length} arquivo(s) selecionado(s).
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )
          })}
        </Tabs>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || Object.keys(selectedFiles).length === 0}
          >
            {isSubmitting ? "Enviando..." : "Enviar Fotos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
