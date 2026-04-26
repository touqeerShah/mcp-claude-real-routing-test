import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ToolSpec } from './tool-registry.js';
import { executeFakeTool } from './fake-tools.js';
import { logToolEvent } from './logger.js';

export function shapeFor(spec: ToolSpec): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, type] of Object.entries(spec.params)) {
    shape[key] = type === 'number' ? z.number() : z.string();
  }
  return shape;
}

export function registerDirectTool(server: McpServer, architecture: string, spec: ToolSpec) {
  server.tool(spec.name, spec.description, shapeFor(spec), async (args) => {
    const start = performance.now();
    const output = await executeFakeTool(spec.name, args as Record<string, unknown>);
    const duration_ms = Number((performance.now() - start).toFixed(2));
    logToolEvent({
      ts: new Date().toISOString(),
      architecture,
      visible_tool_called: spec.name,
      internal_tool_called: spec.name,
      input: args,
      output,
      duration_ms
    });
    return { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] };
  });
}

export async function runServer(server: McpServer) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
