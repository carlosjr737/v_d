# Correção de build na Vercel

## Causa do erro
O build falhava porque o projeto usa TypeScript, porém faltavam os pacotes de tipos `@types/node`, `@types/react` e `@types/react-dom`, fazendo o compilador abortar na Vercel.

## Como corrigir e preparar o próximo deploy
```bash
rm -rf node_modules package-lock.json
npm i
npm run build
```

Após instalar, commite o `package-lock.json` gerado para garantir que a Vercel use as dependências validadas.
