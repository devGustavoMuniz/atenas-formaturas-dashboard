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
      id: z.string().optional(),
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
      const mappedEvents = institution.events && institution.events.length > 0
        ? institution.events.map((event) => ({
          id: event.id, // ✅ IMPORTANTE: Preservar ID para eventos existentes
          name: event.name
        }))
        : [{ name: "" }]

      console.log('🔍 [DEBUG] Resetando form com eventos:', mappedEvents)
      console.log('🔍 [DEBUG] Eventos originais do backend:', institution.events)

      form.reset({
        contractNumber: institution.contractNumber,
        name: institution.name,
        observations: institution.observations,
        events: mappedEvents,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution, isEditing])

  const createMutation = useMutation({
    mutationFn: (data: Omit<InstitutionFormValues, "id" | "createdAt" | "userCount">) => {
      return createInstitution(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] })
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso.",
      })
      router.push("/institutions")
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao criar contrato",
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
        title: "Contrato atualizado",
        description: "O contrato foi atualizado com sucesso.",
      })
      router.push("/institutions")
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar contrato",
        description: errorMessage,
      })
    },
  })

  function onSubmit(data: InstitutionFormValues) {
    console.log('📤 [DEBUG] Enviando dados ao backend:', data)
    console.log('📤 [DEBUG] Eventos a serem enviados:', data.events)

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
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardDescription>
            {isEditing
              ? "Atualize as informações do contrato existente."
              : "Preencha as informações para criar um novo contrato."}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <FormControl>
                            <Input placeholder="Nome do evento" {...field} className="w-full" />
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
          <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
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