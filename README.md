# Scraper Mercado Livre

Scraper que extrai **preço, vendedor e disponibilidade** de qualquer produto do Mercado Livre e salva o histórico em CSV. Útil pra monitorar variação de preço ao longo do tempo (alerta de promoção, análise de concorrência, dropshipping).

## O que ele faz

- Lê uma lista de URLs de `produtos.txt`
- Acessa cada produto com navegador headless (Playwright)
- Extrai: título, preço, vendedor, disponibilidade
- Salva tudo em `historico-precos.csv` com timestamp
- Pode rodar via cron pra coletar dados a cada X horas

## Stack

- **Node.js 18+** (ESM)
- **Playwright** (navegação headless, lida com JavaScript dinâmico)

## Como rodar

```bash
# 1. Instalar dependências
npm install
npx playwright install chromium

# 2. Editar produtos.txt — colar 1 URL por linha

# 3. Executar
npm start
```

Saída no terminal:

```
→ https://www.mercadolivre.com.br/...
  ✓ Notebook Lenovo IdeaPad 3i Intel Core i5... — R$ 3499.00

Resultado salvo em ./historico-precos.csv
```

E o CSV gerado:

```csv
timestamp,url,titulo,preco,vendedor,disponivel,estoque
2026-05-22T14:32:01.234Z,https://...,"Notebook Lenovo IdeaPad 3i",3499.00,"LENOVO BRASIL",true,"Estoque disponível"
```

## Agendar com cron (Linux/Mac)

Pra rodar a cada hora:

```bash
crontab -e
# adicionar:
0 * * * * cd /caminho/scraper-mercadolivre && /usr/bin/node scraper.js >> run.log 2>&1
```

## Customizações comuns

- **Outro marketplace** (Amazon, Magalu, Shopee): trocar os seletores no `scrapeProduct()` — estrutura geral idêntica
- **Alerta por email/Telegram quando preço cair X%:** comparar último valor do CSV antes de inserir nova linha
- **Salvar em banco** (Postgres/SQLite) ao invés de CSV: trocar `appendRow()`

## Sobre

Projeto de portfólio mostrando scraping resiliente com Playwright.
Disponível pra customização sob demanda — contato: [Workana](#) | GitHub: [@pietro-arnhold](https://github.com/pietro-arnhold)
