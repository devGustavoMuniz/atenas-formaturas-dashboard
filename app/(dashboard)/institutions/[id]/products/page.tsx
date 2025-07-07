import { ConfiguredProductsList } from "@/components/institutions/configured-products-list"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configurar Produtos do Contrato",
  description: "Configure quais produtos estão disponíveis para um contrato específico.",
}

export default function InstitutionProductsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      {/* O componente filho cuidará de buscar os dados do contrato */}
      <ConfiguredProductsList institutionId={params.id} />
    </div>
  )
}
