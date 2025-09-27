# Boltz Passe Anual – UI de Paywall

Interface em Next.js + TypeScript + Tailwind CSS para o fluxo de paywall do Passe Anual. Tudo aqui é UI-only, com funções stub para o time Boltz conectar Stripe e autenticação depois.

## Pré-requisitos

- Node.js 18+
- npm, pnpm ou yarn

## Como rodar

Instale as dependências e suba o servidor de desenvolvimento:

```bash
pnpm install
pnpm dev
```

Também funciona com npm ou yarn:

```bash
npm install
npm run dev
# ou
yarn install
yarn dev
```

A aplicação fica disponível em `http://localhost:3000`.

## Fluxo de integração (Boltz)

As páginas e componentes expõem props/funções para plugar integrações reais:

- `PaywallSheet` recebe `onStartCheckout()` – conectar com Stripe Checkout.
- `AuthPrompt` (e o próprio `PaywallSheet`) usam `onSignInWithGoogle()` e `onSignInWithEmail()` – conectar com o provedor de autenticação desejado.
- O estado `isAuthenticated` deve ser atualizado após o login bem-sucedido.
- O estado `hasAccess` deve ser atualizado após o retorno positivo do checkout.
- Páginas de retorno do Stripe:
  - `pages/checkout/sucesso.tsx` → usar como `success_url`.
  - `pages/checkout/cancelado.tsx` → usar como `cancel_url`.

> **TODOs marcados** no código indicam os pontos exatos para plugar as integrações.

## Estrutura de UI

- `/` – demo com os botões "Criar Carta" e "Escolher Destino". Ambos usam o gate `UseSpecialGate` para abrir o paywall quando necessário.
- `components/PaywallSheet` – paywall acessível com foco preso, botões de login e CTA principal.
- `components/AuthPrompt` – prompt visual para login (sem Firebase).
- `components/UseSpecialGate` – wrapper para ações especiais.
- `components/ui/Button` e `components/ui/Sheet` – camada de UI reutilizável (botões e sheet/modal responsivo).
- `pages/checkout/sucesso` e `pages/checkout/cancelado` – telas estáticas pós-checkout.

Tudo está pronto para mobile-first e responsivo via Tailwind.
