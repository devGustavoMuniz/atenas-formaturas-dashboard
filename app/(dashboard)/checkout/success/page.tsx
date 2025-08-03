
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const { clearCart } = useCartStore()

  // Limpa o carrinho uma vez que o pagamento foi bem-sucedido
  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Pagamento Aprovado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Seu pagamento foi processado com sucesso. Em breve você receberá uma
            confirmação no seu e-mail com os detalhes do pedido.
          </p>
          <Button onClick={() => router.push('/client/dashboard')}>
            Voltar para o Início
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
