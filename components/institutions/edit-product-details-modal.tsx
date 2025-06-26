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

const eventConfigurationSchema: z.ZodType<Partial<EventConfiguration>> = z.object({
    id: z.string(),
    minPhotos: z.coerce.number().optional(),
    valorPhoto: z.any().transform(v => parseCurrency(v)).optional(),
    valorPack: z.any().transform(v => parseCurrency(v)).optional(),
    date: z.string().optional(),
});

const genericDetailsSchema: z.ZodType<GenericDetails> = z.object({
  events: z.array(
    eventConfigurationSchema.refine(data => data.minPhotos && data.minPhotos > 0, { message: "Mínimo de 1 foto.", path: ["minPhotos"] })
                         .refine(data => data.valorPhoto && data.valorPhoto > 0, { message: "Valor obrigatório.", path: ["valorPhoto"]})
  ).default([]),
});

const digitalFilesDetailsSchema: z.ZodType<DigitalFilesDetails> = z.object({
  isAvailableUnit: z.boolean().default(false),
  valorPackTotal: z.any().transform(v => parseCurrency(v)).optional(),
  events: z.array(eventConfigurationSchema).default([]),
}).superRefine((data, ctx) => {
    if (!data.isAvailableUnit && (!data.valorPackTotal || data.valorPackTotal <= 0)) {
        ctx.addIssue({ code: 'custom', message: 'Valor do pacote completo é obrigatório.', path: ['valorPackTotal'] });
    }
    data.events.forEach((event, index) => {
        if(data.isAvailableUnit) {
            if(!event.minPhotos || event.minPhotos < 1) ctx.addIssue({ code: 'custom', message: 'Mínimo de 1 foto.', path: [`events.${index}.minPhotos`]});
            if(!event.valorPhoto || event.valorPhoto <= 0) ctx.addIssue({ code: 'custom', message: 'Valor obrigatório.', path: [`events.${index}.valorPhoto`]});
        } else {
            if(!event.valorPack || event.valorPack <= 0) ctx.addIssue({ code: 'custom', message: 'Valor obrigatório.', path: [`events.${index}.valorPack`]});
        }
    });
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
            if (product.flag === 'DIGITAL_FILES') {
                if (detailsPayload.events) {
                    detailsPayload.events = detailsPayload.events.map((event: any) => {
                        const cleanEvent: any = { id: event.id };
                        if (data.isAvailableUnit) {
                            cleanEvent.minPhotos = event.minPhotos;
                            cleanEvent.valorPhoto = event.valorPhoto;
                        } else {
                            cleanEvent.valorPack = event.valorPack;
                        }
                        return cleanEvent;
                    });
                }
                if(data.isAvailableUnit) delete detailsPayload.valorPackTotal;

            } else if (product.flag === 'GENERIC') {
                 if (detailsPayload.events) {
                    detailsPayload.events = detailsPayload.events.map((event: any) => ({
                        id: event.id,
                        minPhotos: event.minPhotos,
                        valorPhoto: event.valorPhoto,
                    }));
                }
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
            const initialValues: any = {
                minPhoto: details.minPhoto,
                maxPhoto: details.maxPhoto,
                valorEncadernacao: formatCurrency(details.valorEncadernacao),
                valorFoto: formatCurrency(details.valorFoto),
                isAvailableUnit: !!details.isAvailableUnit,
                valorPackTotal: formatCurrency(details.valorPackTotal),
                events: (details.events || []).map((evt: any) => ({
                    id: evt.id,
                    minPhotos: evt.minPhotos,
                    valorPhoto: formatCurrency(evt.valorPhoto),
                    valorPack: formatCurrency(evt.valorPack)
                }))
            };
            form.reset(initialValues);
        }
    }, [institutionProduct, form.reset]);
    
    if (!institutionProduct) return null;

    const { product } = institutionProduct;
    const isAvailableUnit = form.watch("isAvailableUnit");

    const handleEventToggle = (eventId: string, isChecked: boolean) => {
        const fieldIndex = fields.findIndex(field => field.id === eventId);
        
        if (isChecked) {
            if (fieldIndex === -1) {
                append({ id: eventId });
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
                                {/* --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA --- */}
                                {product.flag === 'DIGITAL_FILES' && !isAvailableUnit ? (
                                    <Controller name={`events.${fieldIndex}.valorPack`} control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor do Pacote</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={String(field.value || '')} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                                ) : (
                                    <>
                                        <FormField name={`events.${fieldIndex}.minPhotos`} control={form.control} render={({ field }) => <FormItem><FormLabel>Mín. Fotos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                                        <Controller name={`events.${fieldIndex}.valorPhoto`} control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor/Foto</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={String(field.value || '')} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                                    </>
                                )}
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
                return (
                    <div className="space-y-4">
                        <FormField name="isAvailableUnit" control={form.control} render={({ field }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Permitir venda separadamente?</FormLabel></div><FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
                        
                        {!isAvailableUnit && (
                             <Controller name="valorPackTotal" control={form.control} render={({ field, fieldState }) => <FormItem><FormLabel>Valor do Pacote Completo</FormLabel><FormControl><IMaskInput mask={Number} scale={2} thousandsSeparator="." padFractionalZeros radix="," placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onAccept={field.onChange} value={String(field.value || '')} /></FormControl><FormMessage>{fieldState.error?.message}</FormMessage></FormItem>} />
                        )}
                        
                        {renderEventList()}
                    </div>
                );
            default:
                return <p>Este produto não possui detalhes configuráveis.</p>
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Editar Detalhes de: {product.name}</DialogTitle>
                    <DialogDescription>Configure as opções específicas deste produto para a instituição selecionada.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(data => updateDetails(data))} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-4 -mx-4">
                            {renderFormFields()}
                        </div>
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