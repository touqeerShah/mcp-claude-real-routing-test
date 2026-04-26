import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

export type ClaudeContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "thinking";
      thinking: string;
      signature?: string;
    }
  | {
      type: "redacted_thinking";
      data: string;
    }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string | Array<{ type: "text"; text: string }>;
      is_error?: boolean;
    };

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
};

export type ClaudeTool = {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
};

export type ClaudeResponse = {
  id?: string;
  type?: string;
  role?: "assistant";
  model?: string;
  content: ClaudeContentBlock[];
  stop_reason?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  raw: unknown;
};

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "eu-central-1",
});

function normalizeBedrockModelResponse(raw: any): ClaudeResponse {
  return {
    id: raw.id,
    type: raw.type,
    role: raw.role,
    model: raw.model,
    content: raw.content ?? [],
    stop_reason: raw.stop_reason,
    usage: raw.usage,
    raw,
  };
}

async function readBedrockStream(responseStream: any): Promise<any> {
  let finalMessage: any = null;
  const contentBlocks: any[] = [];
  let usage: any = {};

  for await (const event of responseStream) {
    if (!event.chunk?.bytes) continue;

    const json = JSON.parse(Buffer.from(event.chunk.bytes).toString("utf8"));

    if (json.type === "message_start") {
      finalMessage = json.message;
    }

    if (json.type === "content_block_start") {
      contentBlocks[json.index] = json.content_block;
    }

    if (json.type === "content_block_delta") {
      const block = contentBlocks[json.index];

      if (!block) continue;

      if (json.delta?.type === "text_delta") {
        block.text = (block.text ?? "") + json.delta.text;
      }

      if (json.delta?.type === "thinking_delta") {
        block.thinking = (block.thinking ?? "") + json.delta.thinking;
      }

      if (json.delta?.type === "input_json_delta") {
        block.__partial_json = (block.__partial_json ?? "") + json.delta.partial_json;
      }
    }

    if (json.type === "content_block_stop") {
      const block = contentBlocks[json.index];

      if (block?.type === "tool_use" && block.__partial_json) {
        try {
          block.input = JSON.parse(block.__partial_json);
        } catch {
          block.input = {};
        }

        delete block.__partial_json;
      }
    }

    if (json.type === "message_delta") {
      usage = {
        ...usage,
        ...(json.usage ?? {}),
      };

      if (finalMessage) {
        finalMessage.stop_reason = json.delta?.stop_reason;
      }
    }

    if (json.type === "message_stop") {
      // done
    }
  }

  return {
    ...(finalMessage ?? {}),
    content: contentBlocks.filter(Boolean),
    usage,
  };
}

export async function invokeClaudeOnBedrock(args: {
  modelId: string;
  messages: ClaudeMessage[];
  tools: ClaudeTool[];
  maxTokens?: number;
  thinking?: {
    enabled: boolean;
    budgetTokens: number;
  };
}): Promise<ClaudeResponse> {
  const body: any = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: args.maxTokens ?? 4096,
    messages: args.messages,
    tools: args.tools,
  };

  if (args.thinking?.enabled) {
    body.thinking = {
      type: "enabled",
      budget_tokens: args.thinking.budgetTokens,
    };
  }

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: args.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);

  if (!response.body) {
    throw new Error("Bedrock returned no response body");
  }

  const raw = await readBedrockStream(response.body);

  return normalizeBedrockModelResponse(raw);
}

export function usageTotal(usage: ClaudeResponse["usage"]) {
  return {
    input_tokens: Number(usage?.input_tokens ?? 0),
    output_tokens: Number(usage?.output_tokens ?? 0),
    cache_read_tokens: Number(usage?.cache_read_input_tokens ?? 0),
    cache_creation_tokens: Number(usage?.cache_creation_input_tokens ?? 0),
    total_tokens:
      Number(usage?.input_tokens ?? 0) +
      Number(usage?.output_tokens ?? 0) +
      Number(usage?.cache_read_input_tokens ?? 0) +
      Number(usage?.cache_creation_input_tokens ?? 0),
  };
}