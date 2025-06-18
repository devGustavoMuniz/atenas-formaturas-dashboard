"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2 } from "lucide-react"
import { fetchInstitutionById } from "@/lib/api/institutions-api"
import { fetchInstitutionProducts, unlinkProductFromInstitution } from "@/lib/api/institution-products-api"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { LinkProductModal } from "./link-product-modal"
import { ProductFlag } from "@/lib/utils"

export function ConfiguredProductsList({ institutionId }: { institutionId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: institution, isLoading: isLoadingInstitution } = useQuery({
    queryKey: ['institution', institutionId],
    queryFn: () => fetchInstitutionById(institutionId),
  })

  const { data: configuredProducts, isLoading: isLoadingConfigured } = useQuery({
    queryKey: ['institutionProducts', institutionId],
    queryFn: () => fetchInstitutionProducts(institutionId),
  })

  const { mutate: unlinkProduct, isPending: isUnlinking } = useMutation({
    mutationFn: (institutionProductId: string) => unlinkProductFromInstitution(institutionProductId),
    onSuccess: () => {
      toast({ title: "Produto desvinculado com sucesso!" })
      queryClient.invalidateQueries({ queryKey: ['institutionProducts', institutionId] })
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao desvincular", description: error.message })
    },
  })

  const isLoading = isLoadingInstitution || isLoadingConfigured
  const linkedProductIds = new Set(configuredProducts?.map(p => p.product.id) || [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produtos Vinculados</CardTitle>
            <CardDescription>
              Gerencie os produtos disponíveis para: <span className="font-semibold text-foreground">{institution?.name || "..."}</span>
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Vincular Produto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="w-[120px] text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : configuredProducts && configuredProducts.length > 0 ? (
                  configuredProducts.map(({ id, product }) => (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                            {/* A Badge agora usa a propriedade 'flag' */}
                            <Badge variant="outline">{ProductFlag[product.flag]}</Badge> 
                        </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isUnlinking}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá desvincular o produto "{product.name}" desta instituição.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => unlinkProduct(id)} className="bg-destructive hover:bg-destructive/90">
                                Desvincular
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center">Nenhum produto vinculado. Clique em "Vincular Produto" para começar.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.push(`/institutions`)}>Voltar</Button>
        </CardFooter>
      </Card>
      
      {/* O Modal é renderizado aqui */}
      <LinkProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        institutionId={institutionId}
        alreadyLinkedProductIds={linkedProductIds}
      />
    </>
  )
}