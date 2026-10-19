/**
 * AssetForge Local Server
 * 
 * This serves the built app AND proxies API requests to Tripo AI
 * (to avoid CORS issues when calling from the browser)
 * 
 * Usage:
 *   npm run build
 *   node server.js
 *   → Open http://localhost:3000
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const TRIP_API_HOST = 'api.tripo3d.ai';
const MESHY_API_HOST = 'api.meshy.ai';

// MIME types for serving static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
};

// Generic proxy function
function proxyRequest(req, res, body, targetHost, pathPrefix) {
  const urlPath = req.url.replace(pathPrefix, '');
  
  const options = {
    hostname: targetHost,
    path: urlPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetHost,
    },
  };

  // Remove headers that shouldn't be forwarded
  delete options.headers['origin'];
  delete options.headers['referer'];
  delete options.headers['connection'];

  const proxyReq = https.request(options, (proxyRes) => {
    // Forward CORS headers
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  if (body) {
    proxyReq.write(body);
  }
  proxyReq.end();
}

// Handle multipart upload proxy (special case for file uploads)
function proxyUpload(req, res, targetHost, pathPrefix) {
  const urlPath = req.url.replace(pathPrefix, '');
  
  const options = {
    hostname: targetHost,
    path: urlPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetHost,
    },
  };

  delete options.headers['origin'];
  delete options.headers['referer'];
  delete options.headers['connection'];

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Upload proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  req.pipe(proxyReq);
}

// Serve static files from dist/
function serveStatic(req, res) {
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(path.join(__dirname, 'dist'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found, serve index.html (SPA routing)
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

// Main server
const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*',
      'access-control-max-age': '86400',
    });
    res.end();
    return;
  }

  // Proxy API requests to Tripo
  if (req.url.startsWith('/api/tripo')) {
    console.log(`[PROXY] ${req.method} ${req.url} → ${TRIP_API_HOST}`);
    
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      proxyUpload(req, res, TRIP_API_HOST, '/api/tripo');
    } else {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        proxyRequest(req, res, body || null, TRIP_API_HOST, '/api/tripo');
      });
    }
    return;
  }

  // Proxy API requests to Meshy
  if (req.url.startsWith('/api/meshy')) {
    console.log(`[PROXY] ${req.method} ${req.url} → ${MESHY_API_HOST}`);
    
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      proxyRequest(req, res, body || null, MESHY_API_HOST, '/api/meshy');
    });
    return;
  }

  // Serve static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🎮 AssetForge is running!                          ║
║                                                      ║
║   → Open http://localhost:${PORT}                      ║
║                                                      ║
║   API requests are proxied to Tripo AI               ║
║   (no CORS issues!)                                  ║
║                                                      ║
║   Press Ctrl+C to stop                               ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);
});
