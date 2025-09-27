# Fix de ESLint para deploy

## Por que o erro acontecia
O projeto usava `eslint@9.x`, mas `eslint-config-next@14.2.3` exige `eslint` ^7 ou ^8. Durante o `npm install` na Vercel, o resolver de dependências travava com `ERESOLVE` ao tentar conciliar essas versões. Fixamos o ESLint em `8.57.0`, compatível com o preset do Next.js.

## Limpeza e reinstalação
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Como validar a versão instalada
```bash
npm ls eslint
```
O comando deve listar apenas `eslint@8.57.0`.

## Próximos passos para deploy na Vercel
1. Garantir que o repositório contenha o `package-lock.json` gerado após a reinstalação.
2. Executar o pipeline da Vercel; a instalação deve prosseguir sem conflitos de peer dependencies.
3. Conferir os logs do build para verificar `eslint@8.57.0` e rodar `npm run build` com sucesso.
