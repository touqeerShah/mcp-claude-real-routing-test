import fs from 'node:fs';
import path from 'node:path';
import { TEST_CASES } from './tool-registry.js';

const runRoot = process.argv[2] || path.join(process.cwd(), 'runs');
const expectedByTool = new Map(TEST_CASES.map(t => [t.expected_tool, t]));

function readEvents(file: string) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function paramsMatch(expected: Record<string, unknown>, actual: Record<string, unknown>) {
  for (const [k, v] of Object.entries(expected)) {
    if (String(actual?.[k]) !== String(v)) return false;
  }
  return true;
}

const rows: any[] = [];
const dirs = fs.existsSync(runRoot) ? fs.readdirSync(runRoot).filter(d => fs.statSync(path.join(runRoot, d)).isDirectory()) : [];
for (const d of dirs) {
  const file = path.join(runRoot, d, 'mcp-tool-events.jsonl');
  for (const e of readEvents(file)) {
    const expected = expectedByTool.get(e.internal_tool_called);
    const actualParams = e.output?.params ?? e.routing?.params ?? {};
    rows.push({
      run: d,
      architecture: e.architecture,
      visible_tool_called: e.visible_tool_called,
      internal_tool_called: e.internal_tool_called,
      expected_tool_matchable: Boolean(expected),
      params_correct_for_expected_tool: expected ? paramsMatch(expected.expected_params as any, actualParams) : false,
      duration_ms: e.duration_ms,
      input: e.input,
      params: actualParams
    });
  }
}

const byArch = new Map<string, any[]>();
for (const r of rows) {
  if (!byArch.has(r.architecture)) byArch.set(r.architecture, []);
  byArch.get(r.architecture)!.push(r);
}

const summary = [...byArch.entries()].map(([arch, list]) => {
  const correctParams = list.filter(r => r.params_correct_for_expected_tool).length;
  return {
    architecture: arch,
    observed_tool_calls: list.length,
    unique_internal_tools_called: new Set(list.map(r => r.internal_tool_called)).size,
    correct_params_among_observed: correctParams,
    avg_mcp_tool_latency_ms: Number((list.reduce((a, b) => a + Number(b.duration_ms || 0), 0) / Math.max(1, list.length)).toFixed(2)),
    visible_tools_used: [...new Set(list.map(r => r.visible_tool_called))]
  };
});

fs.mkdirSync(path.join(process.cwd(), 'output'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'output', 'observed-mcp-events.json'), JSON.stringify(rows, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'output', 'observed-summary.json'), JSON.stringify(summary, null, 2));

let md = '# Real Claude Code MCP Observed Report\n\n';
md += 'This report is based on actual MCP tool calls logged by the MCP servers while Claude Code was using them. It is not a synthetic local benchmark.\n\n';
md += '| Architecture | Observed Tool Calls | Unique Internal Tools | Correct Params Among Observed | Avg MCP Tool Latency MS | Visible Tools Used |\n';
md += '|---|---:|---:|---:|---:|---|\n';
for (const s of summary) {
  md += `| ${s.architecture} | ${s.observed_tool_calls} | ${s.unique_internal_tools_called} | ${s.correct_params_among_observed} | ${s.avg_mcp_tool_latency_ms} | ${s.visible_tools_used.join(', ')} |\n`;
}
md += '\n## Important\n\n';
md += 'This report proves which MCP tools Claude Code actually called. For API token metrics, enable Claude Code OpenTelemetry as described in docs/claude-code-real-token-measurement.md.\n';
fs.writeFileSync(path.join(process.cwd(), 'output', 'real-claude-code-observed-report.md'), md);
console.log(md);
