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
import { createUser, updateUser, fetchUserById, getPresignedUrl } from "@/lib/api/users-api"
import { fetchInstitutions } from "@/lib/api/institutions-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageCropper } from "@/components/users/image-cropper"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IMaskInput } from "react-imask"

// Função para converter o valor monetário formatado de volta para número
const parseCurrency = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === 'number') return value
  // Remove caracteres não numéricos, exceto a vírgula do decimal
  const stringValue = String(value).replace("R$", "").trim().replace(/\./g, "").replace(",", ".")
  const numberValue = parseFloat(stringValue)
  return isNaN(numberValue) ? undefined : numberValue
}

// Função para formatar um número para o padrão de moeda BRL para exibição inicial
const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return ""
    // Garante que o valor seja tratado como número
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numberValue)
}


const userFormSchema = z.object({
  institutionId: z.string({
    required_error: "Selecione uma instituição.",
  }),
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  identifier: z.string().min(1, {
    message: "Identificador é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phone: z.string().min(1, {
    message: "Telefone é obrigatório.",
  }),
  observations: z.string().optional(),
  password: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres.",
  }),
  role: z.enum(["admin", "client"], {
    required_error: "Selecione um cargo.",
  }),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  driveLink: z.string().optional(),
  creditValue: z.any().transform(v => parseCurrency(v)).optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormProps {
  userId?: string
}

const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  if (error?.response?.data?.errors) {
    if (Array.isArray(error.response.data.errors)) {
      return error.response.data.errors[0]?.message || error.response.data.errors[0]
    }
    return error.response.data.errors
  }
  if (error?.message) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Ocorreu um erro inesperado. Tente novamente."
}

