"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createInstitution, updateInstitution, fetchInstitutionById } from "@/lib/api/institutions-api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, X, Settings } from "lucide-react"

// O Zod schema já espera o formato correto: um array de objetos com a propriedade 'name'
const institutionFormSchema = z.object({
  contractNumber: z.string().min(1, {
    message: "Número do contrato é obrigatório.",
  }),
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  observations: z.string().optional(),
  events: z.array(
    z.object({
      name: z.string().min(1, { message: "Nome do evento é obrigatório." }),
    }),
  ),
})

type InstitutionFormValues = z.infer<typeof institutionFormSchema>

interface InstitutionFormProps {
  institutionId?: string
}

const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return "Ocorreu um erro inesperado. Tente novamente."
}

export function InstitutionForm({ institutionId }: InstitutionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!institutionId

  const { data: institution, isLoading } = useQuery({
    queryKey: ["institution", institutionId],
    queryFn: () => fetchInstitutionById(institutionId!),
    enabled: isEditing,
  })

  const form = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionFormSchema),
    defaultValues: {
      contractNumber: "",
      name: "",
      observations: "",
      events: [{ name: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "events",
  })

  useEffect(() => {
    if (institution && isEditing) {
      form.reset({
        contractNumber: institution.contractNumber,
        name: institution.name,
        observations: institution.observations,
        // --- CORREÇÃO AQUI ---
        // Agora, o `institution.events` é um array de objetos {id, name}.
        // O .map garante que estamos passando para o formulário o formato que ele espera,
        // que é um array de objetos com a propriedade 'name'.
        // Adicionamos uma verificação para garantir que events exista e tenha itens.
        events: institution.events && institution.events.length > 0
          ? institution.events.map((event) => ({ name: event.name }))
          : [{ name: "" }], // Se não houver eventos, começa com um campo vazio
      })
    }
  }, [institution, form, isEditing])

  const createMutation = useMutation({
    mutationFn: (data: Omit<InstitutionFormValues, "id" | "createdAt" | "userCount">) => {
      return createInstitution(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
      toast({
        title: "Instituição criada",
        description: "A instituição foi criada com sucesso.",
      })
      router.push("/institutions")
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao criar instituição",
        description: errorMessage,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & InstitutionFormValues) => {
      const { id, ...dataWithoutId } = data
      return updateInstitution(id, dataWithoutId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
      queryClient.invalidateQueries({ queryKey: ["institution", institutionId] })
      toast({
        title: "Instituição atualizada",
        description: "A instituição foi atualizada com sucesso.",
      })
      router.push("/institutions")
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar instituição",
        description: errorMessage,
      })
    },
  })

  function onSubmit(data: InstitutionFormValues) {
    if (isEditing) {
      updateMutation.mutate({
        id: institutionId!,
        ...data,
      })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading && isEditing) {
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>{isEditing ? "Editar Instituição" : "Nova Instituição"}</CardTitle>
            <CardDescription>
            {isEditing
                ? "Atualize as informações da instituição existente."
                : "Preencha as informações para criar uma nova instituição."}
            </CardDescription>
        </div>
        {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/institutions/${institutionId}/products`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurar Produtos
            </Button>
          )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="contractNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Contrato</FormLabel>
                  <FormControl>
                    <Input placeholder="CONT-0000" {...field} />
                  </FormControl>
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
                    <Input placeholder="Nome da instituição" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre a instituição" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Eventos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => append({ name: "" })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Evento</span>
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`events.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder="Nome do evento" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/institutions")}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-yellow-500 text-black hover:bg-yellow-400"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}