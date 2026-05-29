# Planejamento: migração de auth para cookie httpOnly

## Objetivo

Migrar o refresh/session token do `localStorage` para cookie `httpOnly`, sem usar Next Middleware neste momento.

Com isso, buscamos:

- reduzir risco de XSS roubar refresh token;
- eliminar divergências entre `localStorage`, Zustand e `AuthProvider`;
- manter o custo da Vercel sem Edge Middleware;
- preservar o bootstrap client-side atual, usando loading gate enquanto a sessão é validada.

## Escopo

Esta mudança depende de backend e frontend.

O frontend não consegue criar, ler ou remover cookie `httpOnly` diretamente. Portanto, o backend deve definir e limpar o cookie usando `Set-Cookie`.

## Estado Atual

Hoje o frontend:

- salva `token`, `refreshToken` e `user` no `localStorage`;
- envia `Authorization: Bearer <token>` via Axios;
- chama `/v1/auth/refresh` enviando `{ refreshToken }` no body;
- limpa `localStorage` no logout ou falha de refresh.

## Estado Desejado

O backend passa a ser responsável pelo cookie de sessão/refresh:

- login define cookie `httpOnly`;
- refresh lê cookie automaticamente;
- logout expira cookie;
- frontend usa `withCredentials: true`;
- frontend não armazena refresh token em `localStorage`.

O access token pode seguir uma destas abordagens:

1. **Access token em memória no frontend**
   - backend retorna `token` no login/refresh;
   - frontend guarda o access token só em memória/Zustand não persistido;
   - Axios segue enviando `Authorization`.

2. **Sessão 100% via cookie**
   - backend autentica todas as chamadas via cookie;
   - frontend não envia `Authorization`;
   - exige que todas as rotas da API aceitem cookie como credencial.

Recomendação inicial: opção 1, por ser menor mudança no backend existente.

## Contrato esperado do backend

### `POST /v1/auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "senha"
}
```

Response:

```json
{
  "token": "access-token-curto",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin ou client",
    "lastLoginAt": "date ou null"
  }
}
```

Headers:

```http
Set-Cookie: refreshToken=<opaque-token>; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=<seconds>
```

Observações:

- Em produção, usar `Secure`.
- Se frontend e API estiverem em domínios diferentes, normalmente será necessário `SameSite=None; Secure`.
- Se estiverem no mesmo site, avaliar `SameSite=Lax`.

### `POST /v1/auth/refresh`

Request:

- Sem body obrigatório.
- O browser enviará o cookie automaticamente quando o frontend usar `withCredentials: true`.

Response:

```json
{
  "token": "novo-access-token-curto"
}
```

Opcionalmente, o backend pode retornar também:

```json
{
  "token": "novo-access-token-curto",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin ou client"
  }
}
```

Headers opcionais:

```http
Set-Cookie: refreshToken=<rotated-refresh-token>; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=<seconds>
```

Recomendação: rotacionar refresh token quando possível.

### `GET /v1/users/:id`

Pode continuar igual.

O frontend ainda buscará o usuário completo após login/refresh, a menos que o backend passe a retornar o usuário completo em `/auth/refresh`.

### `POST /v1/auth/logout`

Request:

- Sem body obrigatório.
- Cookie enviado automaticamente.

Response:

```json
{
  "success": true
}
```

Headers:

```http
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0
```

## CORS necessário

Se frontend e API estiverem em origens diferentes:

Backend deve permitir credenciais:

```http
Access-Control-Allow-Credentials: true
```

E `Access-Control-Allow-Origin` não pode ser `*`; deve ser a origem exata do frontend.

Exemplos:

```http
Access-Control-Allow-Origin: https://dashboard.exemplo.com
Access-Control-Allow-Credentials: true
```

No frontend, Axios deverá usar:

```ts
withCredentials: true
```

## Mudanças planejadas no frontend após backend pronto

Não implementar antes do backend estar pronto.

### `lib/api/axios-config.ts`

- Adicionar `withCredentials: true`.
- Remover leitura de `refreshToken` do `localStorage`.
- Alterar refresh interceptor para chamar `/v1/auth/refresh` sem body.
- Ao receber novo access token, manter em memória/Zustand.
- Em falha de refresh, limpar estado local e redirecionar para login.

### `lib/auth/auth-provider.tsx`

- No bootstrap inicial, verificar sessão chamando `/v1/auth/refresh` com cookie.
- Não depender de `localStorage.getItem("refreshToken")`.
- Não persistir `refreshToken`.
- Guardar apenas dados mínimos de usuário, se ainda necessário.
- Idealmente, parar de depender de `localStorage.getItem("user")`.

### `lib/store/auth-store.ts`

- Remover persistência do token ou reduzir persistência para dados não sensíveis.
- Preferir access token em memória.
- Evitar que Zustand persistido seja fonte de verdade para auth.

### Login

- Remover `localStorage.setItem("refreshToken", ...)`.
- Manter apenas access token em memória, se backend continuar usando Bearer token.

### Logout

- Chamar `/v1/auth/logout` com credenciais.
- Backend expira cookie.
- Frontend limpa estado local.

## Fluxo final esperado

### Bootstrap ao abrir o app

1. `AuthProvider` monta.
2. Chama `/v1/auth/refresh` com `withCredentials`.
3. Backend lê cookie `httpOnly`.
4. Se válido:
   - retorna access token;
   - frontend busca usuário completo, se necessário;
   - app renderiza rota correta.
5. Se inválido:
   - frontend considera usuário deslogado;
   - rota protegida redireciona para `/login`.

### Login

1. Frontend envia credenciais.
2. Backend define cookie `httpOnly`.
3. Backend retorna access token e usuário básico.
4. Frontend busca usuário completo.
5. Frontend redireciona por role.

### Refresh automático

1. API retorna 401 para access token expirado.
2. Axios chama `/v1/auth/refresh`.
3. Cookie é enviado automaticamente.
4. Backend retorna novo access token.
5. Axios repete request original.

### Logout

1. Frontend chama `/v1/auth/logout`.
2. Backend expira cookie.
3. Frontend limpa estado em memória.
4. Frontend redireciona para `/login`.

## Critérios de aceite

- Refresh token não aparece mais em `localStorage`.
- Cookie aparece no navegador como `HttpOnly`.
- Login funciona em produção e desenvolvimento.
- Refresh funciona ao recarregar a página.
- Logout remove a sessão de forma efetiva.
- Ao abrir uma rota protegida com sessão válida, usuário não vê tela de login antes de entrar.
- Ao abrir uma rota admin como client, conteúdo admin não renderiza.
- Ao abrir uma rota client como admin, conteúdo client não renderiza.
- Axios não entra em loop infinito de refresh em caso de 401.

## Pontos de atenção

- Cookies cross-site exigem `SameSite=None; Secure`.
- `Secure` exige HTTPS, exceto particularidades de localhost.
- Domínio do cookie precisa ser compatível com frontend/API.
- Não usar `Access-Control-Allow-Origin: *` com credentials.
- Backend deve proteger todas as rotas sensíveis independentemente do frontend.
- Sem Next Middleware, o primeiro conhecimento de sessão continua acontecendo no client, mas o loading gate evita flash de tela errada.

## Fora do escopo por enquanto

- Next Middleware.
- Validação de sessão no servidor do Next.
- SSR autenticado.
- Testes automatizados.
- Reestruturação completa de permissões por role.
