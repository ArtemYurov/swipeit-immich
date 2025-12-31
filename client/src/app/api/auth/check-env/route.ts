import { NextResponse } from 'next/server';

export async function GET() {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const serverUrl = process.env.NEXT_PUBLIC_IMMICH_SERVER_URL;

    // 1. If Access Token is already provided in Env, we can just return it (though client can see it too)
    // This is just a fallback helper.
    if (process.env.NEXT_PUBLIC_IMMICH_ACCESS_TOKEN) {
        return NextResponse.json({
            accessToken: process.env.NEXT_PUBLIC_IMMICH_ACCESS_TOKEN,
            serverUrl: serverUrl,
        });
    }

    // 2. Try to login with Email/Password if available
    if (email && password && serverUrl) {
        try {
            // Normalize URL
            let baseUrl = serverUrl.replace(/\/$/, '');
            if (baseUrl.endsWith('/api')) {
                baseUrl = baseUrl.slice(0, -4);
            }

            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                console.error('Auto-login from env failed:', response.statusText);
                return NextResponse.json({ error: 'Login failed' }, { status: 401 });
            }

            const data = await response.json();

            if (data.accessToken) {
                return NextResponse.json({
                    accessToken: data.accessToken,
                    serverUrl: serverUrl,
                });
            }
        } catch (error) {
            console.error('Auto-login error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'No credentials found' }, { status: 404 });
}
