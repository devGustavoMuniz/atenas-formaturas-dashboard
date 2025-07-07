"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchProducts } from "@/lib/api/products-api"
import { linkProductToInstitution } from "@/lib/api/institution-products-api"
import { ProductFlag } from "@/lib/utils"

interface LinkProductModalProps {
  isOpen: boolean
  onClose: () => void
  institutionId: string
  alreadyLinkedProductIds: Set<string>
}

export function LinkProductModal({ isOpen, onClose, institutionId, alreadyLinkedProductIds }: LinkProductModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Busca todos os produtos para listar no modal
  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
  })

  const { mutate: linkProduct, isPending } = useMutation({
    mutationFn: (productId: string) => linkProductToInstitution({ institutionId, productId }),
    onSuccess: () => {
      toast({ title: "Produto vinculado com sucesso!" })
      queryClient.invalidateQueries({ queryKey: ['institutionProducts', institutionId] })
      onClose() // Fecha o modal após o sucesso
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao vincular produto", description: error.message })
    },
  })
  
  // Filtra para mostrar apenas produtos que ainda não foram vinculados
  const availableProducts = allProducts?.filter(p => !alreadyLinkedProductIds.has(p.id)) || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular Novo Produto</DialogTitle>
          <DialogDescription>
            Selecione um produto da lista abaixo para vincular a este contrato.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : availableProducts.length > 0 ? (
                  availableProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{ProductFlag[product.flag]}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => linkProduct(product.id)}
                          disabled={isPending}
                        >
                          Vincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-center">Todos os produtos já estão vinculados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}