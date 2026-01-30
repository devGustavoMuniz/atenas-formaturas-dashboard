"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, EyeOff, Loader2, User, MapPin, Lock, Camera } from "lucide-react"
import { IMaskInput } from "react-imask"
import { getAddressByCEP } from "@/lib/api/cep-api"
import { useAuth } from "@/lib/auth/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { updateProfile, type ProfileUpdateInput } from "@/lib/api/profile-api"
import { getPresignedUrl, fetchUserById } from "@/lib/api/users-api"

const profileFormSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Email inválido.",
    }),
    phone: z.string().min(1, {
        message: "Telefone é obrigatório.",
    }),
    // Address fields - todos opcionais seguindo o padrão do user-form
    zipCode: z.string().optional().or(z.literal("")).refine(
        (val) => !val || val.length === 0 || (val.length >= 8 && val.length <= 9),
        { message: "CEP inválido" }
    ),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional().or(z.literal("")).refine(
        (val) => !val || val.length === 0 || val.length === 2,
        { message: "UF inválida" }
    ),
})

const passwordFormSchema = z.object({
    newPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PasswordFormValues = z.infer<typeof passwordFormSchema>

const getErrorMessage = (error: unknown): string => {
    const err = error as { response?: { data?: { message?: string; error?: string; errors?: string[] | string } }; message?: string }
    if (err?.response?.data?.message) {
        return err.response.data.message
    }
    if (err?.response?.data?.error) {
        return err.response.data.error
    }
    if (err?.response?.data?.errors) {
        if (Array.isArray(err.response.data.errors)) {
            return err.response.data.errors[0] || "Erro desconhecido"
        }
        return err.response.data.errors
    }
    if (err?.message) {
        return err.message
    }
    return "Ocorreu um erro inesperado. Tente novamente."
}

// Helper function to check if a field is effectively empty (considering masks)
const isFieldEmpty = (value: string | undefined | null): boolean => {
    if (value === undefined || value === null || value === "") {
        return true
    }
    // For strings, remove common mask characters and check if empty
    const cleanValue = value.replace(/[\s.\-()_/]/g, "")
    return cleanValue === ""
}

function PasswordCriteria({ password }: { password: string }) {
    const criteria = [
        { label: "Pelo menos 6 caracteres", test: (pwd: string) => pwd.length >= 6 },
    ]

    return (
        <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">A senha deve conter:</p>
            {criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${criterion.test(password) ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className={criterion.test(password) ? "text-green-600" : "text-muted-foreground"}>
                        {criterion.label}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function ProfileForm() {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const { user, isLoading: isLoadingUser, updateUser } = useAuth()

    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
    const [isFetchingCep, setIsFetchingCep] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [newPasswordValue, setNewPasswordValue] = useState("")

    // Image cropper state
    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const [originalFile, setOriginalFile] = useState<File | null>(null)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const originalUserDataRef = useRef<ProfileFormValues | null>(null)

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            zipCode: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
        },
    })

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    })

    const zipCodeValue = profileForm.watch("zipCode")

    useEffect(() => {
        const fetchAddress = async () => {
            const cep = zipCodeValue?.replace(/\D/g, "") || ""
            if (cep.length === 8) {
                setIsFetchingCep(true)
                try {
                    const address = await getAddressByCEP(cep)
                    if (address) {
                        profileForm.setValue("street", address.logradouro)
                        profileForm.setValue("neighborhood", address.bairro)
                        profileForm.setValue("city", address.localidade)
                        profileForm.setValue("state", address.uf)
                        profileForm.setFocus("number")
                    } else {
                        toast({
                            variant: "destructive",
                            title: "CEP não encontrado",
                        })
                    }
                } catch {
                    toast({
                        variant: "destructive",
                        title: "Falha ao buscar CEP",
                    })
                } finally {
                    setIsFetchingCep(false)
                }
            }
        }
        fetchAddress()
    }, [zipCodeValue, profileForm, toast])

    useEffect(() => {
        if (user) {
            const initialData: ProfileFormValues = {
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                zipCode: user.address?.zipCode || "",
                street: user.address?.street || "",
                number: user.address?.number || "",
                complement: user.address?.complement || "",
                neighborhood: user.address?.neighborhood || "",
                city: user.address?.city || "",
                state: user.address?.state || "",
            }
            profileForm.reset(initialData)
            originalUserDataRef.current = initialData
            setProfileImage(user.profileImage || null)
        }
    }, [user, profileForm])

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            setOriginalFile(file)

            const reader = new FileReader()
            reader.addEventListener("load", () => {
                setImageSrc(reader.result?.toString() || "")
                setCropDialogOpen(true)
            })
            reader.readAsDataURL(file)
        }
    }

    // Generate cropped image
    const generateCrop = useCallback(async () => {
        if (!completedCrop || !imgRef.current || !originalFile) return

        const canvas = document.createElement("canvas")
        const image = imgRef.current
        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height

        canvas.width = completedCrop.width * scaleX
        canvas.height = completedCrop.height * scaleY

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        )

        canvas.toBlob((blob) => {
            if (!blob) return

            const croppedFile = new File([blob], originalFile.name, { type: originalFile.type })
            const croppedImageUrl = URL.createObjectURL(blob)
            setProfileImage(croppedImageUrl)
            setProfileImageFile(croppedFile)

            // Clean up
            setCropDialogOpen(false)
            setImageSrc(null)
            setCrop(undefined)
            setCompletedCrop(undefined)
        }, originalFile.type)
    }, [completedCrop, originalFile])

    const cancelCrop = () => {
        setCropDialogOpen(false)
        setImageSrc(null)
        setOriginalFile(null)
        setCrop(undefined)
        setCompletedCrop(undefined)
    }

    // Get only the fields that have changed compared to original data
    const getChangedFields = (data: ProfileFormValues): ProfileUpdateInput => {
        const original = originalUserDataRef.current
        const changedData: ProfileUpdateInput = {}

        // Check basic fields
        if (data.name !== original?.name) {
            changedData.name = data.name
        }
        if (data.email !== original?.email) {
            changedData.email = data.email
        }
        if (data.phone !== original?.phone) {
            changedData.phone = data.phone
        }

        // Check address fields
        const addressFields = ["zipCode", "street", "number", "complement", "neighborhood", "city", "state"] as const
        const hasAddressChanges = addressFields.some(
            (field) => data[field] !== original?.[field]
        )

        if (hasAddressChanges) {
            // Check if any address field has value
            const hasAnyAddressValue = addressFields.some((field) => !isFieldEmpty(data[field]))

            if (hasAnyAddressValue) {
                changedData.address = {
                    zipCode: data.zipCode || "",
                    street: data.street || "",
                    number: data.number || "",
                    complement: data.complement || undefined,
                    neighborhood: data.neighborhood || "",
                    city: data.city || "",
                    state: data.state || "",
                }
            } else {
                changedData.address = null
            }
        }

        return changedData
    }

    // Mutation for uploading image and updating profile
    const updateProfileMutation = useMutation({
        mutationFn: async ({ data, imageFile }: { data: ProfileUpdateInput; imageFile: File | null }) => {
            let finalData = { ...data }

            // If there's an image to upload, get presigned URL first
            if (imageFile) {
                try {
                    const presignedData = await getPresignedUrl({
                        contentType: imageFile.type,
                        customIdentifier: imageFile.name,
                    })

                    // Upload to presigned URL
                    await fetch(presignedData.urls[0].uploadUrl, {
                        method: "PUT",
                        body: imageFile,
                        headers: {
                            "Content-Type": imageFile.type,
                        },
                    })

                    finalData.profileImage = presignedData.urls[0].filename
                } catch {
                    throw new Error("Erro ao fazer upload da imagem")
                }
            }

            return updateProfile(finalData)
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ["user"] })
            setProfileImageFile(null)

            // Buscar dados atualizados do usuário para garantir que temos a URL completa da imagem
            if (user?.id) {
                try {
                    const freshUser = await fetchUserById(user.id)
                    // Update original data ref with current form values
                    originalUserDataRef.current = profileForm.getValues()
                    updateUser(freshUser)
                } catch (error) {
                    console.error("Erro ao buscar dados atualizados do usuário", error)
                }
            }

            toast({
                title: "Perfil atualizado",
                description: "Suas informações foram atualizadas com sucesso.",
            })
        },
        onError: (error) => {
            const errorMessage = getErrorMessage(error)
            toast({
                variant: "destructive",
                title: "Erro ao atualizar perfil",
                description: errorMessage,
            })
        },
    })

    // Mutation for updating password
    const updatePasswordMutation = useMutation({
        mutationFn: async (data: PasswordFormValues) => {
            return updateProfile({ password: data.newPassword })
        },
        onSuccess: () => {
            toast({
                title: "Senha atualizada",
                description: "Sua senha foi alterada com sucesso.",
            })
            passwordForm.reset()
            setNewPasswordValue("")
        },
        onError: (error) => {
            const errorMessage = getErrorMessage(error)
            toast({
                variant: "destructive",
                title: "Erro ao alterar senha",
                description: errorMessage,
            })
        },
    })

    function onProfileSubmit(data: ProfileFormValues) {
        const changedData = getChangedFields(data)

        // Check if there are any changes (including image)
        const hasChanges = Object.keys(changedData).length > 0 || profileImageFile !== null

        if (!hasChanges) {
            toast({
                title: "Nenhuma alteração",
                description: "Nenhum campo foi modificado.",
            })
            return
        }

        updateProfileMutation.mutate({ data: changedData, imageFile: profileImageFile })
    }

    function onPasswordSubmit(data: PasswordFormValues) {
        updatePasswordMutation.mutate(data)
    }

    if (isLoadingUser) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[300px]" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Image Crop Dialog */}
            <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Recortar Imagem</DialogTitle>
                    </DialogHeader>
                    {imageSrc && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="border rounded-md p-2 overflow-hidden max-h-[400px]">
                                <ReactCrop
                                    crop={crop}
                                    onChange={c => setCrop(c)}
                                    onComplete={c => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Recortar"
                                        src={imageSrc}
                                        style={{ maxHeight: '350px' }}
                                    />
                                </ReactCrop>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button variant="outline" onClick={cancelCrop}>
                            Cancelar
                        </Button>
                        <Button onClick={generateCrop} className="bg-yellow-500 text-black hover:bg-yellow-400">
                            Aplicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header com Avatar */}
            <Card className="overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600" />
                <CardContent className="relative pt-0 pb-6">
                    <div className="flex flex-col items-center gap-3 -mt-12">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src={profileImage || user?.profileImage || ""} alt={user?.name || "Usuário"} />
                                <AvatarFallback className="text-2xl bg-yellow-100 text-yellow-700">
                                    {user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{user?.name || "Usuário"}</h2>
                            <p className="text-muted-foreground">{user?.email}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Contrato: <span className="font-medium">{user?.userContract || "-"}</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs de Edição */}
            <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="personal" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Pessoal</span>
                    </TabsTrigger>
                    <TabsTrigger value="address" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="hidden sm:inline">Endereço</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Segurança</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Informações Pessoais */}
                <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>
                                Atualize suas informações pessoais e de contato.
                            </CardDescription>
                        </CardHeader>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome completo</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Seu nome" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="email@exemplo.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2 lg:col-span-1">
                                                    <FormLabel>Telefone</FormLabel>
                                                    <FormControl>
                                                        <IMaskInput
                                                            mask={["(00) 0000-0000", "(00) 00000-0000"]}
                                                            unmask={false}
                                                            value={field.value}
                                                            onAccept={(value) => field.onChange(value)}
                                                            placeholder="(00) 00000-0000"
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-6">
                                    <Button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="bg-yellow-500 text-black hover:bg-yellow-400"
                                    >
                                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar Alterações
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                </TabsContent>

                {/* Tab: Endereço */}
                <TabsContent value="address">
                    <Card>
                        <CardHeader>
                            <CardTitle>Endereço</CardTitle>
                            <CardDescription>
                                Atualize seu endereço para entregas.
                            </CardDescription>
                        </CardHeader>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="zipCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CEP</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <IMaskInput
                                                                mask="00000-000"
                                                                unmask={false}
                                                                value={field.value}
                                                                onAccept={(value) => field.onChange(value)}
                                                                placeholder="00000-000"
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            />
                                                            {isFetchingCep && (
                                                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="state"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Estado</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="UF" maxLength={2} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cidade</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Cidade" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="neighborhood"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bairro</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Bairro" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="street"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Rua</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Rua / Avenida" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Número</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Número" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="complement"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Complemento</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Apto, Bloco, etc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-6">
                                    <Button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="bg-yellow-500 text-black hover:bg-yellow-400"
                                    >
                                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar Endereço
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                </TabsContent>

                {/* Tab: Segurança */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alterar Senha</CardTitle>
                            <CardDescription>
                                Atualize sua senha para manter sua conta segura.
                            </CardDescription>
                        </CardHeader>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nova Senha</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showNewPassword ? "text" : "password"}
                                                            placeholder="Digite sua nova senha"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e)
                                                                setNewPasswordValue(e.target.value)
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                {newPasswordValue && <PasswordCriteria password={newPasswordValue} />}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirmar Nova Senha</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="Confirme sua nova senha"
                                                            {...field}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end border-t pt-6">
                                    <Button
                                        type="submit"
                                        disabled={updatePasswordMutation.isPending}
                                        className="bg-yellow-500 text-black hover:bg-yellow-400"
                                    >
                                        {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Alterar Senha
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
