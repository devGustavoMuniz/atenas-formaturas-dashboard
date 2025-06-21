"use client"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { updateInstitutionProductDetails } from "@/lib/api/institution-products-api"
import type { InstitutionProduct } from "@/lib/api/institution-products-api"
import { Switch } from "../ui/switch"
import { Checkbox } from "../ui/checkbox"
import { useEffect } from "react"
import { IMaskInput } from "react-imask"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { AlbumDetails, EventConfiguration, GenericDetails, DigitalFilesDetails } from "@/lib/product-details-types"

// --- UTILS ---
const parseCurrency = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    return Number(String(value).replace(/\./g, "").replace(",", "."));
}

const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "";
    return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(value);
}

// --- ZOD SCHEMAS ---
const albumDetailsSchema: z.ZodType<AlbumDetails> = z.object({
  minPhoto: z.coerce.number().min(1, "Mínimo de 1 foto."),
  maxPhoto: z.coerce.number().min(1, "Mínimo de 1 foto."),
  valorEncadernacao: z.any().transform(v => parseCurrency(v)).refine(v => v > 0, "Valor é obrigatório."),
  valorFoto: z.any().transform(v => parseCurrency(v)).refine(v => v > 0, "Valor é obrigatório."),
});

const eventConfigurationSchema: z.ZodType<EventConfiguration> = z.object({
    id: z.string(),
    minPhotos: z.coerce.number({invalid_type_error: "Obrigatório"}).min(1, "Mínimo de 1 foto."),
    valorPhoto: z.any().transform(v => parseCurrency(v)).refine(v => v > 0, "Valor é obrigatório."),
    date: z.string().optional(),
});

const genericDetailsSchema: z.ZodType<GenericDetails> = z.object({
  events: z.array(eventConfigurationSchema).default([]),
});

const digitalFilesDetailsSchema: z.ZodType<DigitalFilesDetails> = z.object({
  isAvailableUnit: z.boolean().default(false),
  valorTotal: z.any().transform(v => parseCurrency(v)).optional(),
  events: z.array(eventConfigurationSchema).default([]),
}).superRefine((data, ctx) => {
    if (!data.isAvailableUnit && (!data.valorTotal || data.valorTotal <= 0)) {
        ctx.addIssue({ code: 'custom', message: 'Valor do pacote é obrigatório.', path: ['valorTotal'] });
    }
});

const getDetailsSchema = (flag: string) => {
    switch(flag) {
        case 'ALBUM': return albumDetailsSchema;
        case 'GENERIC': return genericDetailsSchema;
        case 'DIGITAL_FILES': return digitalFilesDetailsSchema;
        default: return z.object({});
    }
}

// --- COMPONENT ---
interface EditProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  institutionProduct: InstitutionProduct | null
  institutionEvents: { id: string; name: string }[]
}

