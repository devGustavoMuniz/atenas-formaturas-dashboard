import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade da plataforma",
}

export default function PrivacyPage() {
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
            Atenas Formaturas
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
            <h1 className="text-2xl font-semibold tracking-tight">Política de Privacidade</h1>
            <p className="text-sm text-muted-foreground">Última atualização: 22 de maio de 2023</p>
          </div>

          <div className="space-y-6 overflow-auto max-h-[60vh] p-4">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">1. Introdução</h2>
              <p className="text-sm text-muted-foreground">
                Esta Política de Privacidade descreve como coletamos, usamos e compartilhamos suas informações pessoais
                quando você utiliza nossa plataforma.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">2. Informações que Coletamos</h2>
              <p className="text-sm text-muted-foreground">
                Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, número de
                telefone e outras informações de perfil. Também coletamos informações automaticamente quando você usa
                nossa plataforma, como dados de uso e informações do dispositivo.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">3. Como Usamos Suas Informações</h2>
              <p className="text-sm text-muted-foreground">
                Usamos suas informações para fornecer, manter e melhorar nossos serviços, para se comunicar com você,
                para fins de segurança e para cumprir obrigações legais.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">4. Compartilhamento de Informações</h2>
              <p className="text-sm text-muted-foreground">
                Podemos compartilhar suas informações com prestadores de serviços terceirizados que nos ajudam a operar
                nossa plataforma, com parceiros de negócios e quando exigido por lei.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">5. Segurança de Dados</h2>
              <p className="text-sm text-muted-foreground">
                Implementamos medidas de segurança para proteger suas informações contra acesso não autorizado,
                alteração, divulgação ou destruição.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">6. Seus Direitos</h2>
              <p className="text-sm text-muted-foreground">
                Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas informações pessoais.
                Você também pode se opor ao processamento de suas informações ou solicitar a portabilidade de seus
                dados.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">7. Alterações nesta Política</h2>
              <p className="text-sm text-muted-foreground">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre quaisquer
                alterações publicando a nova Política de Privacidade nesta página.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">8. Contato</h2>
              <p className="text-sm text-muted-foreground">
                Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pelo e-mail:
                privacidade@exemplo.com.
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
