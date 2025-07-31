# Gemini Project Manual

This document provides a guide for the Gemini AI to understand and interact with this project, ensuring that any generated code or modifications align with the established conventions and structure.

## 1. Core Technologies

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with `shadcn/ui` and `tailwindcss-animate`.
- **UI Components:** `shadcn/ui` is the primary component library. Components are located in `components/ui` and are composed into feature-specific components in other directories inside `components/`.
- **State Management:**
  - `TanStack React Query`: For server-state management (fetching, caching, and updating data from the API).
  - `Zustand`: For client-state management.
- **Forms:** `react-hook-form` is used for form handling, with `zod` for schema validation.
- **API Communication:** `axios` is used for all HTTP requests to the backend. Configuration can be found in `lib/api/axios-config.ts`.

## 2. Project Structure

- **Routing:** The project uses the Next.js App Router. Route groups are defined in the `app/` directory:
  - `(auth)`: Authentication-related pages (e.g., login).
  - `(dashboard)`: The main application dashboard and its sub-pages.
  - `(public)`: Publicly accessible pages like privacy policy and terms of service.
- **Components:**
  - `components/ui`: Base UI components from `shadcn/ui`.
  - `components/<feature>`: Components are organized by feature (e.g., `components/products`, `components/users`).
- **API Logic:** All API-related functions are located in `lib/api/`. Each file corresponds to a specific API resource (e.g., `products-api.ts`, `users-api.ts`).
- **State Stores:** Zustand stores are located in `lib/store/`.
- **Type Definitions:** Global types are in `lib/types.ts`. Feature-specific types are co-located with their respective features or defined in files like `lib/product-details-types.ts`.
- **Styling:** Global styles are in `app/globals.css`. Tailwind CSS is configured in `tailwind.config.ts`.

## 3. Development Commands

- **Run development server:** `pnpm dev`
- **Create production build:** `pnpm build`
- **Start production server:** `pnpm start`
- **Run linter:** `pnpm lint`

## 4. Coding Conventions

- **Component Style:** Use functional components with TypeScript.
- **File Naming:** Use kebab-case for file names (e.g., `user-form.tsx`).
- **Styling:** Use Tailwind CSS utility classes for styling. Avoid writing custom CSS where possible.
- **State Management:**
  - Use `TanStack React Query` for data fetching and caching.
  - Use `Zustand` for global UI state.
- **Path Aliases:** The project uses the `@/*` alias to refer to the root directory. Always use this alias when importing modules from within the project (e.g., `import { Button } from '@/components/ui/button'`).
- **API Requests:** Always use the `axios` instance configured in `lib/api/axios-config.ts` for making API calls. This ensures that the base URL and other defaults are applied consistently.
- **Localization:** All user-facing text should be in Portuguese (pt-BR).

By following these guidelines, Gemini can provide more accurate and consistent assistance.

## 5. Tasks Completed (26 de julho de 2025)

- **Funcionalidade de Seleção de Fotos:**
  - Criado um store Zustand (`lib/store/product-selection-store.ts`) para gerenciar o estado do produto selecionado.
  - Criado o componente `SelectableImageCard` (`components/products/selectable-image-card.tsx`) para exibir fotos com checkbox de seleção.
  - Criada a página de seleção de fotos (`app/(dashboard)/client/products/[id]/select-photos/page.tsx`).
  - Modificada a página de detalhes do produto para redirecionar para a página de seleção de fotos e passar os dados do produto via Zustand.
  - Implementada a filtragem de eventos na página de seleção de fotos para produtos com a flag "GENERIC", exibindo apenas eventos configurados para venda.
  - Corrigido erro de tipagem em `lib/api/institution-products-api.ts` definindo `InstitutionProductDetails`.
  - Corrigida a lógica de filtragem de eventos para usar `e.id` em vez de `e.eventId`.
  - Adicionada funcionalidade de colapsar/expandir seções de eventos usando `shadcn/ui`'s `Collapsible` component.
  - Melhorado o ícone de colapsar para refletir o estado (aberto/fechado) da seção.
  - Tornada toda a área do cabeçalho da seção de evento clicável para colapsar/expandir.
  - Adicionado um efeito de hover à área clicável do cabeçalho.

## 5. Tasks Completed (29 de julho de 2025)

- **Implementação das Regras de Negócio para a Flag 'GENERIC':**
  - Atualizado o store Zustand (`lib/store/product-selection-store.ts`) para gerenciar o estado das fotos selecionadas.
  - Criado o componente `SelectionSummary` (`components/products/selection-summary.tsx`) para exibir o resumo da seleção e as regras por evento.
  - Modificada a página de seleção de fotos (`app/(dashboard)/client/products/[id]/select-photos/page.tsx`) para utilizar o `selectedPhotos` do store e integrar o `SelectionSummary`.
  - Atualizado o componente `SelectableImageCard` (`components/products/selectable-image-card.tsx`) para passar o `photoId` na função de seleção.
  - Adicionadas as funções `formatCurrency` e `formatNumber` em `lib/utils.ts`.
  - Corrigidas as tipagens em `lib/api/institution-products-api.ts` e `lib/product-details-types.ts` para `minPhotos`, `valorPhoto` e `name` na interface `EventConfiguration`.
  - Ajustada a lógica de validação do botão "Próximo" (`isNextButtonEnabled`) em `select-photos/page.tsx` para que a regra de `minPhotos` por evento só seja aplicada se houver pelo menos uma foto selecionada para aquele evento.
  - Modificado o `SelectionSummary.tsx` para exibir os detalhes de um evento apenas se houver pelo menos uma foto selecionada para ele.

## 6. Próximas Tarefas

- **Implementar Regras de Negócio para Seleção de Fotos:**
  - Detalhes específicos das regras para cada `flag` de produto serão fornecidos posteriormente.
