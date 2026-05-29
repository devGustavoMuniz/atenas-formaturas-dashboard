import { OrderDto } from '@/lib/order-types'
import { formatCurrency, formatDate } from '@/lib/utils'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatCpf(value?: string | null) {
  const digits = value?.replace(/\D/g, '')

  if (!digits || digits.length !== 11) return value || 'Nao informado'

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatPhone(value?: string | null) {
  const digits = value?.replace(/\D/g, '')

  if (!digits) return 'Nao informado'

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return value || 'Nao informado'
}

function getItemDescription(order: OrderDto) {
  return order.items.map((item) => {
    const details = item.details ?? []
    const photos = details.filter((detail) => detail.photoUrl)
    const packages = details.filter((detail) => detail.isPackage && detail.eventId)
    const fullPackage = details.find((detail) => detail.isPackage && !detail.eventId)
    const quantityPrefix = item.quantity > 1 ? `${item.quantity}x ` : ''

    if (item.productType === 'ALBUM' && photos.length > 0) {
      return `${quantityPrefix}${item.productName} - ${photos.length} fotos`
    }

    if (item.productType === 'DIGITAL_FILES' && fullPackage) {
      return `${quantityPrefix}${item.productName} - Pacote completo`
    }

    if (item.productType === 'DIGITAL_FILES' && packages.length > 0) {
      return `${quantityPrefix}${item.productName} - ${packages.length} evento${packages.length > 1 ? 's' : ''}`
    }

    if (photos.length > 0) {
      return `${quantityPrefix}${item.productName} - ${photos.length} fotos`
    }

    return `${quantityPrefix}${item.productName}`
  })
}

function getDelivery(order: OrderDto) {
  return order.report?.delivery ?? order.shippingAddress ?? null
}

function buildFinancialRows({
  orderAmount,
  atenasCreditUsed,
  mercadoPagoFee,
  netReceivedAmount,
  totalPaidAmount,
}: {
  orderAmount: number
  atenasCreditUsed: number
  mercadoPagoFee: number | null
  netReceivedAmount: number | null
  totalPaidAmount: number | null
}) {
  const mercadoPagoGrossAmount = totalPaidAmount ?? Math.max(orderAmount - atenasCreditUsed, 0)
  const hasAtenasCredit = atenasCreditUsed > 0
  const hasMercadoPagoAmount = mercadoPagoGrossAmount > 0
  const hasMercadoPagoData = hasMercadoPagoAmount || mercadoPagoFee !== null || netReceivedAmount !== null
  const rows = [
    `<p class="line"><strong>Valor do pedido:</strong> ${escapeHtml(formatCurrency(orderAmount))}</p>`,
  ]

  if (hasAtenasCredit) {
    rows.push(`<p class="line"><strong>Creditos Atenas Usados:</strong> ${escapeHtml(formatCurrency(atenasCreditUsed))}</p>`)
  }

  if (hasMercadoPagoData) {
    rows.push(`<p class="line"><strong>Valor pago via Mercado Pago:</strong> ${escapeHtml(formatCurrency(mercadoPagoGrossAmount))}</p>`)
  }

  if (mercadoPagoFee !== null) {
    rows.push(`<p class="line"><strong>Taxas da Mercado Pago:</strong> ${escapeHtml(formatCurrency(mercadoPagoFee))}</p>`)
  }

  if (netReceivedAmount !== null) {
    rows.push(`<p class="line"><strong>Valor recebido:</strong> ${escapeHtml(formatCurrency(netReceivedAmount))}</p>`)
  } else if (hasAtenasCredit && !hasMercadoPagoAmount) {
    rows.push(`<p class="line"><strong>Valor recebido:</strong> ${escapeHtml(formatCurrency(atenasCreditUsed))}</p>`)
  } else if (hasMercadoPagoAmount && mercadoPagoFee !== null) {
    rows.push(`<p class="line"><strong>Valor recebido:</strong> ${escapeHtml(formatCurrency(Math.max(mercadoPagoGrossAmount - mercadoPagoFee, 0)))}</p>`)
  }

  return rows.join('')
}

type GenerateOrderReportPdfOptions = {
  fallbackBuyerCpf?: string | null
}

export function generateOrderReportPdf(order: OrderDto, options: GenerateOrderReportPdfOptions = {}) {
  if (typeof window === 'undefined') return

  console.info('[OrderReportPDF] Generating report', {
    orderId: order.id,
    displayId: order.displayId,
    hasReport: Boolean(order.report),
    report: order.report,
    order,
  })

  const popup = window.open('', '_blank', 'width=900,height=1200')

  if (!popup) {
    console.error('[OrderReportPDF] Could not open report window. Browser may have blocked the popup.')
    return
  }

  try {
    const report = order.report
    const delivery = getDelivery(order)
    const saleDate = report?.saleDate ?? order.createdAt
    const contractNumber = report?.contractNumber ?? order.contractNumber
    const buyerName = report?.buyer?.name ?? 'Nao informado'
    const studentName = report?.student?.name ?? buyerName
    const buyerCpf = formatCpf(report?.buyer?.cpf || options.fallbackBuyerCpf)
    const orderAmount = report?.amounts?.orderAmount ?? order.totalAmount
    const atenasCreditUsed = report?.amounts?.atenasCreditUsed ?? order.creditUsed ?? 0
    const mercadoPagoFee = report?.amounts?.mercadoPagoFee ?? null
    const netReceivedAmount = report?.amounts?.netReceivedAmount ?? null
    const totalPaidAmount = report?.amounts?.totalPaidAmount ?? null
    const paymentDescription = report?.payment?.description ?? 'Nao informado'
    const deliveryPhone = formatPhone(report?.delivery?.phone ?? report?.buyer?.phone)
    const deliveryEmail = report?.delivery?.email ?? report?.buyer?.email ?? 'Nao informado'
    const itemDescriptions = getItemDescription(order)
    const financialRows = buildFinancialRows({
      orderAmount,
      atenasCreditUsed,
      mercadoPagoFee,
      netReceivedAmount,
      totalPaidAmount,
    })

    popup.document.open()
    popup.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatorio de Venda ${escapeHtml(order.displayId)}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #e5e5e5;
            color: #050505;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
          }
          .page {
            width: 190mm;
            min-height: 270mm;
            margin: 0 auto;
            background: #fff;
            border: 2px solid #111;
            padding: 18px 32px 32px;
          }
          .header {
            display: grid;
            grid-template-columns: 94px 1fr 94px;
            align-items: start;
            gap: 12px;
          }
          .logo {
            width: 78px;
            height: 78px;
            object-fit: contain;
          }
          .brand {
            text-align: center;
            line-height: 1.2;
          }
          .brand h1 {
            margin: 2px 0 2px;
            font-size: 28px;
            line-height: 1.1;
          }
          .brand p {
            margin: 0;
            font-size: 11px;
          }
          .cap {
            width: 76px;
            height: 54px;
            margin-left: auto;
            position: relative;
          }
          .cap::before {
            content: "";
            position: absolute;
            inset: 12px 4px 12px 6px;
            background: #050505;
            clip-path: polygon(0 30%, 62% 0, 100% 35%, 38% 68%);
          }
          .cap::after {
            content: "";
            position: absolute;
            right: 16px;
            top: 31px;
            width: 24px;
            height: 14px;
            border-bottom: 3px solid #050505;
            transform: rotate(20deg);
          }
          h2 {
            margin: 30px 0 22px;
            text-align: center;
            font-size: 22px;
          }
          h3 {
            margin: 24px 0 22px;
            text-align: center;
            font-size: 22px;
          }
          .section {
            margin: 0 0 8px;
          }
          .line {
            margin: 2px 0;
            font-size: 14px;
            line-height: 1.18;
          }
          .line strong {
            font-weight: 800;
          }
          .items {
            margin: 0 0 18px;
          }
          .items p {
            margin: 2px 0;
          }
          @media print {
            body { background: #fff; }
            .page { margin: 0; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="header">
            <img class="logo" src="/favicon.png" alt="Atenas Formaturas" />
            <div class="brand">
              <h1>Atenas Formaturas</h1>
              <p>Av. Maria de Paiva Garcia, 345 - Pouso Alegre MG</p>
              <p>Telefone: (35) 3425-1890</p>
            </div>
            <div class="cap" aria-hidden="true"></div>
          </header>

          <h2>Relatorio de Venda</h2>

          <section class="section">
            <p class="line"><strong>Data da venda:</strong> ${escapeHtml(formatDate(saleDate))}</p>
            <p class="line"><strong>Contrato:</strong> ${escapeHtml(contractNumber)}</p>
            <p class="line"><strong>Nome do formando:</strong> ${escapeHtml(studentName)}</p>
            <p class="line"><strong>Nome do comprador:</strong> ${escapeHtml(buyerName)}</p>
            <p class="line"><strong>CPF do comprador:</strong> ${escapeHtml(buyerCpf)}</p>
            ${financialRows}
            <p class="line"><strong>Forma de pagamento:</strong> ${escapeHtml(paymentDescription)}</p>
          </section>

          <h3>Informacoes do pedido</h3>
          <section class="items">
            ${itemDescriptions.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
          </section>

          <h3>Dados de Entrega</h3>
          <section class="section">
            <p class="line"><strong>Cep:</strong> ${escapeHtml(delivery?.zipCode ?? 'Nao informado')}</p>
            <p class="line"><strong>Endereco:</strong> ${escapeHtml(delivery ? `${delivery.street}, ${delivery.number}${delivery.complement ? ` - ${delivery.complement}` : ''}` : 'Nao informado')}</p>
            <p class="line"><strong>Bairro:</strong> ${escapeHtml(delivery?.neighborhood ?? 'Nao informado')}</p>
            <p class="line"><strong>Cidade:</strong> ${escapeHtml(delivery ? `${delivery.city}${delivery.state ? ` - ${delivery.state}` : ''}` : 'Nao informado')}</p>
            <p class="line"><strong>Contato:</strong> ${escapeHtml(deliveryPhone)}</p>
            <p class="line"><strong>E-mail:</strong> ${escapeHtml(deliveryEmail)}</p>
          </section>
        </main>
        <script>
          window.addEventListener('load', () => {
            window.focus();
            window.setTimeout(() => window.print(), 300);
          });
        </script>
      </body>
    </html>
  `)
    popup.document.close()
  } catch (error) {
    console.error('[OrderReportPDF] Failed to render report', error, {
      orderId: order.id,
      displayId: order.displayId,
      report: order.report,
      order,
    })

    popup.document.open()
    popup.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Erro ao gerar relatorio</title>
          <style>
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #111; color: #fff; }
            main { max-width: 720px; margin: 48px auto; padding: 24px; border: 1px solid rgba(250, 204, 21, 0.35); border-radius: 16px; background: rgba(255,255,255,0.04); }
            h1 { margin: 0 0 12px; color: #fde047; }
            p { color: #d4d4d8; line-height: 1.5; }
            code { color: #fca5a5; }
          </style>
        </head>
        <body>
          <main>
            <h1>Erro ao gerar relatorio</h1>
            <p>Ocorreu um erro ao montar o PDF do pedido <code>${escapeHtml(order.displayId)}</code>.</p>
            <p>Abra o console do navegador e envie os logs iniciados por <code>[OrderReportPDF]</code>.</p>
          </main>
        </body>
      </html>
    `)
    popup.document.close()
  }
}
