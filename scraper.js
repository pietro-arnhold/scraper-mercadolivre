import { chromium } from 'playwright';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';

const PRODUCTS_FILE = './produtos.txt';
const OUTPUT_CSV = './historico-precos.csv';

async function scrapeProduct(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const data = await page.evaluate(() => {
    const title = document.querySelector('h1.ui-pdp-title')?.innerText?.trim() ?? null;

    const priceWhole = document.querySelector('.andes-money-amount__fraction')?.innerText?.replace(/\./g, '') ?? null;
    const priceCents = document.querySelector('.andes-money-amount__cents')?.innerText ?? '00';
    const price = priceWhole ? parseFloat(`${priceWhole}.${priceCents}`) : null;

    const seller = document.querySelector('.ui-pdp-seller__link-trigger-button span')?.innerText?.trim() ?? null;

    const stockText = document.querySelector('.ui-pdp-stock-information__title')?.innerText?.trim() ?? null;
    const available = !document.body.innerText.toLowerCase().includes('sem estoque');

    return { title, price, seller, stockText, available };
  });

  return data;
}

function ensureCsvHeader() {
  if (!existsSync(OUTPUT_CSV)) {
    writeFileSync(OUTPUT_CSV, 'timestamp,url,titulo,preco,vendedor,disponivel,estoque\n');
  }
}

function appendRow(url, data) {
  const ts = new Date().toISOString();
  const safe = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row = [ts, url, safe(data.title), data.price ?? '', safe(data.seller), data.available, safe(data.stockText)].join(',');
  appendFileSync(OUTPUT_CSV, row + '\n');
}

async function main() {
  if (!existsSync(PRODUCTS_FILE)) {
    console.error(`Arquivo ${PRODUCTS_FILE} não encontrado. Cria com 1 URL por linha.`);
    process.exit(1);
  }

  const urls = readFileSync(PRODUCTS_FILE, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (urls.length === 0) {
    console.error('Nenhuma URL no produtos.txt');
    process.exit(1);
  }

  ensureCsvHeader();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  });
  const page = await context.newPage();

  for (const url of urls) {
    try {
      console.log(`→ ${url}`);
      const data = await scrapeProduct(page, url);
      appendRow(url, data);
      console.log(`  ✓ ${data.title?.slice(0, 60) ?? '???'} — R$ ${data.price ?? 'n/d'}`);
    } catch (err) {
      console.error(`  ✗ erro: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nResultado salvo em ${OUTPUT_CSV}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
