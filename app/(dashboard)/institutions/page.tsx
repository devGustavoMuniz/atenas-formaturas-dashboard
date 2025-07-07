import type { Metadata } from "next"
import { InstitutionsTable } from "@/components/institutions/institutions-table"

export const metadata: Metadata = {
  title: "Contratos",
  description: "Gerenciamento de contratos",
}

export default function InstitutionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold tracking-tight">Contratos</h2>
      <div className="space-y-4">
        <InstitutionsTable />
      </div>
    </div>
  )
}
