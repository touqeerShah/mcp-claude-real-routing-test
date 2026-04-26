<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MCP Tool Routing Benchmark</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0f14;
    --surface: #13161d;
    --surface2: #1a1e28;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.13);
    --text: #e8eaf0;
    --muted: #7a8099;
    --accent: #4f8ef7;
    --accent2: #2dd4a4;
    --warn: #f08c3a;
    --danger: #e05a5a;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.75;
  }

  /* ── NAV ── */
  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(13,15,20,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 48px;
    display: flex; align-items: center; gap: 32px; height: 52px;
  }
  nav .logo { font-family: var(--mono); font-size: 13px; color: var(--accent); letter-spacing: 0.05em; }
  nav a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color .2s; }
  nav a:hover { color: var(--text); }

  /* ── LAYOUT ── */
  .page { max-width: 960px; margin: 0 auto; padding: 0 32px 80px; }

  /* ── HERO ── */
  .hero {
    padding: 72px 0 56px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 64px;
  }
  .hero-tag {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
    color: var(--accent); text-transform: uppercase;
    background: rgba(79,142,247,0.1); border: 1px solid rgba(79,142,247,0.2);
    padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 24px;
  }
  h1 {
    font-size: 44px; font-weight: 600; line-height: 1.15;
    letter-spacing: -0.03em; margin-bottom: 20px;
  }
  h1 span { color: var(--accent); }
  .hero-desc { font-size: 17px; color: var(--muted); max-width: 620px; line-height: 1.7; margin-bottom: 32px; }
  .hero-meta {
    display: flex; gap: 24px; flex-wrap: wrap;
  }
  .meta-pill {
    font-family: var(--mono); font-size: 12px; color: var(--muted);
    border: 1px solid var(--border2); padding: 6px 14px; border-radius: 20px;
    display: flex; align-items: center; gap: 6px;
  }
  .meta-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent2); }

  /* ── SECTION HEADERS ── */
  h2 {
    font-size: 24px; font-weight: 600; letter-spacing: -0.02em;
    margin-bottom: 10px; padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  h3 { font-size: 16px; font-weight: 500; margin-bottom: 12px; color: var(--text); }
  .section { margin-bottom: 64px; }
  .section-label {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }

  /* ── ARCHITECTURE CARDS ── */
  .arch-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px;
  }
  .arch-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 20px 22px;
    transition: border-color .2s;
  }
  .arch-card:hover { border-color: var(--border2); }
  .arch-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .arch-badge {
    font-family: var(--mono); font-size: 12px; font-weight: 600;
    padding: 3px 8px; border-radius: 4px;
  }
  .badge-direct   { background: rgba(79,142,247,0.15); color: #4f8ef7; }
  .badge-router   { background: rgba(45,212,164,0.15); color: #2dd4a4; }
  .badge-twostep  { background: rgba(160,120,240,0.15); color: #a078f0; }
  .badge-hybrid   { background: rgba(240,140,58,0.15);  color: #f08c3a; }
  .arch-card p { font-size: 13px; color: var(--muted); line-height: 1.6; }
  .arch-usecase {
    margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);
    font-family: var(--mono); font-size: 11px; color: var(--muted);
  }
  .arch-usecase strong { color: var(--text); }

  /* ── CHARTS ── */
  .charts-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
  }
  .legend {
    display: flex; gap: 16px; flex-wrap: wrap;
  }
  .legend-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-family: var(--mono); color: var(--muted);
  }
  .legend-swatch { width: 10px; height: 10px; border-radius: 2px; }

  .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .chart-box {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 20px 20px 16px;
  }
  .chart-box.wide { grid-column: 1 / -1; }
  .chart-title { font-family: var(--mono); font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
  .chart-wrap { position: relative; }

  /* ── RESULTS TABLE ── */
  .results-group { margin-bottom: 32px; }
  .tool-count-label {
    font-family: var(--mono); font-size: 12px; color: var(--accent);
    background: rgba(79,142,247,0.08); border: 1px solid rgba(79,142,247,0.18);
    display: inline-block; padding: 3px 10px; border-radius: 4px; margin-bottom: 12px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th {
    text-align: left; padding: 9px 14px;
    font-family: var(--mono); font-size: 11px; font-weight: 500;
    color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;
    border-bottom: 1px solid var(--border2); background: var(--surface);
  }
  tbody tr { border-bottom: 1px solid var(--border); transition: background .15s; }
  tbody tr:hover { background: var(--surface2); }
  tbody td { padding: 10px 14px; color: var(--text); }
  tbody td:first-child { font-family: var(--mono); font-size: 12px; }
  .pill-success { color: var(--accent2); font-weight: 500; }
  .pill-warn    { color: var(--warn); font-weight: 500; }
  .pill-danger  { color: var(--danger); font-weight: 500; }
  .delta-pos { color: var(--accent2); font-family: var(--mono); font-size: 12px; }
  .delta-neg { color: var(--danger); font-family: var(--mono); font-size: 12px; }
  .delta-neu { color: var(--muted); font-family: var(--mono); font-size: 12px; }

  /* ── FINDINGS ── */
  .findings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
  .finding-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 20px;
  }
  .finding-number {
    font-family: var(--mono); font-size: 32px; font-weight: 600;
    color: var(--border2); line-height: 1; margin-bottom: 10px;
  }
  .finding-card h3 { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
  .finding-card p { font-size: 13px; color: var(--muted); line-height: 1.65; }
  .stat-highlight {
    display: inline-block; margin-top: 10px;
    font-family: var(--mono); font-size: 12px;
    background: rgba(45,212,164,0.08); border: 1px solid rgba(45,212,164,0.2);
    color: var(--accent2); padding: 4px 10px; border-radius: 4px;
  }

  /* ── CODE BLOCK ── */
  pre {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px 20px; overflow-x: auto;
    font-family: var(--mono); font-size: 12px; line-height: 1.7;
    color: #b0bcd4; margin: 16px 0;
  }
  code { font-family: var(--mono); font-size: 12px; color: var(--accent2); }

  /* ── RECOMMENDATION ── */
  .rec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 24px; }
  .rec-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 18px 16px; text-align: center;
  }
  .rec-card .rec-mode {
    font-family: var(--mono); font-size: 13px; font-weight: 600;
    margin-bottom: 6px;
  }
  .rec-card .rec-label {
    font-size: 11px; color: var(--muted); line-height: 1.5;
  }
  .rec-card.featured { border-color: rgba(45,212,164,0.35); background: rgba(45,212,164,0.04); }
  .rec-card.featured .rec-mode { color: var(--accent2); }

  /* ── CALLOUT ── */
  .callout {
    border-left: 3px solid var(--accent);
    background: rgba(79,142,247,0.05);
    border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0;
    font-size: 14px; color: var(--muted);
  }
  .callout strong { color: var(--text); }

  /* ── SUMMARY ROW ── */
  .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 24px 0; }
  .summary-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 18px 20px;
  }
  .summary-card .num { font-size: 28px; font-weight: 600; letter-spacing: -0.03em; }
  .summary-card .lbl { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .c-blue  { color: #4f8ef7; }
  .c-green { color: #2dd4a4; }
  .c-purple{ color: #a078f0; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  @media (max-width: 680px) {
    .arch-grid, .chart-grid, .findings-grid, .rec-grid, .summary-row { grid-template-columns: 1fr; }
    .chart-box.wide { grid-column: 1; }
    h1 { font-size: 28px; }
    nav { padding: 0 20px; gap: 16px; }
    .page { padding: 0 16px 60px; }
  }
</style>
</head>
<body>

<nav>
  <span class="logo">mcp-routing-bench</span>
  <a href="#architectures">Architectures</a>
  <a href="#results">Results</a>
  <a href="#findings">Findings</a>
  <a href="#recommendation">Use it</a>
</nav>

<div class="page">

  <!-- HERO -->
  <div class="hero">
    <div class="hero-tag">Benchmark Report</div>
    <h1>MCP Tool <span>Routing</span><br>Architecture Analysis</h1>
    <p class="hero-desc">
      How do different tool-routing strategies scale as your MCP tool catalog grows from 20 to 100 tools?
      We tested four architectures across three catalog sizes — measuring token usage, latency, and reliability.
    </p>
    <div class="hero-meta">
      <div class="meta-pill"><span class="dot"></span> 20 prompts per run</div>
      <div class="meta-pill"><span class="dot"></span> 20 / 60 / 100 tools</div>
      <div class="meta-pill"><span class="dot"></span> AWS Bedrock · Claude Sonnet 4</div>
      <div class="meta-pill"><span class="dot"></span> 4 architectures compared</div>
    </div>
  </div>

  <!-- ARCHITECTURES -->
  <div class="section" id="architectures">
    <div class="section-label">01 — Architectures</div>
    <h2>How each mode works</h2>
    <p style="color:var(--muted);margin-top:10px;margin-bottom:0;font-size:14px;">Each architecture gives Claude a different view of the available tools, which changes how it reasons about selection and execution.</p>

    <div class="arch-grid">
      <div class="arch-card">
        <div class="arch-card-header">
          <span class="arch-badge badge-direct">direct</span>
        </div>
        <p>All MCP tools are exposed directly. Claude sees every tool schema and picks the right one itself. Simple and transparent — but tool-schema context grows linearly with catalog size.</p>
        <div class="arch-usecase"><strong>Best for:</strong> small or stable tool catalogs (&lt;30 tools)</div>
      </div>
      <div class="arch-card">
        <div class="arch-card-header">
          <span class="arch-badge badge-router">router</span>
        </div>
        <p>Claude sees one <code>tool_router</code> tool. It selects the hidden internal tool, extracts parameters, executes it, and returns the result — all in a single call. Internal complexity is fully hidden.</p>
        <div class="arch-usecase"><strong>Best for:</strong> production systems with large or evolving catalogs</div>
      </div>
      <div class="arch-card">
        <div class="arch-card-header">
          <span class="arch-badge badge-twostep">two-step</span>
        </div>
        <p>Two explicit calls: <code>discover_tool</code> selects the tool and extracts parameters, then <code>execute_tool</code> runs it. Separates routing from execution, giving full observability of each stage.</p>
        <div class="arch-usecase"><strong>Best for:</strong> debugging, tracing, and agent observability UIs</div>
      </div>
      <div class="arch-card">
        <div class="arch-card-header">
          <span class="arch-badge badge-hybrid">hybrid</span>
        </div>
        <p>A small set of direct tools co-exists with a router fallback. Claude may call a visible tool or delegate to the router. Requires careful curation — broad direct tools cause ambiguity and failures.</p>
        <div class="arch-usecase"><strong>Best for:</strong> experimental use only until the direct-tool set is tuned</div>
      </div>
    </div>

    <div class="callout" style="margin-top:20px;">
      <strong>Note on two-step:</strong> The benchmark runner always forces <code>execute_tool</code> after <code>discover_tool</code>, so two-step results reflect full execution — not routing-only. It is directly comparable to direct and router.
    </div>
  </div>

  <!-- RESULTS -->
  <div class="section" id="results">
    <div class="section-label">02 — Results</div>
    <h2>Benchmark data across all runs</h2>

    <!-- Summary cards -->
    <div class="summary-row" style="margin-top:24px;">
      <div class="summary-card">
        <div class="num c-green">22.8%</div>
        <div class="lbl">token reduction by router vs direct at 100 tools</div>
      </div>
      <div class="summary-card">
        <div class="num c-blue">18.1%</div>
        <div class="lbl">latency reduction by router vs direct at 100 tools</div>
      </div>
      <div class="summary-card">
        <div class="num c-purple">0%</div>
        <div class="lbl">failure rate for direct, router & two-step (any catalog size)</div>
      </div>
    </div>

    <!-- Charts -->
    <div style="margin-top:32px;">
      <div class="charts-header">
        <h3 style="margin:0;font-size:15px;">Visual comparison</h3>
        <div class="legend">
          <div class="legend-item"><span class="legend-swatch" style="background:#4f8ef7"></span>direct</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#2dd4a4"></span>two-step</div>
          <div class="legend-item"><span class="legend-swatch" style="background:#e05a5a"></span>hybrid</div>
        </div>
      </div>

      <div class="chart-grid">
        <div class="chart-box">
          <div class="chart-title">avg output tokens / query</div>
          <div class="chart-wrap" style="height:200px;"><canvas id="tokChart" role="img" aria-label="Avg tokens per query by architecture across tool catalog sizes"></canvas></div>
        </div>
        <div class="chart-box">
          <div class="chart-title">avg latency / query (ms)</div>
          <div class="chart-wrap" style="height:200px;"><canvas id="latChart" role="img" aria-label="Avg latency in ms by architecture across tool catalog sizes"></canvas></div>
        </div>
        <div class="chart-box wide">
          <div class="chart-title">success rate % by catalog size</div>
          <div class="chart-wrap" style="height:180px;"><canvas id="sucChart" role="img" aria-label="Success rate grouped by catalog size 20 60 100 tools"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Raw tables -->
    <div style="margin-top:36px;">
      <div class="results-group">
        <div class="tool-count-label">20 tools</div>
        <table>
          <thead><tr><th>Architecture</th><th>Success</th><th>Avg tokens</th><th>Avg latency</th><th>vs direct</th></tr></thead>
          <tbody>
            <tr><td>direct</td>  <td class="pill-success">20/20</td><td>163</td><td>3.82s</td><td class="delta-neu">baseline</td></tr>
            <tr><td>two-step</td><td class="pill-success">20/20</td><td>147</td><td>3.76s</td><td class="delta-pos">−9.8% tok · −1.5% time</td></tr>
            <tr><td>hybrid</td>  <td class="pill-danger">5/20</td> <td>288</td><td>5.66s</td><td class="delta-neg">+76.7% tok · +48.2% time</td></tr>
          </tbody>
        </table>
      </div>

      <div class="results-group">
        <div class="tool-count-label">60 tools</div>
        <table>
          <thead><tr><th>Architecture</th><th>Success</th><th>Avg tokens</th><th>Avg latency</th><th>vs direct</th></tr></thead>
          <tbody>
            <tr><td>direct</td>  <td class="pill-success">20/20</td><td>166</td><td>3.95s</td><td class="delta-neu">baseline</td></tr>
            <tr><td>two-step</td><td class="pill-success">20/20</td><td>151</td><td>4.01s</td><td class="delta-pos">−9.3% tok · +1.4% time</td></tr>
            <tr><td>hybrid</td>  <td class="pill-warn">14/20</td><td>272</td><td>5.73s</td><td class="delta-neg">+63.9% tok · +45.1% time</td></tr>
          </tbody>
        </table>
      </div>

      <div class="results-group">
        <div class="tool-count-label">100 tools</div>
        <table>
          <thead><tr><th>Architecture</th><th>Success</th><th>Avg tokens</th><th>Avg latency</th><th>vs direct</th></tr></thead>
          <tbody>
            <tr><td>direct</td>  <td class="pill-success">20/20</td><td>186</td><td>4.87s</td><td class="delta-neu">baseline</td></tr>
            <tr><td>two-step</td><td class="pill-success">20/20</td><td>146</td><td>4.64s</td><td class="delta-pos">−21.5% tok · −4.7% time</td></tr>
            <tr><td>hybrid</td>  <td class="pill-warn">18/20</td><td>259</td><td>6.13s</td><td class="delta-neg">+39.2% tok · +25.9% time</td></tr>
          </tbody>
        </table>
        <p style="font-size:12px;color:var(--muted);margin-top:8px;">Router column omitted from tables above — it was excluded from execution comparisons (see note). Full router data: 20 tools: 143 tok / 4.20s · 60 tools: 139 tok / 4.24s · 100 tools: 144 tok / 3.98s — all 20/20 success.</p>
      </div>
    </div>
  </div>

  <!-- FINDINGS -->
  <div class="section" id="findings">
    <div class="section-label">03 — Key Findings</div>
    <h2>What the data tells us</h2>

    <div class="findings-grid" style="margin-top:24px;">
      <div class="finding-card">
        <div class="finding-number">01</div>
        <h3>Direct works — until it doesn't</h3>
        <p>At 20 tools, direct mode is perfectly competitive. Claude can scan every schema and pick the right tool with no overhead. But token usage rises as the catalog grows — from 163 at 20 tools to 186 at 100 — because more schemas fill the context window even when unused.</p>
      </div>
      <div class="finding-card">
        <div class="finding-number">02</div>
        <h3>Router is the production default</h3>
        <p>At 100 tools, the single-call router delivered 20/20 success, 22.8% lower token usage, and 18.1% lower latency compared with direct. Hiding internal schemas behind a single interface is the most cost-effective strategy for large and growing catalogs.</p>
        <span class="stat-highlight">100 tools: 144 avg tokens · 3.98s avg</span>
      </div>
      <div class="finding-card">
        <div class="finding-number">03</div>
        <h3>Two-step is your debugging interface</h3>
        <p>Two-step keeps full 20/20 success at every catalog size. At 100 tools it uses 21.5% fewer tokens than direct and runs slightly faster. Its two explicit calls — discovery then execution — let you inspect tool selection, extracted parameters, and exactly where failures occur.</p>
        <span class="stat-highlight">100 tools: 146 avg tokens · 4.64s avg</span>
      </div>
      <div class="finding-card">
        <div class="finding-number">04</div>
        <h3>Hybrid needs careful curation</h3>
        <p>Hybrid suffered the most. Broad direct tools (e.g. <code>get_recent_logs</code>, <code>get_customer_details</code>) create ambiguity between the direct path and the router. Success rate was only 25% at 20 tools in one run. It can work — but only with a small, highly distinct direct-tool set.</p>
        <div style="margin-top:10px;font-family:var(--mono);font-size:11px;color:var(--danger);background:rgba(224,90,90,0.08);border:1px solid rgba(224,90,90,0.2);padding:8px 12px;border-radius:6px;">
          Avoid: get_server_health · get_recent_logs · get_customer_details<br>
          Prefer: get_ticket_status · get_order_status · tool_router
        </div>
      </div>
    </div>
  </div>

  <!-- RECOMMENDATION -->
  <div class="section" id="recommendation">
    <div class="section-label">04 — Recommendation</div>
    <h2>Which architecture to use</h2>
    <p style="color:var(--muted);margin-top:10px;font-size:14px;">Pick based on your current priorities. You can run multiple modes in parallel — router in production, two-step for a debug trace UI alongside it.</p>

    <div class="rec-grid" style="margin-top:24px;">
      <div class="rec-card featured">
        <div class="rec-mode">router</div>
        <div class="rec-label">Production default. Best token efficiency and lowest latency at scale.</div>
      </div>
      <div class="rec-card">
        <div class="rec-mode" style="color:#a078f0;">two-step</div>
        <div class="rec-label">Debug & trace mode. Full observability of selection and execution stages.</div>
      </div>
      <div class="rec-card">
        <div class="rec-mode" style="color:#4f8ef7;">direct</div>
        <div class="rec-label">Simple demos and small catalogs under ~30 tools.</div>
      </div>
      <div class="rec-card">
        <div class="rec-mode" style="color:#f08c3a;">hybrid</div>
        <div class="rec-label">Experimental only. Requires a carefully curated, minimal direct-tool set.</div>
      </div>
    </div>

    <h3 style="margin-top:36px;margin-bottom:12px;">Quick start — 100-tool benchmark</h3>
    <pre>export TOOL_COUNT=100
export AWS_REGION=eu-central-1
export BEDROCK_MODEL_ID="eu.anthropic.claude-sonnet-4-20250514-v1:0"
export BEDROCK_THINKING_ENABLED=true
export BEDROCK_THINKING_BUDGET_TOKENS=1024

npm run build

rm -rf runs/direct-bedrock-100   && npm run bedrock:bench direct
rm -rf runs/router-bedrock-100   && npm run bedrock:bench router
rm -rf runs/two-step-bedrock-100 && npm run bedrock:bench two-step
rm -rf runs/hybrid-bedrock-100   && npm run bedrock:bench hybrid

npm run compare
cat output/combined-benchmark-report-100-tools.md</pre>

    <h3 style="margin-top:28px;margin-bottom:12px;">Two-step trace flow</h3>
    <pre><span style="color:#7a8099;"># Step 1 — discovery</span>
discover_tool(query)
  → selected tool name
  → extracted parameters
  → confidence / reason

<span style="color:#7a8099;"># Step 2 — execution</span>
execute_tool(tool_name, params)
  → result from internal MCP tool</pre>
  </div>

</div><!-- /page -->

<script>
const labels20  = ['20 tools'];
const labels60  = ['60 tools'];
const labels100 = ['100 tools'];
const labelsAll = ['20 tools','60 tools','100 tools'];

const palette = {
  direct:  { solid: '#4f8ef7', faint: 'rgba(79,142,247,0.18)' },
  two:     { solid: '#2dd4a4', faint: 'rgba(45,212,164,0.18)' },
  hybrid:  { solid: '#e05a5a', faint: 'rgba(224,90,90,0.18)'  },
};

const gridColor = 'rgba(255,255,255,0.05)';
const tickColor = '#555e78';
const baseOpts  = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: tickColor, font: { size: 11, family: 'JetBrains Mono' } }, grid: { color: gridColor } },
    y: { ticks: { color: tickColor, font: { size: 11, family: 'JetBrains Mono' } }, grid: { color: gridColor } }
  }
};

