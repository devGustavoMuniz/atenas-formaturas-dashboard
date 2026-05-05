import type { Metadata } from "next"
import Image from "next/image"
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-6 text-zinc-950 sm:px-6">
      <Link
        href="https://atenasformaturas.com.br"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 z-10 h-9 gap-2 rounded-full bg-zinc-900 px-4 text-sm text-zinc-200 ring-1 ring-yellow-400/20 hover:bg-zinc-800 hover:text-yellow-300 sm:left-8 sm:top-8"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a home
      </Link>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.26),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(250,204,21,0.08)_0,transparent_32%,rgba(250,204,21,0.04)_100%)]" />

      <section className="relative w-full max-w-[440px]">
        <div className="rounded-[1.5rem] border border-yellow-400/25 bg-zinc-950/92 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur sm:p-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-[#999] shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-400/25">
              <Image
                src="/favicon.png"
                alt="Atenas Formaturas"
                width={64}
                height={62}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-sm font-medium text-yellow-300">Atenas Formaturas</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Acesse sua conta</h1>
            <p className="mt-1.5 max-w-[320px] text-sm leading-5 text-zinc-400">
              Entre para gerenciar contratos, pedidos, produtos e seleções da plataforma.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/terms" className="font-medium text-zinc-100 underline underline-offset-4 hover:text-yellow-300">
              Termos
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="font-medium text-zinc-100 underline underline-offset-4 hover:text-yellow-300">
              Privacidade
            </Link>
            .
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span className="text-zinc-300">Ambiente seguro para clientes e administradores</span>
        </div>
      </section>
    </main>
  )
}
