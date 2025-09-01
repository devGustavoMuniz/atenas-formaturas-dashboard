'use client'

import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Pagamento Aprovado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Obrigado pela sua compra! Seu pedido foi recebido e está sendo processado. Você receberá atualizações por e-mail.
          </p>
          <Button asChild className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
            <Link href="/client/dashboard">Voltar para a Loja</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
