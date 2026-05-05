import { UserPhotosUploadForm } from "@/components/users/user-photos-upload-form";
import { notFound } from "next/navigation";

interface UserPhotosUploadPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserPhotosUploadPage({ params }: UserPhotosUploadPageProps) {
  const { id: userId } = await params;

  if (!userId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Upload de Fotos do Usuário</h1>
        <p className="text-sm text-muted-foreground">
          Selecione o evento e envie as fotos correspondentes.
        </p>
      </div>
      <UserPhotosUploadForm userId={userId} />
    </div>
  );
}
