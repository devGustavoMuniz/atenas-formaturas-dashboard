import { ConfiguredProductsList } from "@/components/institutions/configured-products-list"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configurar Produtos do Contrato",
  description: "Configure quais produtos estão disponíveis para um contrato específico.",
}

type InstitutionProductsPageProps = {
  params: Promise<{ id: string }>
}

export default async function InstitutionProductsPage({ params }: InstitutionProductsPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      {/* O componente filho cuidará de buscar os dados do contrato */}
      <ConfiguredProductsList institutionId={id} />
    </div>
  )
}
