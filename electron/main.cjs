/**
 * Delizia CakeAdmin — desktop interno (Electron).
 *
 * Modos:
 *   - dev:  ELECTRON_START_URL=http://localhost:4200 npm run electron
 *   - prod: sem ELECTRON_START_URL — serve o bundle estático (dist/cakeAdmin/browser)
 *           numa porta efêmera local e faz proxy de /api/* para a API configurada em CAKE_API_URL.
 *
 * O proxy evita CORS sem precisar alterar a API nem expor a porta do backend na rede.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { app, BrowserWindow } = require('electron');

const isDev = Boolean(process.env.ELECTRON_START_URL);
const API_TARGET = (process.env.CAKE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const STATIC_ROOT = path.join(app.getAppPath(), 'dist', 'cakeAdmin', 'browser');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

let staticServer = null;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function proxyApiRequest(req, res, url) {
  const target = API_TARGET + url.pathname.replace(/^\/api/, '') + url.search;

  const headers = {};
  for (const key of ['authorization', 'content-type', 'accept', 'accept-language']) {
    if (req.headers[key]) {
      headers[key] = req.headers[key];
    }
  }

  readBody(req)
    .then((body) =>
      fetch(target, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
        redirect: 'manual',
      }),
    )
    .then(async (upstream) => {
      const responseBody = Buffer.from(await upstream.arrayBuffer());
      const responseHeaders = {};
      upstream.headers.forEach((value, name) => {
        const lower = name.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(lower)) {
          responseHeaders[lower] = value;
        }
      });
      responseHeaders['content-length'] = String(responseBody.length);
      res.writeHead(upstream.status, responseHeaders);
      res.end(responseBody);
    })
    .catch(() => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: `Cake API indisponível em ${API_TARGET}` }));
    });
}

function serveStatic(res, pathname) {
  let relative = decodeURIComponent(pathname);
  if (relative === '/' || relative === '') {
    relative = '/index.html';
  }
  const absolute = path.normalize(path.join(STATIC_ROOT, relative));
  if (!absolute.startsWith(STATIC_ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  let target = absolute;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    target = path.join(STATIC_ROOT, 'index.html'); // fallback SPA (rotas do Angular)
  }
  if (!fs.existsSync(target)) {
    res.writeHead(404).end('CakeAdmin build não encontrada — rode `npm run build`.');
    return;
  }

  const type = MIME_TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  fs.createReadStream(target).pipe(res);
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    staticServer = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
          proxyApiRequest(req, res, url);
          return;
        }
        serveStatic(res, url.pathname);
      } catch {
        res.writeHead(500).end('erro interno');
      }
    });
    staticServer.on('error', reject);
    staticServer.listen(0, '127.0.0.1', () => resolve(staticServer.address().port));
  });
}

async function createWindow() {
  // Verificação do proxy /api → backend sem janela (usado em CI/smoke manual):
  if (process.argv.includes('--api-check')) {
    const port = await startStaticServer();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      const body = await response.text();
      console.log(`API_CHECK ${response.status} ${body}`);
      process.exitCode = response.ok ? 0 : 1;
    } catch (error) {
      console.log('API_CHECK FAILED', error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    } finally {
      staticServer?.close();
      app.exit(process.exitCode ?? 0);
    }
    return;
  }
  await app.whenReady();

  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    autoHideMenuBar: true,
    backgroundColor: '#fffaf5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    await window.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const port = await startStaticServer();
    await window.loadURL(`http://127.0.0.1:${port}/`);
  }

  if (process.argv.includes('--smoke-test')) {
    console.log('SMOKE_OK', window.webContents.getURL());
    window.webContents.once('did-finish-load', () => app.exit(0));
    setTimeout(() => app.exit(0), 5000);
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [first] = BrowserWindow.getAllWindows();
    if (first) {
      if (first.isMinimized()) first.restore();
      first.focus();
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  void createWindow();
}
