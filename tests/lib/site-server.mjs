import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

export async function startSiteServer(root) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = join(root, normalize(pathname).replace(/^\/+/, ''));
    if (pathname.endsWith('/')) file = join(file, 'index.html');
    if (!existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/html' });
      createReadStream(join(root, '404.html')).pipe(response);
      return;
    }
    response.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
