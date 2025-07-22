'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { fetchUserEventPhotos } from '@/lib/api/photos-api';
import { EventGroup } from '@/lib/api/photos-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ImagePreviewCard } from "@/components/users/image-preview-card";
import { cn } from "@/lib/utils";


export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPhotos = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const data = await fetchUserEventPhotos(user.id);
          setEventGroups(data.eventGroups);
        } catch (err) {
          console.error('Failed to fetch user photos:', err);
          setError('Failed to load photos. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    loadPhotos();
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="p-4">Please log in to view your photos.</div>;
  }

  if (eventGroups.length === 0) {
    return <div className="p-4">No photos found for your events.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Suas Fotos de Eventos</h1>
      {eventGroups.map((group) => (
        <Card key={group.eventId} className="mb-6">
          <CardHeader>
            <CardTitle>{group.eventName}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {group.photos.map((photo) => (
              <ImagePreviewCard 
                key={photo.id}
                src={photo.signedUrl}
                alt={photo.fileName}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
