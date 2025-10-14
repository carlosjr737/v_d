# Verdade ou Consequência — Guia de Identidade Visual

Este documento resume como aplicar e manter a identidade "Verdade ou Consequência" dentro do projeto. Toda a lógica do jogo permanece intocada: concentre-se apenas na camada visual.

## Fontes oficiais
- **Títulos:** [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue)
- **Corpo/UI:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Destaques:** [Playfair Display Italic](https://fonts.google.com/specimen/Playfair+Display)

As fontes são importadas em `index.html` e aplicadas via classes utilitárias (`font-display`, `font-sans`, `font-accent`).

## Tokens globais
Todos os tokens estão centralizados em [`src/styles/tokens.css`](src/styles/tokens.css) e expostos ao Tailwind (`theme.extend`). Utilize **sempre** os tokens ao criar novas superfícies, gradientes ou estados.

| Categoria | Tokens principais |
|-----------|------------------|
| Cores base | `--color-primary-300/500/700`, `--color-secondary-300/500/700`, `--color-accent-500` |
| Superfícies | `--color-bg-900`, `--color-bg-800`, `--color-border`, `--overlay-veil` |
| Texto | `--color-text`, `--color-text-2` |
| Níveis | `--level-leve`, `--level-medio`, `--level-pesado`, `--level-extremo` |
| Gradientes | `--grad-heat`, `--glow-dare`, `--grad-overlay` |
| Tipografia | `--font-display`, `--font-body`, `--font-accent` |
| Forma & efeitos | `--radius-pill`, `--radius-card`, `--shadow-heat`, `--focus-glow` |
| Outros | `--button-height`, `--texture-noise` |

## Utilitários Tailwind personalizados
- **Cores:** `bg-primary-500`, `text-text-subtle`, `border-border`, `bg-level-leve`, etc.
- **Raios:** `rounded-pill` e `rounded-card` para botões/cards.
- **Sombras:** `shadow-heat` adiciona o brilho oficial (combine com `[--focus-shadow:var(--shadow-heat)]` para preservar a sombra em foco).
- **Gradientes:** `bg-grad-heat` e `bg-glow-dare` aplicam os gradientes oficiais.

## Padrões de componentes
- **Botão primário:** `class="flex h-[var(--button-height)] items-center justify-center gap-3 rounded-pill bg-grad-heat px-6 text-text shadow-heat [--focus-shadow:var(--shadow-heat)]"`
- **Botão secundário:** `class="rounded-pill border border-border bg-bg-800/70 text-text hover:border-primary-500"`
- **Chip de nível:** `class="rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text bg-level-<nivel>"`
- **Card base:** `class="relative overflow-hidden rounded-card border border-border bg-bg-900/70 p-8 shadow-heat"`

## Estados e acessibilidade
- **Foco:** já configurado globalmente com `box-shadow: var(--focus-glow)`; lembre-se de definir `[--focus-shadow:var(--shadow-heat)]` em elementos com sombra permanente.
- **Contraste:** utilize `text-text` para textos importantes e `text-text-subtle` para legendas.
- **Áreas clicáveis:** mantenha altura mínima de `h-12` (ou `h-[var(--button-height)]`) para ações primárias.

## Estrutura visual
- O fundo base usa `var(--color-bg-900)` + `--grad-overlay` + `--texture-noise` (já aplicado em `src/index.css`).
- Sobreposições como modais usam `bg-[var(--overlay-veil)]`.
- Cartas e telas principais possuem uma **barra de nível** (`bg-level-*`) no topo para comunicar a intensidade atual.

Siga estas diretrizes ao criar novas telas, estados ou componentes. Qualquer cor ou efeito adicional deve ser derivado dos tokens acima para preservar a coerência da marca.

## Configuração do Stripe

### 1. Criar Produtos no Stripe Dashboard

Acesse o [Stripe Dashboard](https://dashboard.stripe.com/products) e crie:

**Produto: "Verdade ou Consequência Premium"**
- Plano Mensal: R$ 29,90/mês
- Plano Anual: R$ 97,90/ano

### 2. Configurar Variáveis de Ambiente

No Firebase Functions, configure as seguintes variáveis:

```bash
# Chaves do Stripe
firebase functions:config:set stripe.secret_key="sk_live_..." 
firebase functions:config:set stripe.monthly_price_id="price_1SIDjxGaPkvrhUnLfxIqIESn"
firebase functions:config:set stripe.annual_price_id="price_1SIDlaGaPkvrhUnL7nNYC3xD"
firebase functions:config:set stripe.webhook_secret="whsec_..."

# URLs de redirecionamento
firebase functions:config:set app.success_url="https://seu-dominio.com/checkout/success"
firebase functions:config:set app.cancel_url="https://seu-dominio.com/checkout/cancel"
```

### 3. Configurar Webhook no Stripe

1. Acesse [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Adicione endpoint: `https://sua-regiao-seu-projeto.cloudfunctions.net/stripeWebhook`
3. Selecione eventos:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 4. Testar Pagamentos

Use os cartões de teste do Stripe:
- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### 5. Deploy das Functions

```bash
cd functions
npm run deploy
```