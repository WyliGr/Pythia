import { error, type RequestHandler } from '@sveltejs/kit';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createPythiaMcpServer } from '$lib/server/mcp';

/**
 * Stateless MCP endpoint. Any scope combination works: each tool re-checks
 * ownership; write tools additionally require a key with forms:write,
 * get_responses requires responses:read.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.apiKey) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Missing API key. Use Authorization: Bearer pk_…' }, id: null },
      { status: 401 }
    );
  }
  const server = createPythiaMcpServer(locals.apiKey);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  // No server.close() here: the response streams SSE asynchronously and the
  // stateless transport cleans itself up when the stream ends.
  return transport.handleRequest(request);
};

export const GET: RequestHandler = async () => {
  error(405, 'MCP endpoint is POST-only (stateless streamable HTTP).');
};
