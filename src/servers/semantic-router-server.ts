import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { routeQuery } from "../lib/router.js";
import { executeFakeTool } from "../lib/fake-tools.js";
import { logToolEvent } from "../lib/logger.js";
import { runServer } from "../lib/mcp-helpers.js";

const server = new McpServer({
  name: "semantic-router",
  version: "3.0.0",
});

server.tool(
  "tool_router",
  "Route a user query to the best hidden internal tool, execute it, and return the final result.",
  {
    query: z.string(),
  },
  async ({ query }) => {
    const start = performance.now();

    const routing = routeQuery(query);
    const output = await executeFakeTool(routing.selected_tool, routing.params);

    const duration_ms = Number((performance.now() - start).toFixed(2));

    const responsePayload = {
      step: "router_discovery_and_execution_complete",
      selected_tool: routing.selected_tool,
      params: routing.params,
      confidence: routing.confidence,
      reason: routing.reason,
      execution_status: "executed",
      final_tool_result: output,
    };

    logToolEvent({
      ts: new Date().toISOString(),
      architecture: "semantic_router_one_call",
      visible_tool_called: "tool_router",
      internal_tool_called: routing.selected_tool,
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

await runServer(server);