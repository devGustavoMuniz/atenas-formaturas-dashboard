
"use client"

import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CheckoutPendingPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Pagamento Pendente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Seu pagamento está pendente de processamento. Assim que for
            aprovado, você receberá uma notificação.
          </p>
          <Button onClick={() => router.push('/client/dashboard')}>
            Voltar para o Início
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
