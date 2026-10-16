export const config = {
  runtime: 'edge',
};

/**
 * Vercel Edge API Proxy
 * Routes browser requests from any Vercel domain to the live Render backend
 * while attaching the whitelisted origin header to prevent Spring Boot CORS 403 rejections.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Handle CORS preflight OPTIONS requests directly at the edge
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || '*';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Forward to live Render backend
  const targetUrl = `https://codingplatform-tdt0.onrender.com${url.pathname}${url.search}`;

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.set('host', 'codingplatform-tdt0.onrender.com');
  // Inject the backend-whitelisted origin so Spring Security accepts the request
  forwardHeaders.set('origin', 'https://connect-2-code.vercel.app');

  try {
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'follow',
    });

    const clientOrigin = req.headers.get('origin') || '*';
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', clientOrigin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        statusCode: 502,
        message: 'Backend connection failed or server is waking up from sleep mode.',
        errors: [err?.message || 'Proxy connection error'],
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
}
