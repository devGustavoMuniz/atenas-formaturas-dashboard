"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Wallet } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function CreditConfirmedContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { clearCart } = useCartStore()

    // Obter parâmetros da URL
    const contractNumber = searchParams.get('contractNumber') || ''
    const creditUsed = parseFloat(searchParams.get('creditUsed') || '0')
    const remainingCredit = parseFloat(searchParams.get('remainingCredit') || '0')
    const paymentMethod = searchParams.get('paymentMethod') || 'CREDIT'

    // Limpa o carrinho uma vez que o pedido foi confirmado
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
                    <CardTitle className="mt-4 text-2xl">Pedido Confirmado!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Seu pedido foi processado com sucesso{paymentMethod === 'FREE' ? '.' : ' utilizando seu crédito disponível.'}
                    </p>

                    {contractNumber && (
                        <div className="rounded-md border bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground">Número do Pedido</p>
                            <p className="font-mono font-semibold">{contractNumber}</p>
                        </div>
                    )}

                    {paymentMethod === 'CREDIT' && creditUsed > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3 rounded-md border bg-green-50 p-4 dark:bg-green-950/20">
                                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                                    <Wallet className="h-5 w-5" />
                                    <p className="font-semibold">Crédito Utilizado</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Crédito usado:</span>
                                        <span className="font-semibold text-green-700 dark:text-green-400">
                                            {formatCurrency(creditUsed)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Saldo restante:</span>
                                        <span className="font-semibold">
                                            {formatCurrency(remainingCredit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {paymentMethod === 'FREE' && (
                        <>
                            <Separator />
                            <div className="rounded-md border bg-blue-50 p-4 dark:bg-blue-950/20">
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    🎉 Este pedido não teve custo!
                                </p>
                            </div>
                        </>
                    )}

                    <Separator />

                    <p className="text-sm text-muted-foreground">
                        Você receberá uma confirmação no seu e-mail com os detalhes do pedido.
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        <Button onClick={() => router.push('/client/orders')}>
                            Ver Meus Pedidos
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/client/dashboard')}>
                            Voltar para o Início
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function CheckoutCreditConfirmedPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                        <Skeleton className="mt-4 h-8 w-48 mx-auto" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        }>
            <CreditConfirmedContent />
        </Suspense>
    )
}
