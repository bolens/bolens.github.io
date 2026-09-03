import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

export async function startSiteServer(root) {
  const server = createServer((request, response) => {
    const sendFile = (file, status) => {
      const stream = createReadStream(file);
      stream.once('error', () => {
        if (response.headersSent) response.destroy();
        else {
          response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
          response.end('Internal Server Error');
        }
      });
      stream.once('open', () => {
        response.writeHead(status, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
        if (request.method === 'HEAD') {
          stream.destroy();
          response.end();
        } else {
          stream.pipe(response);
        }
      });
    };
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\0')) throw new URIError('NUL byte in request path');
    } catch {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Bad Request');
      return;
    }
    let file = join(root, normalize(pathname).replace(/^\/+/, ''));
    if (pathname.endsWith('/')) file = join(file, 'index.html');
    let isFile = false;
    try { isFile = statSync(file).isFile(); } catch {}
    if (!isFile) {
      sendFile(join(root, '404.html'), 404);
      return;
    }
    sendFile(file, 200);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  let closing;
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      if (!closing) closing = new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      return closing;
    },
  };
}
