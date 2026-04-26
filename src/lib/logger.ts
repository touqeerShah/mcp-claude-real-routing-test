import fs from 'node:fs';
import path from 'node:path';

export type ToolEvent = {
  ts: string;
  architecture: string;
  visible_tool_called: string;
  internal_tool_called: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
  routing?: unknown;
};

const runDir = process.env.MCP_TEST_RUN_DIR || path.join(process.cwd(), 'runs', 'current');
fs.mkdirSync(runDir, { recursive: true });
const logFile = path.join(runDir, 'mcp-tool-events.jsonl');

export function logToolEvent(event: ToolEvent) {
  fs.appendFileSync(logFile, JSON.stringify(event) + '\n');
}

export function getRunDir() {
  return runDir;
}
