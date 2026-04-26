import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { routeQuery } from "../lib/router.js";
import { executeFakeTool } from "../lib/fake-tools.js";
import { logToolEvent } from "../lib/logger.js";
import { runServer } from "../lib/mcp-helpers.js";

const server = new McpServer({
  name: "semantic-router-two-step",
  version: "3.0.0",
});

server.tool(
  "discover_tool",
  "Use this first. Finds the best hidden internal tool for the user's request. It returns selected_tool, confidence, reason, and extracted params. This tool does not execute the internal tool.",
  {
    query: z.string(),
  },
  async ({ query }) => {
    const start = performance.now();

    const routing = routeQuery(query);

    const duration_ms = Number((performance.now() - start).toFixed(2));

    const responsePayload = {
      step: "tool_discovery_only",
      instruction:
        "Now call execute_tool using exactly selected_tool as tool_name and exactly params as params.",
      selected_tool: routing.selected_tool,
      confidence: routing.confidence,
      reason: routing.reason,
      params: routing.params,
    };

    logToolEvent({
      ts: new Date().toISOString(),
      architecture: "semantic_router_two_step",
      visible_tool_called: "discover_tool",
      internal_tool_called: "discover_tool",
      input: { query },
      output: responsePayload,
      duration_ms,
      routing,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(responsePayload, null, 2),
        },
      ],
    };
  },
);

server.tool(
  "execute_tool",
  "Use this after discover_tool. Executes the hidden internal tool selected by discover_tool. Use the exact tool_name and params returned by discover_tool.",
  {
    tool_name: z.string(),
    params: z.record(z.string(), z.unknown()),
  },
  async ({ tool_name, params }) => {
    const start = performance.now();

    const output = await executeFakeTool(tool_name, params);

    const duration_ms = Number((performance.now() - start).toFixed(2));

    const responsePayload = {
      step: "tool_execution_complete",
      executed_tool: tool_name,
      execution_status: "executed",
      final_tool_result: output,
    };

    logToolEvent({
      ts: new Date().toISOString(),
      architecture: "semantic_router_two_step",
      visible_tool_called: "execute_tool",
      internal_tool_called: tool_name,
      input: { tool_name, params },
      output: responsePayload,
      duration_ms,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(responsePayload, null, 2),
        },
      ],
    };
  }
);

await runServer(server);
