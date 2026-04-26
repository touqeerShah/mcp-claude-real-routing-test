export type ToolSpec = {
  name: string;
  description: string;
  params: string[];
  keywords?: string[];
  examples?: string[];
};

/**
 * Core 20 target tools used by the benchmark prompts.
 */
export const TOOL_20_REGISTRY: ToolSpec[] = [
  {
    name: "get_weather_details",
    description: "Returns weather details for a city.",
    params: ["city"],
    keywords: ["weather", "temperature", "forecast", "city"],
    examples: ["weather in Berlin", "forecast for Paris"],
  },
  {
    name: "get_stock_details",
    description: "Returns stock market details for a ticker symbol.",
    params: ["ticker"],
    keywords: ["stock", "ticker", "share", "market", "AAPL"],
    examples: ["stock price for AAPL", "MSFT quote"],
  },
  {
    name: "get_crypto_details",
    description: "Returns crypto price details for a symbol.",
    params: ["symbol"],
    keywords: ["crypto", "BTC", "ETH", "coin", "token"],
    examples: ["BTC price", "ETH crypto details"],
  },
  {
    name: "get_invoice_details",
    description: "Returns invoice status and amount by invoice ID.",
    params: ["invoice_id"],
    keywords: ["invoice", "INV", "billing"],
    examples: ["invoice INV-9001"],
  },
  {
    name: "get_customer_details",
    description: "Returns customer profile by customer ID.",
    params: ["customer_id"],
    keywords: ["customer", "CUST", "client"],
    examples: ["customer CUST-301"],
  },
  {
    name: "get_order_status",
    description: "Returns order delivery/payment status by order ID.",
    params: ["order_id"],
    keywords: ["order", "ORD", "delivery"],
    examples: ["order ORD-1001"],
  },
  {
    name: "get_product_details",
    description: "Returns product information by product SKU.",
    params: ["sku"],
    keywords: ["product", "SKU", "item"],
    examples: ["product SKU-ABC-44"],
  },
  {
    name: "get_database_status",
    description: "Returns database connection and migration status.",
    params: ["database_name"],
    keywords: ["database", "postgres", "mysql", "healthy"],
    examples: ["postgres healthy", "database status"],
  },
  {
    name: "get_server_health",
    description: "Returns server CPU, memory, uptime, and health status.",
    params: ["server_name"],
    keywords: ["server", "health", "cpu", "memory", "api-server"],
    examples: ["api-server-1 health"],
  },
  {
    name: "get_recent_logs",
    description: "Returns recent logs for a service.",
    params: ["service_name"],
    keywords: ["logs", "recent logs", "service", "auth-service"],
    examples: ["logs for auth-service"],
  },
  {
    name: "get_git_branch_info",
    description: "Returns current git branch and commit details.",
    params: ["repo_name"],
    keywords: ["git", "branch", "repo", "commit"],
    examples: ["branch for repo trace-ui"],
  },
  {
    name: "get_pull_request_info",
    description: "Returns pull request status by PR number.",
    params: ["repo_name", "pr_number"],
    keywords: ["PR", "pull request", "repo"],
    examples: ["PR 42 in repo mcp-router"],
  },
  {
    name: "get_docker_container_status",
    description: "Returns Docker container status by container name.",
    params: ["container_name"],
    keywords: ["docker", "container", "redis-cache", "running"],
    examples: ["container redis-cache running"],
  },
  {
    name: "get_kubernetes_pod_status",
    description: "Returns Kubernetes pod status by namespace and pod name.",
    params: ["namespace", "pod_name"],
    keywords: ["kubernetes", "k8s", "pod", "namespace"],
    examples: ["pod trace-api-7d9 namespace production"],
  },
  {
    name: "get_user_profile",
    description: "Returns user profile details by user ID.",
    params: ["user_id"],
    keywords: ["user", "profile", "USER"],
    examples: ["user USER-88"],
  },
  {
    name: "get_payment_status",
    description: "Returns payment status by payment ID.",
    params: ["payment_id"],
    keywords: ["payment", "PAY", "paid"],
    examples: ["payment PAY-7788"],
  },
  {
    name: "get_ticket_status",
    description: "Returns support ticket status by ticket ID.",
    params: ["ticket_id"],
    keywords: ["ticket", "TICK", "support"],
    examples: ["ticket TICK-222"],
  },
  {
    name: "get_calendar_events",
    description: "Returns calendar events for a date.",
    params: ["date"],
    keywords: ["calendar", "events", "date"],
    examples: ["events for 2026-04-24"],
  },
  {
    name: "get_document_summary",
    description: "Returns summary of a document by document ID.",
    params: ["document_id"],
    keywords: ["document", "summary", "DOC"],
    examples: ["document DOC-555"],
  },
  {
    name: "get_vector_search_results",
    description: "Searches indexed documents using a semantic query.",
    params: ["query"],
    keywords: ["search", "documents", "semantic", "vector"],
    examples: ["search documents for MCP routing performance"],
  },
];

