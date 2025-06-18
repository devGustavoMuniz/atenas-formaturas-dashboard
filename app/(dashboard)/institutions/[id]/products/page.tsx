import type { Metadata } from "next"
import { ConfiguredProductsList } from "@/components/institutions/configured-products-list"

export const metadata: Metadata = {
  title: "Configurar Produtos da Instituição",
  description: "Configure quais produtos estão disponíveis para uma instituição específica.",
}

export default function ConfigureInstitutionProductsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      {/* O componente filho cuidará de buscar os dados da instituição */}
      <ConfiguredProductsList institutionId={params.id} />
    </div>
  )
}