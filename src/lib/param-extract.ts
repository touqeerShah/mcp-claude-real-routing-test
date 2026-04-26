export function extractParams(toolName: string, query: string): Record<string, unknown> {
  const q = query;
  const first = (...patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = q.match(p);
      if (m?.[1]) return m[1];
    }
    return undefined;
  };
  switch (toolName) {
    case 'get_weather_details': return { city: first(/weather in ([A-Za-z -]+)/i, /forecast for ([A-Za-z -]+)/i) ?? 'unknown' };
    case 'get_stock_details': return { ticker: first(/for ([A-Z]{1,6})\b/, /\b([A-Z]{1,6}) quote\b/) ?? 'UNKNOWN' };
    case 'get_crypto_details': return { symbol: first(/\b(BTC|ETH|SOL|DOGE|XRP)\b/i) ?? 'UNKNOWN' };
    case 'get_invoice_details': return { invoice_id: first(/\b(INV-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_customer_details': return { customer_id: first(/\b(CUST-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_order_status': return { order_id: first(/\b(ORD-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_product_details': return { sku: first(/\b(SKU-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_database_status': return { database_name: first(/\b(postgres|mysql|redis|mongodb|sqlite)\b/i) ?? 'default' };
    case 'get_server_health': return { server_name: first(/health of ([A-Za-z0-9_.-]+)/i) ?? 'unknown' };
    case 'get_recent_logs': return { service_name: first(/logs for ([A-Za-z0-9_.-]+)/i) ?? 'unknown' };
    case 'get_git_branch_info': return { repo_name: first(/repo ([A-Za-z0-9_.-]+)/i) ?? 'unknown' };
    case 'get_pull_request_info': return { repo_name: first(/repo ([A-Za-z0-9_.-]+)/i) ?? 'unknown', pr_number: Number(first(/PR\s+(\d+)/i) ?? 0) };
    case 'get_docker_container_status': return { container_name: first(/container ([A-Za-z0-9_.-]+)/i) ?? 'unknown' };
    case 'get_kubernetes_pod_status': return { namespace: first(/namespace ([A-Za-z0-9_.-]+)/i) ?? 'default', pod_name: first(/pod ([A-Za-z0-9_.-]+)/i) ?? 'unknown' };
    case 'get_user_profile': return { user_id: first(/\b(USER-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_payment_status': return { payment_id: first(/\b(PAY-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_ticket_status': return { ticket_id: first(/\b(TICK-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_calendar_events': return { date: first(/\b(\d{4}-\d{2}-\d{2})\b/) ?? 'unknown' };
    case 'get_document_summary': return { document_id: first(/\b(DOC-[A-Z0-9-]+)\b/i) ?? 'unknown' };
    case 'get_vector_search_results': return { query: q.replace(/^search documents for\s+/i, '').trim() };
    default: return { query };
  }
}
