'use client'

import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentFailurePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl">Falha no Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Houve um problema ao processar seu pagamento. Por favor, verifique os dados e tente novamente ou entre em contato com o suporte.
          </p>
          <Button asChild className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
            <Link href="/checkout">Tentar Novamente</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
