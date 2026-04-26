import fs from "node:fs";
import path from "node:path";
import { runClaudePrompt } from "../lib/claude-code-runner.js";

const prompts = [
  "What is the weather in Berlin? Use the available MCP tools.",
  "Check stock price for AAPL. Use the available MCP tools.",
  "Show BTC price details. Use the available MCP tools.",
  "Get invoice INV-9001. Use the available MCP tools.",
  "Find customer CUST-301. Use the available MCP tools.",
  "Check order ORD-1001. Use the available MCP tools.",
  "Tell me details for product SKU-ABC-44. Use the available MCP tools.",
  "Is postgres healthy? Use the available MCP tools.",
  "Check health of api-server-1. Use the available MCP tools.",
  "Show recent logs for auth-service. Use the available MCP tools.",
  "What branch is repo trace-ui on? Use the available MCP tools.",
  "Check PR 42 in repo mcp-router. Use the available MCP tools.",
  "Is docker container redis-cache running? Use the available MCP tools.",
  "Check pod trace-api-7d9 in namespace production. Use the available MCP tools.",
  "Get user profile USER-88. Use the available MCP tools.",
  "Check payment PAY-7788. Use the available MCP tools.",
  "What is the status of ticket TICK-222? Use the available MCP tools.",
  "Show my events for 2026-04-24. Use the available MCP tools.",
  "Summarize document DOC-555. Use the available MCP tools.",
  "Search documents for MCP routing performance. Use the available MCP tools.",
];

const architecture = process.argv[2];

if (!architecture) {
  console.error(
    "Usage: node dist/benchmarks/run-claude-code-benchmark.js <architecture>",
  );
  process.exit(1);
}
const outDir = path.join(process.cwd(), "runs", architecture);
fs.mkdirSync(outDir, { recursive: true });

const results = [];

for (let i = 0; i < prompts.length; i++) {
  const prompt = prompts[i];
  const id = String(i + 1).padStart(2, "0");

  console.log(`\n[${architecture}] ${i + 1}/${prompts.length}: ${prompt}`);

  const result = await runClaudePrompt(prompt);

  fs.writeFileSync(
    path.join(outDir, `claude-run-${id}.stdout.log`),
    result.stdout,
  );

  fs.writeFileSync(
    path.join(outDir, `claude-run-${id}.stderr.log`),
    result.stderr,
  );

  results.push({
    architecture,
    index: i + 1,
    prompt,
    exitCode: result.exitCode,
    duration_ms: result.duration_ms,
    token_usage: result.token_usage,
  });

  fs.writeFileSync(
    path.join(outDir, `claude-run-${id}.json`),
    JSON.stringify(result, null, 2),
  );

  fs.writeFileSync(
    path.join(outDir, "claude-code-benchmark-summary.json"),
    JSON.stringify(results, null, 2),
  );
}

console.log(`\nDone. Results written to ${outDir}`);
