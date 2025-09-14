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
import { useAuthStore } from "@/lib/store/auth-store"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { getAddressByCEP } from "@/lib/api/cep-api"
import { createPaymentPreference } from "@/lib/api/mercado-pago-api";
import { createOrder, CreateOrderPayload } from "@/lib/api/orders-api";
import { fetchUserById } from "@/lib/api/users-api";
import { Loader2 } from "lucide-react"
import { IMaskInput } from "react-imask"

const addressFormSchema = z.object({
  zipCode: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "UF inválida"),
  phone: z.string().refine(phone => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  }, "Telefone inválido (inclua o DDD)"),
})

type AddressFormValues = z.infer<typeof addressFormSchema>

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const { user } = useAuthStore()
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
      phone: "",
    },
  })

  const zipCodeValue = form.watch("zipCode")

  // Auto-fill user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const fullUserData = await fetchUserById(user.id)
          
          // Set phone if available
          if (fullUserData.phone) {
            form.setValue("phone", fullUserData.phone)
          }
          
          // Set address fields if available
          if (fullUserData.address) {
            if (fullUserData.address.zipCode) form.setValue("zipCode", fullUserData.address.zipCode)
            if (fullUserData.address.street) form.setValue("street", fullUserData.address.street)
            if (fullUserData.address.number) form.setValue("number", fullUserData.address.number)
            if (fullUserData.address.complement) form.setValue("complement", fullUserData.address.complement)
            if (fullUserData.address.neighborhood) form.setValue("neighborhood", fullUserData.address.neighborhood)
            if (fullUserData.address.city) form.setValue("city", fullUserData.address.city)
            if (fullUserData.address.state) form.setValue("state", fullUserData.address.state)
          }
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error)
        }
      }
    }

    loadUserData()
  }, [user?.id, form])

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

  const [isCreatingPreference, setIsCreatingPreference] = useState(false)

  const onSubmit = async (data: AddressFormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para continuar.");
      return;
    }

    setIsCreatingPreference(true);

    const nameParts = user.name.split(' ');
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');

    const cleanedPhone = data.phone.replace(/\D/g, '');
    const areaCode = cleanedPhone.substring(0, 2);
    const phoneNumber = cleanedPhone.substring(2);

    const orderPayload: CreateOrderPayload = {
      cartItems: items.map(item => {
        let productType: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM';
        if (item.product.flag === 'GENERIC') {
          productType = 'GENERIC';
        } else if (item.product.flag === 'DIGITAL_FILES') {
          productType = 'DIGITAL_FILES';
        } else if (item.product.flag === 'ALBUM') {
          productType = 'ALBUM';
        } else {
          // Fallback ou tratamento de erro para tipos desconhecidos
          productType = 'GENERIC';
        }

        let selectionDetails: any = {};
        if (item.selection.type === 'GENERIC' || item.selection.type === 'DIGITAL_FILES_UNIT') {
          selectionDetails.photos = Object.entries(item.selection.selectedPhotos).flatMap(([eventId, photoIds]) =>
            photoIds.map(photoId => ({
              id: photoId,
              eventId: eventId,
            }))
          );
        } else if (item.selection.type === 'DIGITAL_FILES_PACKAGE') {
          selectionDetails.events = item.selection.selectedEvents.map(event => ({
            id: event,
            isPackage: true,
          }));
          selectionDetails.isFullPackage = item.selection.isPackageComplete;
        } else if (item.selection.type === 'ALBUM') {
          selectionDetails.albumPhotos = item.selection.selectedPhotos;
        }

        return {
          productId: item.product.id,
          productName: item.product.name,
          productType: productType,
          totalPrice: item.totalPrice,
          selectionDetails: selectionDetails,
        };
      }),
      shippingDetails: {
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      },
      payer: {
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        phone: {
          areaCode: areaCode,
          number: phoneNumber,
        },
      },
    };

    try {
      // 1. Criar o pedido no backend
      const { orderId, mercadoPagoCheckoutUrl } = await createOrder(orderPayload);

      // 2. Criar a preferência de pagamento com o ID do pedido (Mercado Pago)
      // O backend agora é responsável por criar a preferência de pagamento e retornar a URL
      // Não precisamos mais construir o payload do Mercado Pago aqui, apenas usar o que o backend retornou.

      // 3. Limpar o carrinho e redirecionar para o Mercado Pago
      clearCart();
      window.location.href = mercadoPagoCheckoutUrl;

    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast.error(`Erro ao finalizar compra: ${errorMessage}`);
      setIsCreatingPreference(false);
    }
  };

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
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>Telefone com DDD</FormLabel>
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
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.selection.type === 'ALBUM' && `${item.selection.selectedPhotos.length} fotos`}
                        {item.selection.type === 'GENERIC' && `${Object.values(item.selection.selectedPhotos).flat().length} fotos`}
                        {item.selection.type === 'DIGITAL_FILES_UNIT' && `${Object.values(item.selection.selectedPhotos).flat().length} fotos`}
                        {item.selection.type === 'DIGITAL_FILES_PACKAGE' && (item.selection.isPackageComplete ? 'Pacote Completo' : `${item.selection.selectedEvents.length} evento(s)`)}
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
                disabled={items.length === 0 || isCreatingPreference}
              >
                {isCreatingPreference ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar e Pagar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
