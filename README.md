# 🛒 Scraper de Preços - E-commerce BR

Scraper que extrai **preço e título** de produtos em lojas brasileiras e salva o histórico em CSV. Monitore variação de preço, alerta de promoção, análise de concorrência.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## O que faz

- Lê uma lista de produtos configurável (`produtos.json`)
- Acessa cada página e extrai preço via seletores CSS, JSON-LD ou JSON inline
- Salva tudo em `historico-precos.csv` com timestamp
- Funciona com qualquer site que retorne HTML (Kabum, Amazon, Submarino, etc.)
- Pode rodar via cron pra coletar dados a cada X horas

## Casos de uso

| Cenário | Como usar |
|---|---|
| 🏷️ **Alerta de promoção** | Monitore preços e veja quando caíram |
| 📊 **Análise de concorrência** | Compare preços entre lojas |
| 📈 **Histórico de preços** | Gere CSV com evolução do preço ao longo do tempo |
| 🛍️ **Dropshipping** | Acompanhe preço de custo dos fornecedores |

## Stack

- **Node.js 18+** (ESM, usa `fetch` nativo)
- **jsdom** — parsing de HTML
- Sem navegador headless = leve e rápido

## Como rodar

```bash
git clone https://github.com/pietro-arnhold/scraper-mercadolivre.git
cd scraper-mercadolivre
npm install
```

Edite `produtos.json` com os produtos que quer monitorar:

```json
[
  {
    "name": "Mouse Gamer - Kabum",
    "url": "https://www.kabum.com.br/produto/489498",
    "priceSelectors": [".finalPrice", "h4[itemprop='price']"],
    "titleSelectors": ["h1", ".nameCard"]
  }
]
```

Rode:

```bash
npm start
```

Saída:

```
→ Mouse Gamer - Kabum
  ✓ Mouse Gamer Redragon Cobra M711 RGB, 10000 DPI
    Preço: R$ 103.55

✅ 1 sucesso | ❌ 0 erros
Resultado salvo em ./historico-precos.csv
```

## Como encontrar os seletores

1. Abra o produto no Chrome
2. Clique com botão direito no preço → **Inspecionar**
3. Copie a classe CSS do elemento (ex: `.finalPrice`)
4. Coloque no campo `priceSelectors` do `produtos.json`

O scraper também tenta automaticamente extrair via JSON-LD e JSON inline — muitos sites já funcionam sem configurar seletores.

## Agendar execução automática

```bash
# Windows (Agendador de Tarefas) ou Linux/Mac (cron):
crontab -e
0 * * * * cd /caminho/scraper-mercadolivre && node scraper.js >> run.log 2>&1
```

## Tecnologias

- **Node.js** — runtime com fetch nativo
- **jsdom** — parsing HTML server-side
- **CSV** — formato simples, abre no Excel/Sheets

## Licença

MIT — use como quiser.
