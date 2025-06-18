import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export enum ProductFlag {
  ALBUM = "Álbum",
  GENERIC = "Produto com seleção de fotos",
  DIGITAL_FILES = "Arquivos digitais"
}