import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export type StartedMcpClient = {
  client: Client;
  close: () => Promise<void>;
};

export async function startMcpClient(args: {
  name: string;
  command: string;
  args: string[];
}): Promise<StartedMcpClient> {
  const transport = new StdioClientTransport({
    command: args.command,
    args: args.args,
  });

  const client = new Client({
    name: `benchmark-client-${args.name}`,
    version: "1.0.0",
  });

  await client.connect(transport);

  return {
    client,
    close: async () => {
      await client.close();
    },
  };
}

export async function listMcpTools(client: Client) {
  const result = await client.listTools();

  return result.tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    input_schema: tool.inputSchema as Record<string, unknown>,
  }));
}

export async function callMcpTool(
  client: Client,
  name: string,
  input: Record<string, unknown>,
) {
  return await client.callTool({
    name,
    arguments: input,
  });
}