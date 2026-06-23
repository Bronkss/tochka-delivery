// api/ping.ts

export function GET() {
    return Response.json({
        ok: true,
        source: 'vercel-api',
        time: new Date().toISOString(),
    });
}