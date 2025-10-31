import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl(): string {
  const raw = process.env.API_URL || '';
  if (!raw) {
    throw new Error('API_URL no está configurada en el entorno del servidor');
  }
  return raw.replace(/\/?api\/?$/, '');
}

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const backend = getBackendBaseUrl();
  const targetUrl = `${backend}/${(params.path || []).join('/')}`;

  const headers = new Headers(req.headers);
  // Asegurar encabezados adecuados
  headers.set('host', new URL(backend).host);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const resp = await fetch(targetUrl, init);

  const respHeaders = new Headers(resp.headers);
  // Pasar headers útiles
  respHeaders.set('x-proxied-by', 'next-proxy');

  const body = await resp.arrayBuffer();
  return new NextResponse(body, {
    status: resp.status,
    headers: respHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;


