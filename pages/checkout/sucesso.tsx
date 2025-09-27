import Head from "next/head";
import Link from "next/link";

const CheckoutSuccessPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-16">
      <Head>
        <title>Passe Anual liberado</title>
      </Head>
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 text-center shadow-modal">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Acesso liberado! Seu Passe Anual está ativo.
        </h1>
        <p className="text-neutral-600">
          Agora você pode usar as Ações Especiais sem limites pelos próximos 12
          meses.
        </p>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
        >
          Voltar ao jogo
        </Link>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
