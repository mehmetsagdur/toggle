import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(
    request: NextRequest,
    path: string[]
): Promise<NextResponse> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const targetPath = path.join('/');
    const targetUrl = `${backendUrl}/${targetPath}`;

    try {
        const headers = new Headers(request.headers);
        headers.delete('host');

        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: request.method !== 'GET' && request.method !== 'HEAD'
                ? await request.text()
                : undefined,
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete('transfer-encoding');
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error(`Proxy error to ${targetUrl}:`, error);
        return NextResponse.json(
            { error: 'Backend unavailable', target: targetUrl },
            { status: 502 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
    const { path } = await params;
    return proxyRequest(request, path);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
    const { path } = await params;
    return proxyRequest(request, path);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
    const { path } = await params;
    return proxyRequest(request, path);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
    const { path } = await params;
    return proxyRequest(request, path);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
    const { path } = await params;
    return proxyRequest(request, path);
}
