import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="https://atenasformaturas.com.br"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 top-4 flex items-center md:right-8 md:top-8"
        )}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a home
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFEA00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Admin Dashboard
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Esta plataforma simplificou nossa gestão de usuários e melhorou nossa produtividade.&rdquo;
            </p>
            <footer className="text-sm">Sofia Oliveira</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar na conta</h1>
            <p className="text-sm text-muted-foreground">Digite seu e-mail e senha para acessar o dashboard</p>
          </div>
          <LoginForm />
          <p className="px-4 text-center text-sm text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-yellow-500">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-yellow-500">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