export function EditProductDetailsModal({ isOpen, onClose, institutionProduct, institutionEvents }: EditProductDetailsModalProps) {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const form = useForm({
        resolver: institutionProduct ? zodResolver(getDetailsSchema(institutionProduct.product.flag)) : undefined,
        defaultValues: {},
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "events",
        keyName: "key",
    });

    const { mutate: updateDetails, isPending } = useMutation({
        mutationFn: (data: any) => {
            if (!institutionProduct) return Promise.reject("Produto não selecionado");
            const detailsPayload = { ...data };
            if (institutionProduct.product.flag === 'DIGITAL_FILES') {
                if(detailsPayload.isAvailableUnit) delete detailsPayload.valorTotal;
                else delete detailsPayload.events;
            }
            return updateInstitutionProductDetails(institutionProduct.id, detailsPayload);
        },
        onSuccess: () => {
            toast({ title: "Detalhes atualizados com sucesso!" })
            queryClient.invalidateQueries({ queryKey: ['institutionProducts', institutionProduct?.institution.id] })
            onClose()
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message })
        },
    });

    useEffect(() => {
        if (institutionProduct) {
            const details = institutionProduct.details || {};
            const formattedDetails = {
                ...details,
                valorEncadernacao: formatCurrency(details.valorEncadernacao),
                valorFoto: formatCurrency(details.valorFoto),
                valorTotal: formatCurrency(details.valorTotal),
                events: (details.events || []).map((evt: any) => ({
                    ...evt,
                    valorPhoto: formatCurrency(evt.valorPhoto)
                }))
            }
            form.reset(formattedDetails);
        }
    }, [institutionProduct, form]);
    
    if (!institutionProduct) return null;

    const { product } = institutionProduct;

    const handleEventToggle = (eventId: string, isChecked: boolean) => {
        const fieldIndex = fields.findIndex(field => field.id === eventId);
        
        if (isChecked) {
            if (fieldIndex === -1) {
                append({ id: eventId, minPhotos: 1, valorPhoto: "0,00" });
            }
        } else {
            if (fieldIndex > -1) {
                remove(fieldIndex);
            }
        }
    }
    
    const renderEventList = () => (
        <div className="space-y-4">
            <h4 className="font-medium">Selecione e Configure os Eventos</h4>
            {institutionEvents.map(event => {
                const fieldIndex = fields.findIndex(field => field.id === event.id);
                const isEnabled = fieldIndex > -1;

                return (
                    <div key={event.id} className="p-4 border rounded-md space-y-3 transition-all">
                        <div className="flex flex-row items-center space-x-3">
                            <Checkbox id={`event-checkbox-${event.id}`} checked={isEnabled} onCheckedChange={(checked) => handleEventToggle(event.id, !!checked)} />
                            <label htmlFor={`event-checkbox-${event.id}`} className="font-medium cursor-pointer">{event.name}</label>
                        </div>
                        {isEnabled && (
                            <div className="grid grid-cols-2 gap-4 pl-8">
                                <FormField name={`events.${fieldIndex}.minPhotos`} control={form.control} render={({ field }) => <FormItem><FormLabel>Mín. Fotos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <Controller name={`events.${fieldIndex}.valorPhoto`} control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor/Foto</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={String(field.value || '')} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderFormFields = () => {
        switch (product.flag) {
            case "ALBUM":
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="minPhoto" control={form.control} render={({ field }) => <FormItem><FormLabel>Mínimo de fotos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField name="maxPhoto" control={form.control} render={({ field }) => <FormItem><FormLabel>Máximo de fotos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <Controller name="valorEncadernacao" control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor da Encadernação</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={field.value || ""} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                        <Controller name="valorFoto" control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor por Foto Extra</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={field.value || ""} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                    </div>
                );
            case "GENERIC":
                return renderEventList();
            case "DIGITAL_FILES":
                const isAvailableUnit = form.watch("isAvailableUnit");
                return (
                    <div className="space-y-4">
                        <FormField name="isAvailableUnit" control={form.control} render={({ field }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Permitir venda separadamente?</FormLabel></div><FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
                        {isAvailableUnit 
                            ? renderEventList() 
                            : <Controller name="valorTotal" control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor do Pacote Completo</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={String(field.value || '')} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                        }
                    </div>
                );
            default:
                return <p>Este produto não possui detalhes configuráveis.</p>
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* --- ALTERAÇÕES NA ESTRUTURA DO MODAL --- */}
            <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Editar Detalhes de: {product.name}</DialogTitle>
                    <DialogDescription>Configure as opções específicas deste produto para a instituição selecionada.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    {/* A tag <form> agora envolve a área de scroll e o rodapé */}
                    <form onSubmit={form.handleSubmit(data => updateDetails(data))} className="flex-1 flex flex-col min-h-0">
                        {/* Esta div é a área de conteúdo que terá o scroll */}
                        <div className="flex-1 overflow-y-auto p-4 -mx-4">
                            {renderFormFields()}
                        </div>

                        {/* O rodapé agora é uma parte fixa no final do flex container */}
                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={isPending} className="bg-yellow-500 text-black hover:bg-yellow-400">
                                {isPending ? "Salvando..." : "Salvar Detalhes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}