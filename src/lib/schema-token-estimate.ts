import fs from 'node:fs';
import path from 'node:path';
import { CORE_DIRECT_TOOLS, TOOL_REGISTRY } from './tool-registry.js';

function approxTokens(s: string) { return Math.ceil(s.length / 4); }
function schemaFor(names: string[]) {
  return JSON.stringify(TOOL_REGISTRY.filter(t => names.includes(t.name)).map(t => ({ name: t.name, description: t.description, input_schema: t.params })), null, 2);
}
const direct = schemaFor(TOOL_REGISTRY.map(t => t.name));
const router = JSON.stringify([{ name: 'tool_router', description: 'Route user query to best hidden internal tool', input_schema: { query: 'string' } }], null, 2);
const hybrid = schemaFor(TOOL_REGISTRY.filter(t => CORE_DIRECT_TOOLS.has(t.name)).map(t => t.name)) + '\n' + router;

const report = {
  note: 'Static approximation only. Real Claude Code input/output/cache tokens require OpenTelemetry.',
  direct_20_tools_schema_chars: direct.length,
  direct_20_tools_schema_token_estimate: approxTokens(direct),
  semantic_router_schema_chars: router.length,
  semantic_router_schema_token_estimate: approxTokens(router),
  hybrid_schema_chars: hybrid.length,
  hybrid_schema_token_estimate: approxTokens(hybrid)
};
fs.mkdirSync(path.join(process.cwd(), 'output'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'output', 'schema-token-estimate.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
