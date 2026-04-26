import { TOOL_REGISTRY } from './tool-registry.js';

export type ToolResult = {
  ok: true;
  tool: string;
  params: Record<string, unknown>;
  data: Record<string, unknown>;
};

export async function executeFakeTool(toolName: string, params: Record<string, unknown>): Promise<ToolResult> {
  const spec = TOOL_REGISTRY.find(t => t.name === toolName);
  if (!spec) throw new Error(`Unknown internal tool: ${toolName}`);
  return {
    ok: true,
    tool: toolName,
    params,
    data: {
      message: `Fake ${toolName} result`,
      received_params: params,
      stable_test_value: `${toolName}:success`
    }
  };
}
