import { useState } from "react";
import Head from "next/head";
import { PaywallSheet } from "../components/PaywallSheet";
import { UseSpecialGate } from "../components/UseSpecialGate";
import { Button } from "../components/ui/Button";

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const onSignInWithGoogle = () => {
    alert("TODO: integrar login Google");
    setIsAuthenticated(true);
  };

  const onSignInWithEmail = () => {
    alert("TODO: integrar login Email");
    setIsAuthenticated(true);
  };

  const onStartCheckout = () => {
    alert("TODO: integrar Stripe Checkout");
    // TODO: Boltz - acionar checkout do Stripe e atualizar hasAccess após sucesso
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>Demo Ações Especiais</title>
      </Head>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-12">
        <section className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Passe Anual
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Demo das Ações Especiais
          </h1>
          <p className="text-neutral-600">
            Tente usar uma ação especial para ver o paywall em ação.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <UseSpecialGate
            isAuthenticated={isAuthenticated}
            hasAccess={hasAccess}
            onRequestPaywall={() => setPaywallOpen(true)}
          >
            <Button type="button" fullWidth>
              Criar Carta
            </Button>
          </UseSpecialGate>

          <UseSpecialGate
            isAuthenticated={isAuthenticated}
            hasAccess={hasAccess}
            onRequestPaywall={() => setPaywallOpen(true)}
          >
            <Button type="button" fullWidth>
              Escolher Destino
            </Button>
          </UseSpecialGate>
        </section>

        <section className="space-y-2 rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          <h2 className="text-base font-semibold text-neutral-900">
            Como testar
          </h2>
          <ul className="list-inside list-disc space-y-1 text-left">
            <li>Use os botões acima para abrir o paywall.</li>
            <li>
              Simule login clicando em um dos botões de entrada ou no CTA (isso
              marca você como autenticado nesta demo).
            </li>
            <li>
              Depois do login, clique em “Liberar agora” para ver o stub do
              Stripe Checkout.
            </li>
          </ul>
        </section>
      </main>

      <PaywallSheet
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        isAuthenticated={isAuthenticated}
        hasAccess={hasAccess}
        onSignInWithGoogle={onSignInWithGoogle}
        onSignInWithEmail={onSignInWithEmail}
        onStartCheckout={onStartCheckout}
      />
    </div>
  );
};

export default HomePage;
