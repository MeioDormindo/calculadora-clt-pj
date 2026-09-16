# Calculadora CLT vs PJ

Calculadora que responde a partir de qual faturamento vale a pena trocar a carteira assinada por PJ — contando o que normalmente fica de fora da conta: 13º, adicional de férias, FGTS e multa, aviso prévio, PLR, benefícios, encargos do empregador e os dias em que o PJ simplesmente não fatura (feriados, médico, férias).

## O que ela calcula

- **PJ mínimo** — o faturamento que iguala sua remuneração líquida efetiva de hoje, encontrado por busca binária sobre o modelo de custos.
- **Comparativo linha a linha** entre CLT, PJ mínimo e a proposta que te fizeram.
- **Empresa vs você** — quanto a empresa economiza e quanto seus custos aumentam em cada cenário.

Valores derivados do salário (13º, férias, FGTS, aviso prévio, PLR, INSS patronal, RAT, Sistema S) são preenchidos automaticamente e podem ser sobrescritos.

## Rodando localmente

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # testes do modelo de cálculo
npm run build
```

## Aviso

Tabelas de INSS e IRRF com ano-base **2026**, já incluindo a isenção e o redutor da Lei 15.270/2025 para rendimentos brutos até R$ 7.350. Esses valores mudam todo janeiro — estão isolados em [`src/lib/calc/constants.ts`](src/lib/calc/constants.ts) para facilitar a atualização.

É uma estimativa para apoiar a decisão e a negociação, não substitui a orientação de um contador. Os valores digitados ficam apenas no seu navegador (`localStorage`) e não são enviados a lugar nenhum.
