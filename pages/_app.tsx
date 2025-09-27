import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Boltz Passe Anual</title>
        <meta
          name="description"
          content="Libere as Ações Especiais do jogo com o Passe Anual."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default App;
