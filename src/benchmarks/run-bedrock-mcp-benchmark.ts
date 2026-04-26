import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  invokeClaudeOnBedrock,
  usageTotal,
  type ClaudeMessage,
  type ClaudeResponse,
} from "../lib/bedrock-claude-client.js";
import {
  callMcpTool,
  listMcpTools,
  startMcpClient,
} from "../lib/mcp-stdio-client.js";

const prompts = [
  "What is the weather in Berlin? Use the available tools.",
  "Check stock price for AAPL. Use the available tools.",
  "Show BTC price details. Use the available tools.",
  "Get invoice INV-9001. Use the available tools.",
  "Find customer CUST-301. Use the available tools.",
  "Check order ORD-1001. Use the available tools.",
  "Tell me details for product SKU-ABC-44. Use the available tools.",
  "Is postgres healthy? Use the available tools.",
  "Check health of api-server-1. Use the available tools.",
  "Show recent logs for auth-service. Use the available tools.",
  "What branch is repo trace-ui on? Use the available tools.",
  "Check PR 42 in repo mcp-router. Use the available tools.",
  "Is docker container redis-cache running? Use the available tools.",
  "Check pod trace-api-7d9 in namespace production. Use the available tools.",
  "Get user profile USER-88. Use the available tools.",
  "Check payment PAY-7788. Use the available tools.",
  "What is the status of ticket TICK-222? Use the available tools.",
  "Show my events for 2026-04-24. Use the available tools.",
  "Summarize document DOC-555. Use the available tools.",
  "Search documents for MCP routing performance. Use the available tools.",
];

const architecture = process.argv[2];

if (!architecture) {
  console.error(
    "Usage: node dist/benchmarks/run-bedrock-mcp-benchmark.js <direct|router|hybrid>",
  );
  process.exit(1);
}

const modelId =
  process.env.BEDROCK_MODEL_ID ||
  process.env.ANTHROPIC_MODEL ||
  "eu.anthropic.claude-sonnet-4-20250514-v1:0";

const thinkingEnabled = process.env.BEDROCK_THINKING_ENABLED !== "false";
const thinkingBudgetTokens = Number(
  process.env.BEDROCK_THINKING_BUDGET_TOKENS || 1024,
);
function extractTextFromMcpResult(result: any): string {
  const content = result?.content;

  if (!Array.isArray(content)) {
    return JSON.stringify(result);
  }

  return content
    .map((block: any) => {
      if (block?.type === "text") return block.text;
      return JSON.stringify(block);
    })
    .join("\n");
}

