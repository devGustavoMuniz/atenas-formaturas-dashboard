"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { Eye, EyeOff, Loader2, KeyRound, PartyPopper } from "lucide-react"
import { updateProfile } from "@/lib/api/profile-api"

const passwordFormSchema = z.object({
    newPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
    confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
})

type PasswordFormValues = z.infer<typeof passwordFormSchema>

interface FirstAccessModalProps {
    open: boolean
    onClose: () => void
    userName?: string
}

function PasswordCriteria({ password }: { password: string }) {
    const criteria = [
        { label: "Pelo menos 6 caracteres", test: (pwd: string) => pwd.length >= 6 },
    ]

    return (
        <div className="mt-2 space-y-1">
            <p className="text-xs text-muted-foreground">A senha deve conter:</p>
            {criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${criterion.test(password) ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className={criterion.test(password) ? "text-green-600" : "text-muted-foreground"}>
                        {criterion.label}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function FirstAccessModal({ open, onClose, userName }: FirstAccessModalProps) {
    const { toast } = useToast()
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [newPasswordValue, setNewPasswordValue] = useState("")

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    })

    const updatePasswordMutation = useMutation({
        mutationFn: async (data: PasswordFormValues) => {
            return updateProfile({ password: data.newPassword })
        },
        onSuccess: () => {
            toast({
                title: "Senha alterada com sucesso!",
                description: "Sua nova senha foi salva. Bem-vindo(a) à plataforma!",
            })
            form.reset()
            setNewPasswordValue("")
            localStorage.setItem("tutorialPending", "true")
            onClose()
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Erro ao alterar senha",
                description: "Não foi possível alterar a senha. Tente novamente.",
            })
        },
    })

    function onSubmit(data: PasswordFormValues) {
        updatePasswordMutation.mutate(data)
    }

    function handleSkip() {
        toast({
            title: "Senha mantida",
            description: "Você pode alterar sua senha a qualquer momento no seu perfil.",
        })
        localStorage.setItem("tutorialPending", "true")
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                        <PartyPopper className="h-8 w-8 text-yellow-600" />
                    </div>
                    <DialogTitle className="text-2xl">
                        Bem-vindo(a){userName ? `, ${userName.split(" ")[0]}` : ""}!
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Este é seu primeiro acesso à plataforma. Deseja alterar a senha que foi enviada por email?
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nova Senha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="Digite sua nova senha"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    setNewPasswordValue(e.target.value)
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    {newPasswordValue && <PasswordCriteria password={newPasswordValue} />}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Nova Senha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirme sua nova senha"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="flex-col gap-2 sm:flex-col">
                            <Button
                                type="submit"
                                disabled={updatePasswordMutation.isPending}
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
                            >
                                {updatePasswordMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <KeyRound className="mr-2 h-4 w-4" />
                                )}
                                Alterar Senha
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={handleSkip}
                                disabled={updatePasswordMutation.isPending}
                            >
                                Manter senha atual
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
