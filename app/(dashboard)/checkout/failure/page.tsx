
"use client"

import { useRouter } from 'next/navigation'
import { XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CheckoutFailurePage() {
  const router = useRouter()

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Falha no Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Não foi possível processar seu pagamento. Por favor, tente novamente
            ou utilize outra forma de pagamento.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/checkout')}>
              Tentar Novamente
            </Button>
            <Button onClick={() => router.push('/client/dashboard')}>
              Voltar para o Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