/**
 * 40 extra tools for 60-tool benchmark.
 * These intentionally create realistic semantic overlap/distractors.
 */
export const EXTRA_60_DISTRACTOR_TOOLS: ToolSpec[] = [
  {
    name: "get_service_metrics",
    description: "Returns service metric counters such as request count, error count, and latency.",
    params: ["service_name"],
    keywords: ["metrics", "service", "latency", "errors"],
  },
  {
    name: "get_service_health",
    description: "Returns general service health and readiness status.",
    params: ["service_name"],
    keywords: ["service", "health", "ready", "alive"],
  },
  {
    name: "get_service_dependencies",
    description: "Returns upstream and downstream dependencies for a service.",
    params: ["service_name"],
    keywords: ["dependency", "service", "upstream", "downstream"],
  },
  {
    name: "get_error_rate",
    description: "Returns error rate for an application service.",
    params: ["service_name"],
    keywords: ["error", "rate", "service"],
  },
  {
    name: "get_latency_percentiles",
    description: "Returns p50, p95, and p99 latency percentiles for a service.",
    params: ["service_name"],
    keywords: ["latency", "p95", "p99", "percentile"],
  },
  {
    name: "get_deployment_status",
    description: "Returns deployment rollout status for an application.",
    params: ["deployment_name"],
    keywords: ["deployment", "rollout", "release"],
  },
  {
    name: "get_release_notes",
    description: "Returns release notes for a product or software version.",
    params: ["version"],
    keywords: ["release", "notes", "version"],
  },
  {
    name: "get_incident_status",
    description: "Returns current status of an incident by incident ID.",
    params: ["incident_id"],
    keywords: ["incident", "status", "outage"],
  },
  {
    name: "get_alert_status",
    description: "Returns alert status and severity by alert ID.",
    params: ["alert_id"],
    keywords: ["alert", "severity", "status"],
  },
  {
    name: "get_oncall_engineer",
    description: "Returns current on-call engineer for a team.",
    params: ["team_name"],
    keywords: ["oncall", "engineer", "team"],
  },
  {
    name: "get_team_members",
    description: "Returns members of an engineering or business team.",
    params: ["team_name"],
    keywords: ["team", "members", "people"],
  },
  {
    name: "get_repository_info",
    description: "Returns repository metadata such as owner, visibility, and default branch.",
    params: ["repo_name"],
    keywords: ["repository", "repo", "owner", "default branch"],
  },
  {
    name: "get_commit_details",
    description: "Returns commit author, timestamp, and message by commit SHA.",
    params: ["repo_name", "commit_sha"],
    keywords: ["commit", "sha", "git"],
  },
  {
    name: "get_build_status",
    description: "Returns CI build status for a repository.",
    params: ["repo_name", "build_id"],
    keywords: ["build", "ci", "status"],
  },
  {
    name: "get_test_results",
    description: "Returns test results for a build or pipeline.",
    params: ["build_id"],
    keywords: ["test", "results", "pipeline"],
  },
  {
    name: "get_pipeline_status",
    description: "Returns CI/CD pipeline status.",
    params: ["pipeline_id"],
    keywords: ["pipeline", "ci", "cd", "status"],
  },
  {
    name: "get_environment_config",
    description: "Returns environment configuration for an app.",
    params: ["environment_name"],
    keywords: ["environment", "config", "env"],
  },
  {
    name: "get_feature_flag_status",
    description: "Returns feature flag state.",
    params: ["flag_name"],
    keywords: ["feature", "flag", "toggle"],
  },
  {
    name: "get_api_endpoint_status",
    description: "Returns API endpoint availability and status.",
    params: ["endpoint_name"],
    keywords: ["api", "endpoint", "status"],
  },
  {
    name: "get_rate_limit_status",
    description: "Returns current API rate limit usage.",
    params: ["api_key_id"],
    keywords: ["rate", "limit", "api"],
  },
  {
    name: "get_cache_status",
    description: "Returns cache hit rate, memory usage, and status.",
    params: ["cache_name"],
    keywords: ["cache", "redis", "hit rate"],
  },
  {
    name: "get_queue_status",
    description: "Returns queue depth and consumer lag.",
    params: ["queue_name"],
    keywords: ["queue", "lag", "consumer"],
  },
  {
    name: "get_worker_status",
    description: "Returns background worker status.",
    params: ["worker_name"],
    keywords: ["worker", "background", "job"],
  },
  {
    name: "get_job_status",
    description: "Returns async job status by job ID.",
    params: ["job_id"],
    keywords: ["job", "async", "status"],
  },
  {
    name: "get_cron_schedule",
    description: "Returns cron schedule details.",
    params: ["cron_name"],
    keywords: ["cron", "schedule"],
  },
  {
    name: "get_email_delivery_status",
    description: "Returns email delivery status by message ID.",
    params: ["message_id"],
    keywords: ["email", "delivery", "message"],
  },
  {
    name: "get_sms_delivery_status",
    description: "Returns SMS delivery status by message ID.",
    params: ["message_id"],
    keywords: ["sms", "delivery", "message"],
  },
  {
    name: "get_notification_status",
    description: "Returns push notification delivery status.",
    params: ["notification_id"],
    keywords: ["notification", "push", "delivery"],
  },
  {
    name: "get_subscription_status",
    description: "Returns subscription status by subscription ID.",
    params: ["subscription_id"],
    keywords: ["subscription", "status", "billing"],
  },
  {
    name: "get_plan_details",
    description: "Returns billing plan details.",
    params: ["plan_id"],
    keywords: ["plan", "billing", "subscription"],
  },
  {
    name: "get_usage_report",
    description: "Returns usage report for an account.",
    params: ["account_id"],
    keywords: ["usage", "report", "account"],
  },
  {
    name: "get_account_balance",
    description: "Returns account balance.",
    params: ["account_id"],
    keywords: ["account", "balance", "billing"],
  },
  {
    name: "get_refund_status",
    description: "Returns refund status by refund ID.",
    params: ["refund_id"],
    keywords: ["refund", "payment", "status"],
  },
  {
    name: "get_shipment_status",
    description: "Returns shipment carrier status.",
    params: ["shipment_id"],
    keywords: ["shipment", "carrier", "tracking"],
  },
  {
    name: "get_tracking_details",
    description: "Returns tracking events for a shipment.",
    params: ["tracking_number"],
    keywords: ["tracking", "shipment", "delivery"],
  },
  {
    name: "get_inventory_level",
    description: "Returns inventory level for a SKU.",
    params: ["sku"],
    keywords: ["inventory", "stock", "sku"],
  },
  {
    name: "get_supplier_details",
    description: "Returns supplier details by supplier ID.",
    params: ["supplier_id"],
    keywords: ["supplier", "vendor"],
  },
  {
    name: "get_purchase_order_status",
    description: "Returns purchase order status.",
    params: ["purchase_order_id"],
    keywords: ["purchase", "order", "po"],
  },
  {
    name: "get_contract_status",
    description: "Returns contract status by contract ID.",
    params: ["contract_id"],
    keywords: ["contract", "status"],
  },
  {
    name: "get_compliance_status",
    description: "Returns compliance status for a resource.",
    params: ["resource_id"],
    keywords: ["compliance", "audit", "status"],
  },
];

