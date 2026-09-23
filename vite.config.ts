import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function treeSyncPlugin() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const dataFile = path.resolve(dataDir, 'master_tree.json');

  return {
    name: 'tree-sync-api',
    configureServer(server: any) {
      server.middlewares.use('/api/sync-tree', (req: any, res: any) => {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        if (req.method === 'GET') {
          if (fs.existsSync(dataFile)) {
            const raw = fs.readFileSync(dataFile, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(raw);
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ nodes: null, links: null, lastUpdated: 0 }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, lastUpdated: parsed.lastUpdated || Date.now() }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end('Method Not Allowed');
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), treeSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
