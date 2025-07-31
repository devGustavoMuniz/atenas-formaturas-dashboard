"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/lib/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { getAddressByCEP } from "@/lib/api/cep-api"
import { Loader2 } from "lucide-react"

const addressFormSchema = z.object({
  zipCode: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "UF inválida"),
})

type AddressFormValues = z.infer<typeof addressFormSchema>

export default function CheckoutPage() {
  const { items } = useCartStore()
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0)
  const total = subtotal // TODO: Adicionar lógica de frete

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  })

  const zipCodeValue = form.watch("zipCode")

  useEffect(() => {
    const fetchAddress = async () => {
      const cep = zipCodeValue.replace(/\D/g, "")
      if (cep.length === 8) {
        setIsFetchingCep(true)
        try {
          const address = await getAddressByCEP(cep)
          if (address) {
            form.setValue("street", address.logradouro)
            form.setValue("neighborhood", address.bairro)
            form.setValue("city", address.localidade)
            form.setValue("state", address.uf)
            form.setFocus("number")
          } else {
            toast.error("CEP não encontrado.")
          }
        } catch (error) {
          toast.error("Falha ao buscar CEP.")
        } finally {
          setIsFetchingCep(false)
        }
      }
    }
    fetchAddress()
  }, [zipCodeValue, form])

  const onSubmit = (data: AddressFormValues) => {
    console.log("Dados do Endereço:", data)
    console.log("Itens do Carrinho:", items)
    toast.success("Pedido realizado com sucesso! (Simulação)")
    // Aqui viria a lógica para enviar o pedido para o backend
    // clearCart() // Opcional: limpar o carrinho após o sucesso
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="00000-000" {...field} />
                            {isFetchingCep && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado (UF)</FormLabel>
                          <FormControl>
                            <Input maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length > 0 ? (
                items.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type === 'ALBUM' && item.selectedPhotos ? `${item.selectedPhotos.length} fotos` :
                         item.type === 'DIGITAL_FILES' && !item.isAvailableUnit && item.selectedEvents ? `${item.selectedEvents.length} evento(s)` :
                         item.selectedPhotos ? `${item.selectedPhotos.length} foto(s)` : ''}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Seu carrinho está vazio.</p>
              )}
              <Separator />
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>{formatCurrency(subtotal)}</p>
              </div>
              <div className="flex justify-between">
                <p>Frete</p>
                <p>Grátis</p>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <p>Total</p>
                <p>{formatCurrency(total)}</p>
              </div>
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                className="w-full mt-4"
                disabled={items.length === 0}
              >
                Confirmar e Pagar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