/**
 * 40 more tools for 100-tool benchmark.
 */
export const EXTRA_100_DISTRACTOR_TOOLS: ToolSpec[] = [
  {
    name: "get_security_scan_status",
    description: "Returns security scan status for a repository or service.",
    params: ["target_id"],
    keywords: ["security", "scan", "vulnerability", "status"],
  },
  {
    name: "get_vulnerability_details",
    description: "Returns vulnerability details by CVE or vulnerability ID.",
    params: ["vulnerability_id"],
    keywords: ["vulnerability", "cve", "security"],
  },
  {
    name: "get_secret_scan_results",
    description: "Returns secret scanning results for a repository.",
    params: ["repo_name"],
    keywords: ["secret", "scan", "repository"],
  },
  {
    name: "get_access_review_status",
    description: "Returns access review status for a user or team.",
    params: ["review_id"],
    keywords: ["access", "review", "permission"],
  },
  {
    name: "get_audit_log_events",
    description: "Returns audit log events for an account or user.",
    params: ["account_id"],
    keywords: ["audit", "log", "events"],
  },
  {
    name: "get_user_permissions",
    description: "Returns permission grants for a user.",
    params: ["user_id"],
    keywords: ["user", "permissions", "access"],
  },
  {
    name: "get_role_details",
    description: "Returns role details and assigned permissions.",
    params: ["role_id"],
    keywords: ["role", "permissions", "access"],
  },
  {
    name: "get_policy_status",
    description: "Returns policy evaluation status.",
    params: ["policy_id"],
    keywords: ["policy", "status", "compliance"],
  },
  {
    name: "get_sla_status",
    description: "Returns SLA status and breach risk.",
    params: ["service_name"],
    keywords: ["sla", "breach", "service"],
  },
  {
    name: "get_slo_report",
    description: "Returns SLO report for a service.",
    params: ["service_name"],
    keywords: ["slo", "availability", "reliability"],
  },
  {
    name: "get_budget_status",
    description: "Returns budget usage status for a project or account.",
    params: ["budget_id"],
    keywords: ["budget", "cost", "usage"],
  },
  {
    name: "get_cost_report",
    description: "Returns cloud cost report.",
    params: ["account_id"],
    keywords: ["cost", "cloud", "report"],
  },
  {
    name: "get_resource_utilization",
    description: "Returns utilization metrics for a cloud resource.",
    params: ["resource_id"],
    keywords: ["resource", "utilization", "cloud"],
  },
  {
    name: "get_storage_usage",
    description: "Returns storage usage for a bucket or volume.",
    params: ["storage_id"],
    keywords: ["storage", "bucket", "usage"],
  },
  {
    name: "get_backup_status",
    description: "Returns backup status for a database or volume.",
    params: ["resource_id"],
    keywords: ["backup", "database", "volume"],
  },
  {
    name: "get_restore_status",
    description: "Returns restore job status.",
    params: ["restore_id"],
    keywords: ["restore", "backup", "job"],
  },
  {
    name: "get_dns_record_details",
    description: "Returns DNS record details.",
    params: ["domain_name"],
    keywords: ["dns", "domain", "record"],
  },
  {
    name: "get_ssl_certificate_status",
    description: "Returns SSL certificate expiry and validation status.",
    params: ["domain_name"],
    keywords: ["ssl", "certificate", "domain", "expiry"],
  },
  {
    name: "get_domain_status",
    description: "Returns domain registration and expiry status.",
    params: ["domain_name"],
    keywords: ["domain", "registration", "expiry"],
  },
  {
    name: "get_cdn_status",
    description: "Returns CDN distribution status.",
    params: ["distribution_id"],
    keywords: ["cdn", "distribution", "status"],
  },
  {
    name: "get_firewall_status",
    description: "Returns firewall rule status.",
    params: ["firewall_id"],
    keywords: ["firewall", "rule", "security"],
  },
  {
    name: "get_load_balancer_status",
    description: "Returns load balancer health and target status.",
    params: ["load_balancer_id"],
    keywords: ["load balancer", "target", "health"],
  },
  {
    name: "get_network_status",
    description: "Returns network connectivity status.",
    params: ["network_id"],
    keywords: ["network", "connectivity", "status"],
  },
  {
    name: "get_vpc_details",
    description: "Returns VPC details.",
    params: ["vpc_id"],
    keywords: ["vpc", "network", "cloud"],
  },
  {
    name: "get_subnet_details",
    description: "Returns subnet details.",
    params: ["subnet_id"],
    keywords: ["subnet", "network", "cloud"],
  },
  {
    name: "get_machine_image_details",
    description: "Returns machine image metadata.",
    params: ["image_id"],
    keywords: ["image", "ami", "machine"],
  },
  {
    name: "get_instance_status",
    description: "Returns compute instance status.",
    params: ["instance_id"],
    keywords: ["instance", "compute", "status"],
  },
  {
    name: "get_cluster_status",
    description: "Returns cluster health and status.",
    params: ["cluster_name"],
    keywords: ["cluster", "health", "status"],
  },
  {
    name: "get_node_status",
    description: "Returns node status in a cluster.",
    params: ["node_name"],
    keywords: ["node", "cluster", "status"],
  },
  {
    name: "get_namespace_details",
    description: "Returns namespace metadata.",
    params: ["namespace"],
    keywords: ["namespace", "kubernetes", "metadata"],
  },
  {
    name: "get_ingress_status",
    description: "Returns ingress status.",
    params: ["ingress_name"],
    keywords: ["ingress", "kubernetes", "status"],
  },
  {
    name: "get_configmap_details",
    description: "Returns Kubernetes ConfigMap details.",
    params: ["namespace", "configmap_name"],
    keywords: ["configmap", "kubernetes", "config"],
  },
  {
    name: "get_secret_details",
    description: "Returns metadata for a secret without exposing secret values.",
    params: ["namespace", "secret_name"],
    keywords: ["secret", "kubernetes", "metadata"],
  },
  {
    name: "get_volume_status",
    description: "Returns persistent volume status.",
    params: ["volume_name"],
    keywords: ["volume", "persistent", "storage"],
  },
  {
    name: "get_database_backup_status",
    description: "Returns database backup job status.",
    params: ["database_name"],
    keywords: ["database", "backup", "status"],
  },
  {
    name: "get_database_replication_status",
    description: "Returns database replication lag and health.",
    params: ["database_name"],
    keywords: ["database", "replication", "lag"],
  },
  {
    name: "get_database_query_stats",
    description: "Returns database query performance stats.",
    params: ["database_name"],
    keywords: ["database", "query", "performance"],
  },
  {
    name: "get_index_status",
    description: "Returns search/database index status.",
    params: ["index_name"],
    keywords: ["index", "search", "database"],
  },
  {
    name: "get_search_cluster_status",
    description: "Returns search cluster health.",
    params: ["cluster_name"],
    keywords: ["search", "cluster", "health"],
  },
  {
    name: "get_embedding_job_status",
    description: "Returns embedding job status.",
    params: ["job_id"],
    keywords: ["embedding", "job", "vector"],
  },
];

