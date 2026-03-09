import { NextResponse } from 'next/server';

const defaultBackendBaseUrl = 'http://127.0.0.1:8000';

function getBackendBaseUrl() {
  return (process.env.ADMIN_API_BASE_URL?.trim() || defaultBackendBaseUrl).replace(/\/+$/, '');
}

function getAdminApiKey() {
  return process.env.ADMIN_API_KEY?.trim() || '';
}

async function proxyToBackend(method: 'GET' | 'POST', body?: string) {
  const adminApiKey = getAdminApiKey();
  if (!adminApiKey) {
    return NextResponse.json(
      { detail: 'Missing ADMIN_API_KEY for the admin frontend. Add it to frontend/admin/.env.local.' },
      { status: 500 },
    );
  }

  const response = await fetch(`${getBackendBaseUrl()}/v1/admin/users`, {
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
}

export async function GET() {
  try {
    return await proxyToBackend('GET');
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to load users from backend.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await proxyToBackend('POST', await request.text());
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to create user.' },
      { status: 500 },
    );
  }
}