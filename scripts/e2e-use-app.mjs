import { spawn } from 'child_process';
import path from 'path';
import puppeteer from 'puppeteer';

const PORT = 3005;
const ORIGIN = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Server did not start in time');
}

function startNext() {
  const bin = path.resolve('node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [bin, 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    env: { ...process.env },
  });
  return child;
}

async function run(phoneInput) {
  const server = startNext();
  try {
    await waitForServer(ORIGIN);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(ORIGIN, { waitUntil: 'networkidle0' });

    async function setInput(selector, value){
      const el = await page.waitForSelector(selector, { timeout: 10000 });
      await el.click({ clickCount: 3 });
      await el.type(String(value));
    }

    // Fill fields
    await setInput('input[placeholder="Nome completo"]', 'Cliente Teste');
    await setInput('input[placeholder="(16) 9 9999-0000"]', phoneInput);
    await setInput('input[placeholder="cliente@email.com"]', 'cliente@example.com');
    await setInput('input[placeholder="Seu nome"]', 'Felipe');

    // Forma de pagamento
    await setInput('input[placeholder="Forma de pagamento"]', 'PIX');

    // Veículo
    await setInput('input[placeholder="Marca"]', 'Toyota');
    await setInput('input[placeholder="Modelo"]', 'Corolla');
    await setInput('input[placeholder="Placa"]', 'ABC-1D23');
    await setInput('input[placeholder="Cor"]', 'Preto');
    await setInput('input[placeholder="Ano"]', '2020');
    await setInput('input[placeholder="KM"]', '40000');

    // Observações
    {
      const ta = await page.waitForSelector('textarea', { timeout: 10000 });
      await ta.click({ clickCount: 3 });
      await ta.type('Teste E2E via Puppeteer');
    }

    // Intercept upload response and popup
    const uploadPromise = page.waitForResponse(res => res.url().includes('/api/whatsapp/upload') && res.request().method() === 'POST');
    const popupPromise = new Promise(resolve => page.once('popup', resolve));

    // Click send
    await page.click('text/Enviar no WhatsApp');

    const uploadRes = await uploadPromise;
    const json = await uploadRes.json();
    const popup = await popupPromise;

    const popupUrl = popup.url();
    console.log('Upload JSON:', json);
    console.log('Opened WhatsApp URL:', popupUrl);

    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }
}

const phone = process.argv[2] || '27998563697';
run(phone).catch((e) => { console.error(e); process.exit(1); });
