import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const publicFiles = new Set(['index.html','styles.css','app.js','prompt.js','master-prompt.txt','review.html']);
const port = Number(process.env.PORT || 4173);
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Also serves the GitHub Pages project prefix to check relative asset paths.
    const stripped = pathname.replace(/^\/chibi-wallpaper-studio(?=\/)/,'');
    const file = stripped === '/' ? 'index.html' : stripped.slice(1);
    if (!publicFiles.has(file)) { res.writeHead(404); return res.end('Not found'); }
    const body = await readFile(path.join(root, file));
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(body);
  } catch { res.writeHead(500); res.end('Preview error'); }
}).listen(port, '127.0.0.1', () => process.stdout.write(`Preview: http://127.0.0.1:${port}\n`));