function parseJsonFromMcpResult(result: any): any | null {
  const text = extractTextFromMcpResult(result);

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function serverForArchitecture(arch: string) {
  const root = process.cwd();

  if (arch === "direct") {
    return {
      name: "direct",
      command: "node",
      args: [path.join(root, "dist/servers/direct-tools-server.js")],
    };
  }

  if (arch === "router") {
    return {
      name: "router",
      command: "node",
      args: [path.join(root, "dist/servers/semantic-router-server.js")],
    };
  }

  if (arch === "two-step") {
    return {
      name: "two-step",
      command: "node",
      args: [path.join(root, "dist/servers/semantic-two-step-server.js")],
    };
  }

  if (arch === "hybrid") {
    return {
      name: "hybrid",
      command: "node",
      args: [path.join(root, "dist/servers/hybrid-server.js")],
    };
  }

  throw new Error(`Unknown architecture: ${arch}`);
}

function extractToolUses(response: ClaudeResponse) {
  return response.content.filter(
    (block: any) => block.type === "tool_use",
  ) as Array<{
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
}

function addUsage(target: any, usage: any) {
  const normalized = usageTotal(usage);

  target.input_tokens += normalized.input_tokens;
  target.output_tokens += normalized.output_tokens;
  target.cache_read_tokens += normalized.cache_read_tokens;
  target.cache_creation_tokens += normalized.cache_creation_tokens;
  target.total_tokens += normalized.total_tokens;
}

const outDir = path.join(process.cwd(), "runs", `${architecture}-bedrock`);
fs.mkdirSync(outDir, { recursive: true });

const mcp = await startMcpClient(serverForArchitecture(architecture));

try {
  const tools = await listMcpTools(mcp.client);

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const id = String(i + 1).padStart(2, "0");

    console.log(`[${architecture}] ${i + 1}/${prompts.length}: ${prompt}`);

    const started = performance.now();

    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content: prompt,
      },
    ];

    const tokenUsage = {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      total_tokens: 0,
    };

    const toolCalls: Array<{
      name: string;
      input: Record<string, unknown>;
      result: unknown;
      duration_ms: number;
      phase: "discovery" | "execution";
      forced_by_runner?: boolean;
    }> = [];

    const responses: unknown[] = [];

    let finalText = "";
    let stopReason: string | undefined;
    let error: string | null = null;

    try {
      for (let turn = 0; turn < 8; turn++) {
        const response = await invokeClaudeOnBedrock({
          modelId,
          messages,
          tools,
          maxTokens: 4096,
          thinking: {
            enabled: thinkingEnabled,
            budgetTokens: thinkingBudgetTokens,
          },
        });

        responses.push(response.raw);
        addUsage(tokenUsage, response.usage);

        // CRITICAL:
        // Keep assistant content exactly as returned.
        messages.push({
          role: "assistant",
          content: response.content,
        });

        const toolUses = extractToolUses(response);

        if (toolUses.length === 0) {
          finalText = response.content
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n");

          stopReason = response.stop_reason;
          break;
        }

        const toolResults = [];

        for (const toolUse of toolUses) {
          const toolStart = performance.now();

          const result = await callMcpTool(
            mcp.client,
            toolUse.name,
            toolUse.input,
          );

          const toolDurationMs = Number(
            (performance.now() - toolStart).toFixed(2),
          );

          toolCalls.push({
            name: toolUse.name,
            input: toolUse.input,
            result,
            duration_ms: toolDurationMs,
            phase: toolUse.name === "discover_tool" ? "discovery" : "execution",
          });

          let finalToolResultForModel: unknown = result;
          /**
           * Deterministic two-step benchmark:
           * If Claude called discover_tool, force execute_tool immediately.
           * This makes the run comparable with direct/hybrid because the actual internal tool executes.
           */
          if (architecture === "two-step" && toolUse.name === "discover_tool") {
            const discovery = parseJsonFromMcpResult(result);

            const selectedTool = discovery?.selected_tool;
            const params = discovery?.params ?? {};

            if (!selectedTool) {
              throw new Error(
                `discover_tool did not return selected_tool. Result: ${JSON.stringify(result)}`,
              );
            }

            const executeStart = performance.now();

            const executeResult = await callMcpTool(
              mcp.client,
              "execute_tool",
              {
                tool_name: selectedTool,
                params,
              },
            );

            const executeDurationMs = Number(
              (performance.now() - executeStart).toFixed(2),
            );

            toolCalls.push({
              name: "execute_tool",
              input: {
                tool_name: selectedTool,
                params,
              },
              result: executeResult,
              duration_ms: executeDurationMs,
              phase: "execution",
              forced_by_runner: true,
            });

            finalToolResultForModel = {
              discovery_result: result,
              forced_execution_result: executeResult,
              benchmark_note:
                "Benchmark runner forced execute_tool after discover_tool so routing and execution can both be measured.",
            };
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(finalToolResultForModel),
          });
        }

        messages.push({
          role: "user",
          content: toolResults as any,
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const duration_ms = Number((performance.now() - started).toFixed(2));

    const row = {
      architecture,
      index: i + 1,
      prompt,
      success: !error,
      error,
      duration_ms,
      token_usage: tokenUsage,
      tool_calls: toolCalls.map((call) => ({
        name: call.name,
        input: call.input,
        result: call.result,
        duration_ms: call.duration_ms,
        phase: call.phase,
        forced_by_runner: call.forced_by_runner ?? false,
      })),
      final_text: finalText,
      stop_reason: stopReason,
      modelId,
      thinking_enabled: thinkingEnabled,
      thinking_budget_tokens: thinkingBudgetTokens,
    };

    results.push(row);

    fs.writeFileSync(
      path.join(outDir, `bedrock-run-${id}.json`),
      JSON.stringify(
        {
          ...row,
          messages,
          responses,
          full_tool_calls: toolCalls,
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      path.join(outDir, "claude-code-benchmark-summary.json"),
      JSON.stringify(results, null, 2),
    );
  }

  console.log(`Done. Results written to ${outDir}`);
} finally {
  await mcp.close();
}
