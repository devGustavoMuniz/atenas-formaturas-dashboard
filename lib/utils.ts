import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export enum ProductFlag {
  ALBUM = "Álbum",
  GENERIC = "Produto com seleção de fotos",
  DIGITAL_FILES = "Arquivos digitais",
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function translatePaymentStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED') {
  const translations = {
    PENDING: 'Pagamento Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Recusado',
    CANCELLED: 'Cancelado',
    COMPLETED: 'Concluído',
  }
  return translations[status] || status
}

export function translateProductType(type: 'GENERIC' | 'DIGITAL_FILES' | 'ALBUM') {
  const translations = {
    GENERIC: 'Produto com seleção de fotos',
    DIGITAL_FILES: 'Arquivos digitais',
    ALBUM: 'Álbum',
  }
  return translations[type] || type
}
