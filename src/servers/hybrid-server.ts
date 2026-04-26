import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CORE_DIRECT_TOOLS, TOOL_REGISTRY } from '../lib/tool-registry.js';
import { registerDirectTool, runServer } from '../lib/mcp-helpers.js';
import { routeQuery } from '../lib/router.js';
import { executeFakeTool } from '../lib/fake-tools.js';
import { logToolEvent } from '../lib/logger.js';

const server = new McpServer({ name: 'hybrid-tools-router', version: '3.0.0' });

for (const spec of TOOL_REGISTRY.filter(t => CORE_DIRECT_TOOLS.has(t.name))) {
  registerDirectTool(server, 'hybrid', spec);
}

server.tool(
  'tool_router',
  'Route uncommon or long-tail business/system queries to hidden internal tools. Use direct visible tools first when a specific visible tool matches.',
  { query: z.string() },
  async ({ query }) => {
    const start = performance.now();
    const hidden = new Set(TOOL_REGISTRY.filter(t => !CORE_DIRECT_TOOLS.has(t.name)).map(t => t.name));
    const routing = routeQuery(query, hidden);
    const output = await executeFakeTool(routing.selected_tool, routing.params);
    const duration_ms = Number((performance.now() - start).toFixed(2));
    logToolEvent({
      ts: new Date().toISOString(),
      architecture: 'hybrid',
      visible_tool_called: 'tool_router',
      internal_tool_called: routing.selected_tool,
      input: { query },
      output,
      duration_ms,
      routing
    });
    return { content: [{ type: 'text', text: JSON.stringify({ routing, result: output }, null, 2) }] };
  }
);

await runServer(server);
