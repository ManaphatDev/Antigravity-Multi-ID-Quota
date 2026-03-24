import { getAllAccounts, updateAccount } from '../data/accounts.js';

export const config = {
  api: { bodyParser: false }, // Disable Vercel's default body parser to handle raw streams
};

export default async function handler(req, res) {
  // 1. Enable CORS for all clients (SillyTavern, Custom Apps, etc.)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Parse Provider and Endpoint from URL
  // In Vercel, [...path] catches all sub-routes into an array
  const { path } = req.query;
  if (!path || path.length < 2) {
    return res.status(400).json({ error: 'Invalid proxy path. Usage: /api/proxy/[provider]/[endpoint]' });
  }

  const providerName = path[0].toLowerCase(); // e.g., 'gemini', 'claude', 'ollama'
  const endpointPath = path.slice(1).join('/');

  // 3. Load Balancing: Pick an active account
  const accounts = await getAllAccounts();
  const availableAccounts = accounts.filter(a => a.status === 'active' && a.provider === providerName);

  if (availableAccounts.length === 0) {
    return res.status(503).json({ error: `Antigravity Error: No active accounts available for provider '${providerName}'` });
  }

  // Pick randomly (Round-robin can be implemented later)
  const account = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];

  // 4. Construct Upstream Request
  let upstreamUrl = '';
  const headers = { ...req.headers };
  
  // Clean up identifying proxy headers
  delete headers.host;
  delete headers.connection;
  delete headers['x-real-ip'];
  delete headers['x-forwarded-for'];
  delete headers['x-forwarded-proto'];
  delete headers['x-forwarded-host'];
  delete headers['x-forwarded-port'];

  // Inject hidden API Credentials
  if (providerName === 'gemini') {
    upstreamUrl = `https://generativelanguage.googleapis.com/${endpointPath}`;
    headers['x-goog-api-key'] = account.credential; // Gemini uses Header
  } else if (providerName === 'claude') {
    upstreamUrl = `https://api.anthropic.com/${endpointPath}`;
    headers['x-api-key'] = account.credential; // Claude uses Header
  } else if (providerName === 'ollama') {
    upstreamUrl = `${account.credential.replace(/\/$/, '')}/${endpointPath}`; // Ollama uses direct root URL
  } else {
    return res.status(400).json({ error: `Unsupported provider: ${providerName}` });
  }

  // Preserve query strings (e.g. ?key=xxx if not using header)
  const targetUrl = new URL(upstreamUrl);
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') targetUrl.searchParams.append(key, value);
  }

  // Forward request body as raw stream
  let bodyData = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    bodyData = Buffer.concat(chunks);
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers,
      body: bodyData,
      keepalive: true,
    };

    const response = await fetch(targetUrl.toString(), fetchOptions);

    // 5. Usage Tracking (MVP)
    // For a fully scalable backend, we would parse response chunks to read EXACT tokens.
    // For demonstration, we simply deduct 1 Flow and roughly 150 prompt tokens per successful proxy request.
    if (response.ok) {
      const currentPrompt = account.credits.prompt.current;
      const currentFlow = account.credits.flow.current;
      
      await updateAccount(account.id, {
        credits: {
          ...account.credits,
          prompt: { ...account.credits.prompt, current: Math.min(currentPrompt + 150, account.credits.prompt.max) },
          flow: { ...account.credits.flow, current: Math.min(currentFlow + 1, account.credits.flow.max) },
        }
      });
    }

    // 6. Return Streaming Response to Client
    res.status(response.status);
    response.headers.forEach((value, key) => {
      // Vercel handles chunked encoding, we must NOT manually pass content-encoding back
      const lk = key.toLowerCase();
      if (lk !== 'content-encoding' && lk !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }

  } catch (err) {
    console.error('Antigravity Proxy Fetch Error:', err);
    res.status(500).json({ error: 'Proxy Upstream Fetch Error' });
  }
}
