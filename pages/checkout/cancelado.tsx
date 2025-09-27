import Head from "next/head";
import Link from "next/link";

const CheckoutCanceledPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-16">
      <Head>
        <title>Pagamento cancelado</title>
      </Head>
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 text-center shadow-modal">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Pagamento cancelado.
        </h1>
        <p className="text-neutral-600">
          Você pode tentar novamente quando quiser.
        </p>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
};

export default CheckoutCanceledPage;