export const TOOL_60_REGISTRY: ToolSpec[] = [
  ...TOOL_20_REGISTRY,
  ...EXTRA_60_DISTRACTOR_TOOLS,
];

export const TOOL_100_REGISTRY: ToolSpec[] = [
  ...TOOL_60_REGISTRY,
  ...EXTRA_100_DISTRACTOR_TOOLS,
];

function getRequestedToolCount(): number {
  const raw = process.env.TOOL_COUNT;
  if (!raw) return 60;

  const n = Number(raw);
  if (!Number.isFinite(n)) return 60;

  return Math.max(20, Math.min(100, Math.floor(n)));
}

const requestedToolCount = getRequestedToolCount();

export const TOOL_REGISTRY: ToolSpec[] =
  requestedToolCount <= 20
    ? TOOL_20_REGISTRY
    : requestedToolCount <= 60
      ? TOOL_60_REGISTRY
      : TOOL_100_REGISTRY.slice(0, requestedToolCount);

/**
 * Hybrid visible direct tools.
 *
 * Keep this set small and distinct.
 * Broad tools like get_server_health/get_recent_logs/get_vector_search_results
 * can confuse hybrid routing.
 */
export const CORE_DIRECT_TOOLS = new Set([
  "get_order_status",
  "get_ticket_status",
  "get_customer_details",
]);

