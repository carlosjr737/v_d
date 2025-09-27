import { useRef } from "react";
import { AuthPrompt } from "./AuthPrompt";
import { Button } from "./ui/Button";
import { Sheet } from "./ui/Sheet";

type PaywallSheetProps = {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  hasAccess: boolean;
  onSignInWithGoogle: () => void; // TODO: Boltz - wire Google Auth
  onSignInWithEmail: () => void; // TODO: Boltz - wire Email Auth
  onStartCheckout: () => void; // TODO: Boltz - wire Stripe Checkout
};

const benefits = [
  "Crie cartas personalizadas e salve para outras noites",
  "Escolha o destino e direcione a história",
  "Acesso para a sala inteira quando você é o host"
];

const titleId = "paywall-title";

export const PaywallSheet = ({
  open,
  onClose,
  isAuthenticated,
  hasAccess,
  onSignInWithEmail,
  onSignInWithGoogle,
  onStartCheckout
}: PaywallSheetProps) => {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      initialFocusRef={primaryButtonRef}
    >
      <div className="space-y-6">
        <header className="space-y-2">
          <h2 id={titleId} className="text-xl font-semibold text-neutral-900">
            Libere as Ações Especiais por 1 ano
          </h2>
          <p className="text-sm text-neutral-600">
            As Ações Especiais fazem o jogo ficar com a cara de vocês. Libere por
            1 ano com preço de lançamento.
          </p>
        </header>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-sm text-neutral-500 line-through">R$ 59,90</span>
            <span className="text-3xl font-semibold text-primary">R$ 29,90</span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              Promo de lançamento
            </span>
          </div>
        </div>

        <ul className="space-y-3 text-sm text-neutral-700">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-2 w-2 rounded-full bg-primary" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {!hasAccess && !isAuthenticated && (
          <AuthPrompt
            onSignInWithGoogle={onSignInWithGoogle}
            onSignInWithEmail={onSignInWithEmail}
          />
        )}

        <Button
          ref={primaryButtonRef}
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              onSignInWithGoogle();
              return;
            }

            onStartCheckout();
          }}
          fullWidth
        >
          Liberar agora
        </Button>

        <footer className="text-center text-xs text-neutral-500">
          Pagamento via Stripe (Pix e Cartão).
        </footer>
      </div>
    </Sheet>
  );
};

export type { PaywallSheetProps };
