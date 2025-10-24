"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  forgotPassword,
  resetPassword,
} from "@/lib/api/auth-api"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
})

const resetPasswordSchema = z.object({
  code: z.string().min(1, { message: "O código é obrigatório." }),
  newPassword: z
    .string()
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
})

export function ForgotPasswordForm() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [isCodeFieldReady, setIsCodeFieldReady] = useState(false)
  const router = useRouter()

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
    },
  })

  useEffect(() => {
    if (step === 2) {
      // Limpa os campos quando muda para step 2
      setIsCodeFieldReady(false)
      resetPasswordForm.setValue("code", "")
      resetPasswordForm.setValue("newPassword", "")

      // Habilita o campo após um pequeno delay para prevenir autofill
      const timer = setTimeout(() => {
        setIsCodeFieldReady(true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [step, resetPasswordForm])

  const onForgotPasswordSubmit = async (
    values: z.infer<typeof forgotPasswordSchema>,
  ) => {
    try {
      await forgotPassword(values)
      toast.success("Um código de verificação foi enviado para o seu e-mail.")
      setEmail(values.email)
      resetPasswordForm.reset()
      setStep(2)
    } catch (error) {
      toast.error("Falha ao enviar o e-mail. Verifique o e-mail e tente novamente.")
    }
  }

  const onResetPasswordSubmit = async (
    values: z.infer<typeof resetPasswordSchema>,
  ) => {
    try {
      const response = await resetPassword({ email, ...values })
      if (response.success) {
        toast.success(response.message)
        router.push("/login")
      } else {
        toast.error(response.message || "Ocorreu um erro ao redefinir a senha.")
      }
    } catch (error) {
      toast.error("Código inválido ou expirado. Tente novamente.")
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      {step === 1 ? (
        <>
          <CardHeader>
            <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um código de redefinição de senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...forgotPasswordForm}>
              <form
                onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
                className="space-y-4"
                autoComplete="off"
              >
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          {...field}
                          type="email"
                          autoComplete="email"
                          disabled={forgotPasswordForm.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordForm.formState.isSubmitting}
                >
                  {forgotPasswordForm.formState.isSubmitting
                    ? "Enviando..."
                    : "Enviar código"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Digite o código enviado para {email} e sua nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...resetPasswordForm}>
              <form
                onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
                className="space-y-4"
                autoComplete="off"
                key="reset-password-form"
              >
                <FormField
                  control={resetPasswordForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Verificação</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456"
                          {...field}
                          type="text"
                          autoComplete="off"
                          name="verification-code"
                          readOnly={!isCodeFieldReady}
                          onFocus={(e) => {
                            if (!isCodeFieldReady) {
                              e.target.readOnly = false
                              setIsCodeFieldReady(true)
                            }
                          }}
                          disabled={resetPasswordForm.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                          autoComplete="new-password"
                          disabled={resetPasswordForm.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetPasswordForm.formState.isSubmitting}
                >
                  {resetPasswordForm.formState.isSubmitting
                    ? "Redefinindo..."
                    : "Redefinir Senha"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </>
      )}
    </Card>
  )
}
