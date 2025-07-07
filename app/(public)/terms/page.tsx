import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Termos de Serviço",
  description: "Termos de Serviço da plataforma",
}

export default function TermsPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
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
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Termos de Serviço</h1>
            <p className="text-sm text-muted-foreground">Última atualização: 22 de maio de 2023</p>
          </div>

          <div className="space-y-6 overflow-auto max-h-[60vh] p-4">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
              <p className="text-sm text-muted-foreground">
                Ao acessar ou usar nossa plataforma, você concorda em ficar vinculado a estes Termos de Serviço. Se você
                não concordar com algum aspecto destes termos, não poderá usar nossos serviços.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
              <p className="text-sm text-muted-foreground">
                Nossa plataforma oferece ferramentas para gerenciamento de usuários e contratos, permitindo o
                cadastro, edição e exclusão de informações relacionadas.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">3. Contas de Usuário</h2>
              <p className="text-sm text-muted-foreground">
                Para utilizar nossos serviços, você precisa criar uma conta. Você é responsável por manter a
                confidencialidade de suas credenciais de login e por todas as atividades que ocorrem em sua conta.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">4. Uso Aceitável</h2>
              <p className="text-sm text-muted-foreground">
                Você concorda em usar nossos serviços apenas para fins legais e de acordo com estes Termos. Você não
                deve usar nossos serviços para qualquer finalidade ilegal ou não autorizada.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">5. Propriedade Intelectual</h2>
              <p className="text-sm text-muted-foreground">
                Todo o conteúdo, recursos e funcionalidades disponíveis em nossa plataforma são propriedade da empresa e
                estão protegidos por leis de propriedade intelectual.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">6. Limitação de Responsabilidade</h2>
              <p className="text-sm text-muted-foreground">
                Em nenhuma circunstância seremos responsáveis por quaisquer danos indiretos, incidentais, especiais,
                consequenciais ou punitivos, incluindo perda de lucros.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">7. Alterações nos Termos</h2>
              <p className="text-sm text-muted-foreground">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações entrarão em vigor
                imediatamente após a publicação dos Termos atualizados.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">8. Lei Aplicável</h2>
              <p className="text-sm text-muted-foreground">
                Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar seus
                princípios de conflito de leis.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400"
            >
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
