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
const parseCurrency = (value: string | number | undefined): number | undefined => {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value === 'number') return value;
    
    let stringValue = String(value).replace("R$", "").trim();
    
    // Se contém vírgula, assume formato brasileiro (1.234,56)
    if (stringValue.includes(",")) {
        // Remove pontos (separadores de milhares) e substitui vírgula por ponto (decimal)
        stringValue = stringValue.replace(/\./g, "").replace(",", ".");
    }
    // Se não contém vírgula, pode ser formato americano (1234.56) ou número inteiro
    // Neste caso, mantém como está
    
    const numberValue = parseFloat(stringValue);
    return isNaN(numberValue) ? undefined : numberValue;
};

const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "";
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
    }).format(numberValue);
};


// --- ZOD SCHEMAS ---
const albumDetailsSchema = z.object({
  minPhoto: z.coerce.number().min(1, "Mínimo de 1 foto."),
  maxPhoto: z.coerce.number().min(1, "Mínimo de 1 foto."),
  valorEncadernacao: z.any().transform(v => parseCurrency(v)).refine(v => v !== undefined && v >= 0, "Valor é obrigatório."),
  valorFoto: z.any().transform(v => parseCurrency(v)).refine(v => v !== undefined && v >= 0, "Valor é obrigatório."),
});

const eventConfigurationSchema = z.object({
    id: z.string(),
    minPhotos: z.coerce.number().optional(),
    maxPhotos: z.coerce.number().optional(),
    valorPhoto: z.any().transform(v => parseCurrency(v)).optional(),
    valorPack: z.any().transform(v => parseCurrency(v)).optional(),
    date: z.string().optional(),
});

const genericDetailsSchema = z.object({
  events: z.array(
    eventConfigurationSchema.refine(data => data.minPhotos && data.minPhotos > 0, { message: "Mínimo de 1 foto.", path: ["minPhotos"] })
                         .refine(data => data.valorPhoto !== undefined && data.valorPhoto >= 0, { message: "Valor obrigatório.", path: ["valorPhoto"]})
  ).default([]),
});

