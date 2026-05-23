import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const PRODUCTS_FILE = './produtos.json';
const OUTPUT_CSV = './historico-precos.csv';

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractFromSelectors(doc, selectors) {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      if (text.length > 0) return text;
    }
  }
  return null;
}

function extractPrice(html, selectors) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // CSS selectors
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = el.textContent.trim();
      const match = text.match(/[\d.,]+/);
      if (match) {
        const cleaned = match[0].replace(/\./g, '').replace(',', '.');
        const price = parseFloat(cleaned);
        if (!isNaN(price) && price > 0) return price;
      }
    }
  }

  // JSON-LD
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const json = JSON.parse(s.textContent);
      const price = json.offers?.price || json.offers?.lowPrice;
      if (price && parseFloat(price) > 0) return parseFloat(price);
    } catch {}
  }

  // Inline JSON: "price":123
  const priceMatch = html.match(/"price"\s*:\s*(\d+\.?\d*)/);
  if (priceMatch) {
    const p = parseFloat(priceMatch[1]);
    if (p > 0) return p;
  }

  return null;
}

function extractTitle(html, selectors) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const text = extractFromSelectors(doc, selectors);
  if (text && text.length > 3) return text;

  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const json = JSON.parse(s.textContent);
      if (json.name) return json.name;
    } catch {}
  }

  const nameMatch = html.match(/"name"\s*:\s*"([^"]+)"/);
  if (nameMatch) return nameMatch[1];

  return doc.querySelector('title')?.textContent?.trim() || null;
}

function ensureCsvHeader() {
  if (!existsSync(OUTPUT_CSV)) {
    writeFileSync(OUTPUT_CSV, 'timestamp,nome,url,preco\n');
  }
}

function appendRow(name, url, price) {
  const ts = new Date().toISOString();
  const safe = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row = [ts, safe(name), safe(url), price ?? ''].join(',');
  appendFileSync(OUTPUT_CSV, row + '\n');
}

async function main() {
  if (!existsSync(PRODUCTS_FILE)) {
    console.error(`Arquivo ${PRODUCTS_FILE} não encontrado. Veja o README.`);
    process.exit(1);
  }

  const products = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf-8'));

  if (products.length === 0) {
    console.error('Nenhum produto configurado.');
    process.exit(1);
  }

  ensureCsvHeader();
  let ok = 0;
  let fail = 0;

  for (const prod of products) {
    try {
      console.log(`\n→ ${prod.name}`);
      const html = await fetchPage(prod.url);
      const title = extractTitle(html, prod.titleSelectors || ['h1']);
      const price = extractPrice(html, prod.priceSelectors || []);

      appendRow(title || prod.name, prod.url, price);

      console.log(`  ✓ ${(title || prod.name).slice(0, 60)}`);
      console.log(`    Preço: ${price ? `R$ ${price.toFixed(2)}` : 'não encontrado'}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ erro: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n✅ ${ok} sucesso | ❌ ${fail} erros`);
  console.log(`Resultado salvo em ${OUTPUT_CSV}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
