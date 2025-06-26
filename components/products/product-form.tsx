"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createProduct, updateProduct, fetchProductById, getPresignedUrlsForProduct } from "@/lib/api/products-api"
import { api as axiosApi } from "@/lib/api/axios-config"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/lib/types"
import { MediaUploader, type FilePreview } from "./media-uploader"
import { Progress } from "../ui/progress"

const productFormSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    flag: z.enum(["ALBUM", "GENERIC", "DIGITAL_FILES"], {
        required_error: "Selecione uma flag.",
    }),
    description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres." }),
    photos: z.array(z.string()).default([]),
    video: z.array(z.string()).default([]),
})

type ProductFormValues = z.infer<typeof productFormSchema>

export function ProductForm({ productId }: { productId?: string }) {
    const router = useRouter()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const isEditing = !!productId

    const [stagedPhotos, setStagedPhotos] = useState<FilePreview[]>([])
    const [stagedVideos, setStagedVideos] = useState<FilePreview[]>([])
    const [uploadProgress, setUploadProgress] = useState<number | null>(null)

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", productId],
        queryFn: () => fetchProductById(productId!),
        enabled: isEditing,
    })

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { name: "", description: "", flag: "GENERIC", photos: [], video: [] },
    })

    useEffect(() => {
        if (product && isEditing) {
            form.reset(product)
        }
    }, [product, form, isEditing])

    const mutation = useMutation({
        mutationFn: (data: ProductFormValues) => {
            // --- ALTERAÇÃO AQUI ---
            if (isEditing) {
                // Remove a propriedade 'flag' do objeto de dados antes de enviar para a atualização
                const { flag, ...dataToUpdate } = data;
                return updateProduct(productId!, dataToUpdate);
            }
            // A operação de criação continua enviando a 'flag' normalmente
            return createProduct(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast({ title: isEditing ? "Produto atualizado" : "Produto criado", description: `O produto foi salvo com sucesso.` })
            router.push("/products")
        },
        onError: (error) => {
            toast({ variant: "destructive", title: `Erro ao salvar produto`, description: error.message })
        },
        onSettled: () => {
            setUploadProgress(null);
        }
    })

    const handleMediaFilesChange = (photos: FilePreview[], videos: FilePreview[]) => {
        setStagedPhotos(photos);
        setStagedVideos(videos);
    }

    const handleExistingMediaChange = (photos: string[], videos: string[]) => {
        form.setValue('photos', photos, { shouldDirty: true });
        form.setValue('video', videos, { shouldDirty: true });
    }

    async function onSubmit(data: ProductFormValues) {
        const totalPhotos = (data.photos?.length || 0) + stagedPhotos.length;
        if (totalPhotos < 1) {
            toast({
                variant: "destructive",
                title: "Fotos insuficientes",
                description: "É necessário ter pelo menos 1 foto no produto.",
            });
            return;
        }

        const filesToUpload = [...stagedPhotos, ...stagedVideos];
        let newPhotoUrls: string[] = [];
        let newVideoUrls: string[] = [];
    
        if (filesToUpload.length > 0) {
            setUploadProgress(0);
            try {
                const groupedFiles = filesToUpload.reduce<Record<string, File[]>>((acc, filePreview) => {
                    const key = filePreview.file.type;
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(filePreview.file);
                    return acc;
                }, {});
    
                const presignedUrlRequests = Object.entries(groupedFiles).map(([contentType, files]) => ({
                    contentType,
                    quantity: files.length,
                    mediaType: contentType.startsWith('image/') ? 'image' : 'video' as 'image' | 'video',
                }));
    
                const presignedUrlResponses = await getPresignedUrlsForProduct(presignedUrlRequests);
                
                let uploadedCount = 0;
                let urlIndex = 0;
    
                for (const contentType in groupedFiles) {
                    const files = groupedFiles[contentType];
                    for (const file of files) {
                        if (urlIndex >= presignedUrlResponses.length) {
                            throw new Error("Mismatch between number of files and presigned URLs received.");
                        }
                        
                        const { uploadUrl, filename } = presignedUrlResponses[urlIndex++];
                        
                        await axiosApi.put(uploadUrl, file, {
                            headers: { 'Content-Type': file.type },
                            onUploadProgress: (progressEvent) => {
                               const individualProgress = progressEvent.total ? (progressEvent.loaded / progressEvent.total) : 0;
                               const overallProgress = ((uploadedCount + individualProgress) / filesToUpload.length) * 100;
                               setUploadProgress(overallProgress);
                            }
                        });
                        
                        uploadedCount++;
                        
                        if(file.type.startsWith('image/')) {
                            newPhotoUrls.push(filename);
                        } else {
                            newVideoUrls.push(filename);
                        }
                    }
                }
    
            } catch (error: any) {
                toast({ variant: "destructive", title: "Erro no Upload", description: error.message || "Não foi possível enviar as mídias." });
                setUploadProgress(null);
                return;
            }
        }
    
        const finalData = {
            ...data,
            photos: [...(data.photos || []), ...newPhotoUrls],
            video: [...(data.video || []), ...newVideoUrls],
        };
    
        mutation.mutate(finalData);
    }    

    if (isLoading && isEditing) {
        return <Card><CardHeader><Skeleton className="h-8 w-full" /><Skeleton className="h-4 w-full" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
    }
    if (isError) {
        return <Card><CardHeader><CardTitle>Erro</CardTitle><CardDescription>Não foi possível carregar os dados.</CardDescription></CardHeader></Card>
    }

    const isSubmitting = mutation.isPending;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</CardTitle>
                <CardDescription>{isEditing ? "Atualize as informações." : "Preencha as informações para criar."}</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input placeholder="Ex: Álbum de Luxo" {...field} /></FormControl><FormMessage /></FormItem>} />
                        
                        <FormField
                          control={form.control}
                          name="flag"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma flag" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ALBUM">Álbum</SelectItem>
                                  <SelectItem value="GENERIC">Produto com seleção de fotos</SelectItem>
                                  <SelectItem value="DIGITAL_FILES">Arquivos Digitais</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o produto..." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <div className="space-y-2">
                            <FormLabel>Fotos e Vídeos</FormLabel>
                            <MediaUploader
                                onNewFilesChange={handleMediaFilesChange}
                                onExistingMediaChange={handleExistingMediaChange}
                                existingPhotos={form.watch('photos') || []}
                                existingVideos={form.watch('video') || []}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="w-full sm:w-1/2">
                            {isSubmitting && uploadProgress !== null && (
                                <div className="flex items-center gap-2">
                                    <Progress value={uploadProgress} className="w-full" />
                                    <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" type="button" onClick={() => router.push("/products")} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-yellow-500 text-black hover:bg-yellow-400 w-full sm:w-auto">
                                {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}