function PasswordCriteria({ password }: { password: string }) {
  const criteria = [
    { label: "Pelo menos 6 caracteres", test: (pwd: string) => pwd.length >= 6 },
    { label: "Uma letra minúscula", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "Uma letra maiúscula", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "Um número", test: (pwd: string) => /[0-9]/.test(pwd) },
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

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!userId
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [institutionOpen, setInstitutionOpen] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [profileImageFilename, setProfileImageFilename] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")

  const steps = ["basic", "additional", "profile"]

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId!),
    enabled: isEditing,
  })

  const { data: institutions = [], isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["institutions"],
    queryFn: () => fetchInstitutions(),
  })

  const isLoading = isLoadingUser || isLoadingInstitutions

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      institutionId: "",
      name: "",
      identifier: "",
      email: "",
      phone: "",
      observations: "",
      password: "",
      role: "client",
      fatherName: "",
      fatherPhone: "",
      motherName: "",
      motherPhone: "",
      driveLink: "",
      creditValue: undefined,
    },
  })

  useEffect(() => {
    if (user && isEditing) {
      form.reset({
        ...user,
        observations: user.observations || "",
        password: "********",
        fatherName: user.fatherName || "",
        fatherPhone: user.fatherPhone || "",
        motherName: user.motherName || "",
        motherPhone: user.motherPhone || "",
        driveLink: user.driveLink || "",
        creditValue: user.creditValue,
      })
      setProfileImage(user.profileImage || null)
      setProfileImageFilename(user.profileImage || null)
      setPasswordValue("********")
    }
  }, [user, form, isEditing])

  const validatePasswordCriteria = (password: string): string | null => {
    if (!password || password === "") {
      return "Senha é obrigatória"
    }
    if (password === "********" && isEditing) {
      return null
    }
    if (password.length < 6) {
      return "Senha deve ter pelo menos 6 caracteres"
    }
    if (!/[a-z]/.test(password)) {
      return "Senha deve conter pelo menos uma letra minúscula"
    }
    if (!/[A-Z]/.test(password)) {
      return "Senha deve conter pelo menos uma letra maiúscula"
    }
    if (!/[0-9]/.test(password)) {
      return "Senha deve conter pelo menos um número"
    }
    return null
  }

  const cleanFormData = (data: Record<string, any>) => {
    const cleanedData = { ...data }

    Object.keys(cleanedData).forEach((key) => {
      if (
        cleanedData[key] === "" &&
        ["observations", "fatherName", "fatherPhone", "motherName", "motherPhone", "driveLink"].includes(key)
      ) {
        delete cleanedData[key]
      }
    })

    if (cleanedData.creditValue === undefined) {
      delete cleanedData.creditValue
    }

    if (cleanedData.password === "********") {
      delete cleanedData.password
    }

    return cleanedData
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      })
      router.push("/users")
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: errorMessage,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & Partial<any>) => {
      const { id, ...dataWithoutId } = data
      return updateUser(id, dataWithoutId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["user", userId] })
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
      })
      router.push("/users")
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: errorMessage,
      })
    },
  })

  const presignedUrlMutation = useMutation({
    mutationFn: async ({ contentType, formData }: { contentType: string; formData: UserFormValues }) => {
      const response = await getPresignedUrl({ contentType })
      return {
        presignedData: response,
        formData,
      }
    },
    onSuccess: async (result) => {
      const { presignedData, formData } = result

      if (profileImageFile && presignedData.urls[0].uploadUrl) {
        try {
          await fetch(presignedData.urls[0].uploadUrl, {
            method: "PUT",
            body: profileImageFile,
            headers: {
              "Content-Type": profileImageFile.type,
            },
          })

          setProfileImageFilename(presignedData.urls[0].filename)

          const cleanedData = cleanFormData(formData)

          if (isEditing) {
            updateMutation.mutate({
              id: userId!,
              ...cleanedData,
              profileImage: presignedData.urls[0].filename,
            })
          } else {
            createMutation.mutate({
              ...cleanedData,
              profileImage: presignedData.urls[0].filename,
            })
          }
        } catch (uploadError) {
          toast({
            variant: "destructive",
            title: "Erro ao fazer upload da imagem",
            description: "Não foi possível fazer o upload da imagem. Tente novamente.",
          })
        }
      }
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao obter URL para upload",
        description: errorMessage,
      })
    },
  })

  function onSubmit(data: UserFormValues) {
    const passwordError = validatePasswordCriteria(data.password)
    if (passwordError) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: passwordError,
      })
      return
    }

    const cleanedData = cleanFormData(data as Record<string, any>)

    if (profileImageFile) {
      presignedUrlMutation.mutate({
        contentType: profileImageFile.type,
        formData: data,
      })
    } else {
      if (isEditing) {
        updateMutation.mutate({
          id: userId!,
          ...cleanedData,
          profileImage: profileImageFilename,
        })
      } else {
        createMutation.mutate({
          ...cleanedData,
          profileImage: profileImageFilename,
        })
      }
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getInstitutionLabel = (id: string) => {
    const institution = institutions.find((inst) => inst.id === id)
    return institution ? `${institution.contractNumber} - ${institution.name}` : "Selecione uma instituição"
  }

  const handleImageCropped = (imageUrl: string | null, file: File | null) => {
    setProfileImage(imageUrl)
    setProfileImageFile(file)
  }

  if (isLoading) {
    return (
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
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Atualize as informações do usuário existente."
            : "Preencha as informações para criar um novo usuário."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={steps[currentStep]} className="w-full">
            <TabsList className="grid w-full grid-cols-3 pointer-events-none">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
              <TabsTrigger value="profile">Foto de Perfil</TabsTrigger>
            </TabsList>
          </Tabs>

          {currentStep === 0 && (
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="institutionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instituição</FormLabel>
                      <Popover open={institutionOpen} onOpenChange={setInstitutionOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={institutionOpen}
                              className="justify-between w-full h-10"
                              type="button"
                            >
                              {field.value ? getInstitutionLabel(field.value) : "Selecione uma instituição"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar instituição..." />
                            <CommandList>
                              <CommandEmpty>Nenhuma instituição encontrada.</CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-y-auto">
                                {institutions.map((institution) => (
                                  <CommandItem
                                    key={institution.id}
                                    value={`${institution.contractNumber} ${institution.name}`}
                                    onSelect={() => {
                                      form.setValue("institutionId", institution.id)
                                      setInstitutionOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === institution.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {institution.contractNumber} - {institution.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador</FormLabel>
                      <FormControl>
                        <Input placeholder="Identificador único" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <IMaskInput
                          mask="(00) 00000-0000"
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha {isEditing && "(deixe em branco para manter a atual)"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={isEditing ? "Nova senha (opcional)" : "******"}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              setPasswordValue(e.target.value)
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      {(!isEditing || (passwordValue && passwordValue !== "********")) && (
                        <PasswordCriteria password={passwordValue} />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="client">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre o usuário" className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end mt-4">
                <Button type="button" onClick={nextStep} className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Próximo
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 1 && (
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Pai</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do pai (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Pai</FormLabel>
                      <FormControl>
                        <IMaskInput
                          mask="(00) 00000-0000"
                          unmask={false}
                          value={field.value}
                          onAccept={(value) => field.onChange(value)}
                          placeholder="(00) 00000-0000 (opcional)"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Mãe</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da mãe (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone da Mãe</FormLabel>
                      <FormControl>
                        <IMaskInput
                          mask="(00) 00000-0000"
                          unmask={false}
                          value={field.value}
                          onAccept={(value) => field.onChange(value)}
                          placeholder="(00) 00000-0000 (opcional)"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driveLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do Drive</FormLabel>
                      <FormControl>
                        <Input placeholder="https://drive.google.com/... (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="creditValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Crédito</FormLabel>
                      <FormControl>
                        <IMaskInput
                          mask="R$ num"
                          blocks={{
                            num: {
                              mask: Number,
                              scale: 2,
                              thousandsSeparator: '.',
                              padFractionalZeros: true,
                              radix: ',',
                              lazy: false, // Garante que "R$" seja sempre exibido
                            },
                          }}
                          // O valor do formulário é uma string mascarada
                          value={String(field.value || '')}
                          // onAccept atualiza o formulário com o valor mascarado
                          onAccept={(_value, mask) => field.onChange(mask.value)}
                          placeholder="R$ 0,00 (opcional)"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Voltar
                </Button>
                <Button type="button" onClick={nextStep} className="bg-yellow-500 text-black hover:bg-yellow-400">
                  Próximo
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 2 && (
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt="Foto de perfil" />
                    <AvatarFallback>{form.getValues("name")?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Foto de perfil atual</p>
                </div>

                <ImageCropper
                  onImageCropped={handleImageCropped}
                  onCroppingChange={setIsCropping}
                />
              </div>

              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending || presignedUrlMutation.isPending || isCropping
                  }
                  className="bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  {createMutation.isPending || updateMutation.isPending || presignedUrlMutation.isPending
                    ? "Salvando..."
                    : isEditing
                      ? "Atualizar"
                      : "Cadastrar"}
                </Button>
              </div>
            </CardContent>
          )}
        </form>
      </Form>
    </Card>
  )
}