// Tokens chart
new Chart(document.getElementById('tokChart'), {
  type: 'bar',
  data: {
    labels: labelsAll,
    datasets: [
      { label: 'direct',   data: [163,166,186], backgroundColor: palette.direct.faint, borderColor: palette.direct.solid, borderWidth: 1.5, borderRadius: 5 },
      { label: 'two-step', data: [147,151,146], backgroundColor: palette.two.faint,   borderColor: palette.two.solid,   borderWidth: 1.5, borderRadius: 5 },
      { label: 'hybrid',   data: [288,272,259], backgroundColor: palette.hybrid.faint, borderColor: palette.hybrid.solid, borderWidth: 1.5, borderRadius: 5 },
    ]
  },
  options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, suggestedMax: 340 } } }
});

// Latency chart
new Chart(document.getElementById('latChart'), {
  type: 'line',
  data: {
    labels: labelsAll,
    datasets: [
      { label: 'direct',   data: [3820,3954,4870], borderColor: palette.direct.solid, backgroundColor: palette.direct.faint, fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2 },
      { label: 'two-step', data: [3764,4009,4640], borderColor: palette.two.solid,   backgroundColor: palette.two.faint,   fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2 },
      { label: 'hybrid',   data: [5664,5733,6130], borderColor: palette.hybrid.solid, backgroundColor: palette.hybrid.faint, fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2, borderDash: [6,3] },
    ]
  },
  options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, ticks: { ...baseOpts.scales.y.ticks, callback: v => (v/1000).toFixed(1)+'s' } } } }
});

// Success rate grouped bar
new Chart(document.getElementById('sucChart'), {
  type: 'bar',
  data: {
    labels: labelsAll,
    datasets: [
      { label: 'direct',   data: [100,100,100], backgroundColor: palette.direct.faint, borderColor: palette.direct.solid, borderWidth: 1.5, borderRadius: 4 },
      { label: 'two-step', data: [100,100,100], backgroundColor: palette.two.faint,   borderColor: palette.two.solid,   borderWidth: 1.5, borderRadius: 4 },
      { label: 'hybrid',   data: [25, 70, 90],  backgroundColor: palette.hybrid.faint, borderColor: palette.hybrid.solid, borderWidth: 1.5, borderRadius: 4 },
    ]
  },
  options: {
    ...baseOpts,
    scales: {
      ...baseOpts.scales,
      y: { ...baseOpts.scales.y, min: 0, max: 110, ticks: { ...baseOpts.scales.y.ticks, callback: v => v+'%' } }
    }
  }
});
</script>
</body>
</html>

