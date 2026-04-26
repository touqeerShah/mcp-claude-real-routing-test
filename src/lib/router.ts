import { TOOL_REGISTRY } from "./tool-registry.js";
import { extractParams } from "./param-extract.js";

const KEYWORDS: Record<string, string[]> = {
  get_weather_details: ["weather", "forecast", "city"],
  get_stock_details: ["stock", "ticker", "share", "quote", "aapl", "msft"],
  get_crypto_details: ["crypto", "btc", "eth", "bitcoin", "ethereum"],
  get_invoice_details: ["invoice", "inv-"],
  get_customer_details: ["customer", "cust-"],
  get_order_status: ["order", "ord-"],
  get_product_details: ["product", "sku"],
  get_database_status: ["database", "postgres", "mysql", "migration"],
  get_server_health: ["server", "health", "cpu", "memory", "uptime"],
  get_recent_logs: ["logs", "log", "service"],
  get_git_branch_info: ["branch", "git", "repo"],
  get_pull_request_info: ["pr", "pull request", "repo"],
  get_docker_container_status: ["docker", "container"],
  get_kubernetes_pod_status: ["kubernetes", "pod", "namespace", "k8s"],
  get_user_profile: ["user profile", "user-"],
  get_payment_status: ["payment", "pay-"],
  get_ticket_status: ["ticket", "tick-"],
  get_calendar_events: ["calendar", "events", "date"],
  get_document_summary: ["summarize", "summary", "document", "doc-"],
  get_vector_search_results: [
    "search documents",
    "semantic search",
    "indexed documents",
  ],
};

function score(toolName: string, query: string) {
  const q = query.toLowerCase();
  let s = 0;
  for (const kw of KEYWORDS[toolName] ?? []) {
    if (q.includes(kw)) s += kw.length > 4 ? 3 : 2;
  }
  const spec = TOOL_REGISTRY.find((t) => t.name === toolName)!;
  for (const ex of spec.examples ?? []) {
    for (const token of ex.toLowerCase().split(/\W+/).filter(Boolean)) {
      if (q.includes(token)) s += 1;
    }
  }
  return s;
}

export function routeQuery(query: string, allowedToolNames?: Set<string>) {
  const candidates = TOOL_REGISTRY.filter(
    (t) => !allowedToolNames || allowedToolNames.has(t.name),
  )
    .map((t) => ({ tool: t.name, score: score(t.name, query) }))
    .sort((a, b) => b.score - a.score);
  const selected = candidates[0]?.tool ?? "get_vector_search_results";
  const params = extractParams(selected, query);
  return {
    selected_tool: selected,
    params,
    confidence: Math.min(0.99, Math.max(0.1, (candidates[0]?.score ?? 1) / 12)),
    candidates: candidates.slice(0, 5),
    reason: `Selected ${selected} because it had the highest score based on keyword matches and example overlaps.`,
  };
}
