import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TOOL_REGISTRY } from '../lib/tool-registry.js';
import { registerDirectTool, runServer } from '../lib/mcp-helpers.js';

const server = new McpServer({ name: 'direct-20-tools', version: '3.0.0' });
for (const spec of TOOL_REGISTRY) registerDirectTool(server, 'direct_20_tools', spec);
await runServer(server);
