import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { RecentUsers } from "@/components/dashboard/recent-users"
import { DashboardCards } from "@/components/dashboard/dashboard-cards"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard overview",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="space-y-4">
        <DashboardCards />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>Atividade do mês atual comparada ao mês anterior</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Usuários Recentes</CardTitle>
              <CardDescription>Últimos usuários cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentUsers />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
