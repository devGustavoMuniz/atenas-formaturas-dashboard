"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from 'next/link'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth/use-auth"

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

// Função para extrair mensagem de erro da resposta da API
const getErrorMessage = (error: any): string => {

  // Verificar diferentes estruturas de erro
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Credenciais inválidas. Tente novamente."
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorAlert, setErrorAlert] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setErrorAlert(null) // Limpa erro anterior

    try {
      const user = await login(data.email, data.password)
      if (user?.role === "client") {
        router.push("/client/products")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)

      // Define alerta de erro no box
      setErrorAlert(errorMessage)

      // Define o erro nos dois campos APENAS para deixar labels e bordas vermelhas
      // Sem mensagem, pois já está no box de alerta
      form.setError("email", {
        type: "manual",
        message: "", // Vazio para não mostrar texto
      })

      form.setError("password", {
        type: "manual",
        message: "", // Vazio para não mostrar texto
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-4">
      {errorAlert && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{errorAlert}</p>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-zinc-200">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="exemplo@email.com"
                    error={!!fieldState.error}
                    className="h-10 rounded-xl border-zinc-700 bg-zinc-900 text-zinc-50 shadow-none placeholder:text-zinc-500 focus-visible:border-yellow-400 focus-visible:ring-yellow-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-zinc-200">Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="******"
                      error={!!fieldState.error}
                      className="h-10 rounded-xl border-zinc-700 bg-zinc-900 pr-11 text-zinc-50 shadow-none placeholder:text-zinc-500 focus-visible:border-yellow-400 focus-visible:ring-yellow-400"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-yellow-300"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="h-10 w-full rounded-xl bg-yellow-400 font-semibold text-zinc-950 shadow-lg shadow-yellow-500/25 hover:bg-yellow-300 disabled:opacity-70" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Entrando" : "Entrar"}
          </Button>
          <div className="text-center text-sm">
            <Link href="/forgot-password" className="font-medium text-zinc-300 underline underline-offset-4 hover:text-yellow-300">
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