const digitalFilesDetailsSchema = z.object({
  isAvailableUnit: z.boolean(),
  valorPackTotal: z.any().transform(v => parseCurrency(v)).optional(),
  events: z.array(
    eventConfigurationSchema.refine(data => {
        // Se isAvailableUnit for true, validar minPhotos e valorPhoto
        // Se for false (modo pacote), validar valorPack
        return true; // Validação condicional será feita no refine abaixo
    })
  ).default([]),
}).superRefine((data, ctx) => {
  data.events.forEach((event, index) => {
    if (data.isAvailableUnit) {
      // Modo individual: exigir minPhotos e valorPhoto
      if (!event.minPhotos || event.minPhotos <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo de 1 foto.",
          path: ["events", index, "minPhotos"],
        });
      }
      if (event.valorPhoto === undefined || event.valorPhoto < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor obrigatório.",
          path: ["events", index, "valorPhoto"],
        });
      }
    } else {
      // Modo pacote: exigir valorPack
      if (event.valorPack === undefined || event.valorPack < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valor do pacote obrigatório.",
          path: ["events", index, "valorPack"],
        });
      }
    }
  });

  // Se modo pacote e valorPackTotal não informado
  if (!data.isAvailableUnit && (data.valorPackTotal === undefined || data.valorPackTotal < 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valor do pacote completo obrigatório.",
      path: ["valorPackTotal"],
    });
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

    const form = useForm<any>({
        resolver: institutionProduct ? zodResolver(getDetailsSchema(institutionProduct.product.flag)) : undefined,
        defaultValues: {},
    });

    const { control, handleSubmit, watch, reset } = form;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "events" as any,
        keyName: "key",
    });
    // aaaa

    const { mutate: updateDetails, isPending } = useMutation({
        mutationFn: (data: any) => {
            if (!institutionProduct) return Promise.reject("Produto não selecionado");

            const detailsPayload = { ...data };
            if (product.flag === 'DIGITAL_FILES') {
                if (detailsPayload.events) {
                    detailsPayload.events = detailsPayload.events.map((event: any) => {
                        if (detailsPayload.isAvailableUnit) {
                            // Modo individual: enviar minPhotos e valorPhoto
                            return {
                                id: event.id,
                                minPhotos: event.minPhotos,
                                valorPhoto: event.valorPhoto,
                            };
                        } else {
                            // Modo pacote: enviar valorPack
                            return {
                                id: event.id,
                                valorPack: event.valorPack,
                            };
                        }
                    });
                }
            } else if (product.flag === 'GENERIC') {
                 if (detailsPayload.events) {
                    detailsPayload.events = detailsPayload.events.map((event: any) => ({
                        id: event.id,
                        minPhotos: event.minPhotos,
                        maxPhotos: event.maxPhotos,
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
                isAvailableUnit: details.isAvailableUnit ?? true,
                valorPackTotal: formatCurrency(details.valorPackTotal),
                events: (details.events || []).map((evt: any) => ({
                    id: evt.id,
                    minPhotos: evt.minPhotos,
                    maxPhotos: evt.maxPhotos,
                    valorPhoto: formatCurrency(evt.valorPhoto),
                    valorPack: formatCurrency(evt.valorPack),
                }))
            };
            reset(initialValues);
        }
    }, [institutionProduct, reset]);
    
    if (!institutionProduct) return null;

    const { product } = institutionProduct;

    const handleEventToggle = (eventId: string, isChecked: boolean) => {
        const fieldIndex = fields.findIndex((field: any) => field.id === eventId);

        if (isChecked) {
            if (fieldIndex === -1) {
                append({ id: eventId } as any);
            }
        } else {
            if (fieldIndex > -1) {
                remove(fieldIndex);
            }
        }
    }
    
    const renderEventList = (isDigitalFiles = false) => {
        const isAvailableUnit = watch("isAvailableUnit");

        return (
            <div className="space-y-4">
                <h4 className="font-medium">Selecione e Configure os Eventos</h4>
                {institutionEvents.map(event => {
                    const fieldIndex = fields.findIndex((field: any) => field.id === event.id);
                    const isEnabled = fieldIndex > -1;

                    return (
                        <div key={event.id} className="p-4 border rounded-md space-y-3 transition-all">
                            <div className="flex flex-row items-center space-x-3">
                                <Checkbox id={`event-checkbox-${event.id}`} checked={isEnabled} onCheckedChange={(checked) => handleEventToggle(event.id, !!checked)} />
                                <label htmlFor={`event-checkbox-${event.id}`} className="font-medium cursor-pointer">{event.name}</label>
                            </div>
                            {isEnabled && (
                                <div className="grid grid-cols-3 gap-4 pl-8">
                                    {isDigitalFiles && !isAvailableUnit ? (
                                        // Modo pacote: mostrar apenas valorPack
                                        <FormField name={`events.${fieldIndex}.valorPack`} control={control} render={({ field }) => <FormItem className="col-span-3"><FormLabel>Valor do Pacote</FormLabel><FormControl><IMaskInput mask="R$ num" blocks={{ num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', lazy: false }}} value={String(field.value || '')} onAccept={(value) => field.onChange(value)} placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></FormControl><FormMessage /></FormItem>} />
                                    ) : (
                                        // Modo individual: mostrar minPhotos, maxPhotos e valorPhoto
                                        <>
                                            <FormField name={`events.${fieldIndex}.minPhotos`} control={control} render={({ field }) => <FormItem><FormLabel>Mín. Fotos</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
                                            <FormField name={`events.${fieldIndex}.maxPhotos`} control={control} render={({ field }) => <FormItem><FormLabel>Máx. Fotos</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
                                            <FormField name={`events.${fieldIndex}.valorPhoto`} control={control} render={({ field }) => <FormItem><FormLabel>Valor/Foto</FormLabel><FormControl><IMaskInput mask="R$ num" blocks={{ num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', lazy: false }}} value={String(field.value || '')} onAccept={(value) => field.onChange(value)} placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></FormControl><FormMessage /></FormItem>} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderFormFields = () => {
        switch (product.flag) {
            case "ALBUM":
                 return (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="minPhoto" control={control} render={({ field }) => <FormItem><FormLabel>Mínimo de fotos</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
                        <FormField name="maxPhoto" control={control} render={({ field }) => <FormItem><FormLabel>Máximo de fotos</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
                        <FormField name="valorEncadernacao" control={control} render={({ field }) => <FormItem><FormLabel>Valor da Encadernação</FormLabel><FormControl><IMaskInput mask="R$ num" blocks={{ num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', lazy: false }}} value={String(field.value || '')} onAccept={(value) => field.onChange(value)} placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></FormControl><FormMessage /></FormItem>} />
                        <FormField name="valorFoto" control={control} render={({ field }) => <FormItem><FormLabel>Valor por Foto</FormLabel><FormControl><IMaskInput mask="R$ num" blocks={{ num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', lazy: false }}} value={String(field.value || '')} onAccept={(value) => field.onChange(value)} placeholder="R$ 0,00" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></FormControl><FormMessage /></FormItem>} />
                    </div>
                );
            case "GENERIC":
                return renderEventList();
            case "DIGITAL_FILES":
                const isAvailableUnit = watch("isAvailableUnit");
                return (
                    <div className="space-y-6">
                        <FormField
                            name="isAvailableUnit"
                            control={control}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Permitir venda separadamente?</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Se ativado, permite a compra de fotos individuais por evento. Se desativado, permite apenas a compra de pacotes completos.
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {!isAvailableUnit && (
                            <FormField
                                name="valorPackTotal"
                                control={control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor do Pacote Completo</FormLabel>
                                        <FormControl>
                                            <IMaskInput
                                                mask="R$ num"
                                                blocks={{ num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', lazy: false }}}
                                                value={String(field.value || '')}
                                                onAccept={(value) => field.onChange(value)}
                                                placeholder="R$ 0,00"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {renderEventList(true)}
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
                    <DialogDescription>Configure as opções específicas deste produto para o contrato selecionado.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={handleSubmit(data => updateDetails(data))} className="flex-1 flex flex-col min-h-0">
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