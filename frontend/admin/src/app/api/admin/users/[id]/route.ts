import { NextResponse } from 'next/server';

const defaultBackendBaseUrl = 'http://127.0.0.1:8000';

function getBackendBaseUrl() {
  return (process.env.ADMIN_API_BASE_URL?.trim() || defaultBackendBaseUrl).replace(/\/+$/, '');
}

function getAdminApiKey() {
  return process.env.ADMIN_API_KEY?.trim() || '';
}

async function proxyRequest(method: 'PUT' | 'DELETE', request: Request, params: { id: string }) {
  try {
    const adminApiKey = getAdminApiKey();
    if (!adminApiKey) {
      return NextResponse.json(
        { detail: 'Missing ADMIN_API_KEY for the admin frontend. Add it to frontend/admin/.env.local.' },
        { status: 500 },
      );
    }

    const resolvedParams = await Promise.resolve(params as { id?: string });
    const userId = (resolvedParams?.id || '').trim();
    if (!userId || userId === 'undefined') {
      return NextResponse.json({ detail: 'Invalid user id in request path.' }, { status: 400 });
    }
    const body = method === 'PUT' ? await request.text() : undefined;

    const response = await fetch(`${getBackendBaseUrl()}/v1/admin/users/${userId}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-API-Key': adminApiKey,
      },
      body,
      cache: 'no-store',
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = { detail: 'Backend did not return JSON.' };
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : `Unable to ${method === 'PUT' ? 'update' : 'delete'} user.` },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return proxyRequest('PUT', request, params);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return proxyRequest('DELETE', request, params);
}
