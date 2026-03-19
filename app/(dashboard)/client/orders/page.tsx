"use client"

import { Suspense } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientOrdersPageContent } from "./client-orders-page-content"

function OrdersPageSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    )
}

export default function ClientOrdersPage() {
    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Meus Pedidos</CardTitle>
                    <CardDescription>
                        Acompanhe o status e histórico dos seus pedidos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<OrdersPageSkeleton />}>
                        <ClientOrdersPageContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
