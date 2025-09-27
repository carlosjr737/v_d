# Correção de build na Vercel

## Por que o erro ocorria
A Vercel interrompia o build porque o projeto usava TypeScript sem declarar os pacotes de tipos `@types/node`, `@types/react` e `@types/react-dom`. Sem esses tipos (e sem garantir o TypeScript 5.5.x), o compilador acusava dependências ausentes.

## Como limpar e reinstalar
```bash
rm -rf node_modules package-lock.json
npm i
npm run build
```

## Antes do deploy
Certifique-se de gerar e commitar o `package-lock.json` atualizado após a reinstalação para que a Vercel use exatamente as versões validadas.