export const TEST_CASES = [
  {
    query: "What is the weather in Berlin?",
    expected_tool: "get_weather_details",
    expected_params: { city: "Berlin" },
  },
  {
    query: "Check stock price for AAPL",
    expected_tool: "get_stock_details",
    expected_params: { ticker: "AAPL" },
  },
  {
    query: "Show BTC price details",
    expected_tool: "get_crypto_details",
    expected_params: { symbol: "BTC" },
  },
  {
    query: "Get invoice INV-9001",
    expected_tool: "get_invoice_details",
    expected_params: { invoice_id: "INV-9001" },
  },
  {
    query: "Find customer CUST-301",
    expected_tool: "get_customer_details",
    expected_params: { customer_id: "CUST-301" },
  },
  {
    query: "Check order ORD-1001",
    expected_tool: "get_order_status",
    expected_params: { order_id: "ORD-1001" },
  },
  {
    query: "Tell me details for product SKU-ABC-44",
    expected_tool: "get_product_details",
    expected_params: { sku: "SKU-ABC-44" },
  },
  {
    query: "Is postgres healthy?",
    expected_tool: "get_database_status",
    expected_params: { database_name: "postgres" },
  },
  {
    query: "Check health of api-server-1",
    expected_tool: "get_server_health",
    expected_params: { server_name: "api-server-1" },
  },
  {
    query: "Show recent logs for auth-service",
    expected_tool: "get_recent_logs",
    expected_params: { service_name: "auth-service" },
  },
  {
    query: "What branch is repo trace-ui on?",
    expected_tool: "get_git_branch_info",
    expected_params: { repo_name: "trace-ui" },
  },
  {
    query: "Check PR 42 in repo mcp-router",
    expected_tool: "get_pull_request_info",
    expected_params: { repo_name: "mcp-router", pr_number: 42 },
  },
  {
    query: "Is docker container redis-cache running?",
    expected_tool: "get_docker_container_status",
    expected_params: { container_name: "redis-cache" },
  },
  {
    query: "Check pod trace-api-7d9 in namespace production",
    expected_tool: "get_kubernetes_pod_status",
    expected_params: { namespace: "production", pod_name: "trace-api-7d9" },
  },
  {
    query: "Get user profile USER-88",
    expected_tool: "get_user_profile",
    expected_params: { user_id: "USER-88" },
  },
  {
    query: "Check payment PAY-7788",
    expected_tool: "get_payment_status",
    expected_params: { payment_id: "PAY-7788" },
  },
  {
    query: "What is the status of ticket TICK-222?",
    expected_tool: "get_ticket_status",
    expected_params: { ticket_id: "TICK-222" },
  },
  {
    query: "Show my events for 2026-04-24",
    expected_tool: "get_calendar_events",
    expected_params: { date: "2026-04-24" },
  },
  {
    query: "Summarize document DOC-555",
    expected_tool: "get_document_summary",
    expected_params: { document_id: "DOC-555" },
  },
  {
    query: "Search documents for MCP routing performance",
    expected_tool: "get_vector_search_results",
    expected_params: { query: "MCP routing performance" },
  },
] as const;