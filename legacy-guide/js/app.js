// Main Application Logic for BREAKING MONEY - AI Trading Connections Guide

let selectedClient = "antigravity";
let selectedBroker = "zerodha";
let activeLinkFilter = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  initMatrixSelector();
  initBrokerCards();
  initClientCards();
  initLinksTable();
  initSecurityChecklist();
  initConfigGenerator();
  updateMatcher();

  // Re-run lucide icons on updates
  lucide.createIcons();
});

// Toast notification helper
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast-animate flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/90 text-slate-950 font-semibold shadow-lg text-sm backdrop-blur-sm";
  toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4"></i> <span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// Copy text utility
window.copyToClipboard = function(text, label = "Code copied to clipboard!") {
  navigator.clipboard.writeText(text).then(() => {
    showToast(label);
  }).catch(() => {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast(label);
  });
};

// 1. Interactive Connection Matcher
function initMatrixSelector() {
  const clientBtnsContainer = document.getElementById("client-selector-buttons");
  const brokerBtnsContainer = document.getElementById("broker-selector-buttons");

  if (!clientBtnsContainer || !brokerBtnsContainer) return;

  // Render client buttons
  clientBtnsContainer.innerHTML = TRADING_DATA.aiClients.map(client => `
    <button 
      onclick="selectClient('${client.id}')"
      id="client-btn-${client.id}"
      class="client-select-btn flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
        selectedClient === client.id 
          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20' 
          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
      }">
      <i data-lucide="${client.icon}" class="w-4 h-4 text-cyan-400"></i>
      <span>${client.name}</span>
    </button>
  `).join("");

  // Render broker buttons
  brokerBtnsContainer.innerHTML = TRADING_DATA.brokers.map(broker => `
    <button 
      onclick="selectBroker('${broker.id}')"
      id="broker-btn-${broker.id}"
      class="broker-select-btn flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
        selectedBroker === broker.id 
          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20' 
          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
      }">
      <span class="w-2.5 h-2.5 rounded-full bg-${broker.badgeColor}-400"></span>
      <span>${broker.name}</span>
    </button>
  `).join("");

  lucide.createIcons();
}

window.selectClient = function(id) {
  selectedClient = id;
  document.querySelectorAll(".client-select-btn").forEach(btn => {
    btn.className = "client-select-btn flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white";
  });
  const activeBtn = document.getElementById(`client-btn-${id}`);
  if (activeBtn) {
    activeBtn.className = "client-select-btn flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20";
  }
  updateMatcher();
};

window.selectBroker = function(id) {
  selectedBroker = id;
  document.querySelectorAll(".broker-select-btn").forEach(btn => {
    btn.className = "broker-select-btn flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white";
  });
  const activeBtn = document.getElementById(`broker-btn-${id}`);
  if (activeBtn) {
    activeBtn.className = "broker-select-btn flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20";
  }
  updateMatcher();
};

function updateMatcher() {
  const clientObj = TRADING_DATA.aiClients.find(c => c.id === selectedClient);
  const brokerObj = TRADING_DATA.brokers.find(b => b.id === selectedBroker);
  const resultContainer = document.getElementById("matcher-result");

  if (!clientObj || !brokerObj || !resultContainer) return;

  // Determine key connection details
  const keyPair = `${selectedClient}-${selectedBroker}`;
  let connectionInfo = TRADING_DATA.connections[keyPair];

  if (!connectionInfo) {
    // Fallback logic for generic pair
    if (selectedBroker === "angelone") {
      connectionInfo = TRADING_DATA.connections["generic-angelone"];
    } else if (selectedBroker === "groww") {
      connectionInfo = TRADING_DATA.connections["generic-groww"];
    } else if (selectedBroker === "indmoney") {
      connectionInfo = {
        recommended: selectedClient === "claude",
        difficulty: "Zero-Code (Web Connector)",
        flowType: "Hosted Remote MCP",
        headline: `${clientObj.name} + INDmoney Connection`,
        steps: [
          "Open your AI client's remote MCP configuration.",
          "Add the official INDmoney hosted endpoint: <code>https://mcp.indmoney.com/mcp</code>.",
          "Complete web authentication via Mobile + OTP + MPIN.",
          "Access real-time read-only portfolio analysis and net worth."
        ],
        securityNote: "INDmoney is strictly read-only and requires zero private key storage.",
        configSnippet: `{
  "mcpServers": {
    "indmoney": {
      "url": "https://mcp.indmoney.com/mcp"
    }
  }
}`
      };
    } else {
      connectionInfo = {
        recommended: true,
        difficulty: "Easy",
        flowType: "Remote SSE MCP Server",
        headline: `${clientObj.name} + Zerodha Kite MCP Setup`,
        steps: [
          "Create/obtain your Kite Connect developer credentials from Zerodha.",
          "Add the hosted Kite MCP server URL (<code>https://mcp.kite.trade/mcp</code>) or launch the local GitHub repo.",
          "Configure the server in your client's settings.",
          "Interact with Kite tools to fetch quotes, holdings, margins, and execute orders."
        ],
        securityNote: "Keep trading execution disabled until you've verified data models with paper-trading.",
        configSnippet: `{
  "mcpServers": {
    "zerodha-kite": {
      "url": "https://mcp.kite.trade/mcp"
    }
  }
}`
      };
    }
  }

  // Generate visual workflow badge
  let flowBadge = "";
  if (selectedBroker === "indmoney") {
    flowBadge = `<span class="px-2.5 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> 100% Read-Only • Zero-Code</span>`;
  } else if (selectedBroker === "zerodha") {
    flowBadge = `<span class="px-2.5 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Official Kite MCP Supported</span>`;
  } else {
    flowBadge = `<span class="px-2.5 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5"><i data-lucide="wrench" class="w-3.5 h-3.5"></i> Requires Custom MCP Bridge</span>`;
  }

  // Render Result Box
  resultContainer.innerHTML = `
    <div class="glass-card rounded-2xl p-6 lg:p-8 space-y-6 border border-slate-800">
      
      <!-- Header row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div class="flex items-center gap-2 mb-2">
            ${flowBadge}
            <span class="text-xs text-slate-400">Difficulty: <strong class="text-white">${connectionInfo.difficulty}</strong></span>
          </div>
          <h3 class="text-2xl font-bold text-white flex items-center gap-2">
            <span>${clientObj.name}</span>
            <i data-lucide="arrow-right" class="w-5 h-5 text-slate-500"></i>
            <span class="text-cyan-400">${brokerObj.name}</span>
          </h3>
          <p class="text-sm text-slate-400 mt-1">${connectionInfo.flowType}</p>
        </div>

        <div class="flex items-center gap-3">
          <a href="${brokerObj.portalUrl || '#'}" target="_blank" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors">
            <span>Broker Portal</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </a>
        </div>
      </div>

      <!-- Architecture Visual Flow -->
      <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Connection Pipeline</div>
        <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div class="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 text-white">
            <i data-lucide="${clientObj.icon}" class="w-4 h-4 text-cyan-400"></i>
            <span>${clientObj.name}</span>
          </div>
          
          <i data-lucide="arrow-right" class="w-4 h-4 text-slate-500 hidden sm:block"></i>

          <div class="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 text-cyan-300">
            <i data-lucide="cpu" class="w-4 h-4 text-cyan-400"></i>
            <span>${brokerObj.id === 'indmoney' || brokerObj.id === 'zerodha' ? 'Official Remote MCP' : 'Local FastMCP Bridge'}</span>
          </div>

          <i data-lucide="arrow-right" class="w-4 h-4 text-slate-500 hidden sm:block"></i>

          <div class="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 text-emerald-400">
            <i data-lucide="building-2" class="w-4 h-4 text-emerald-400"></i>
            <span>${brokerObj.name} API</span>
          </div>
        </div>
      </div>

      <!-- Step-by-Step Instructions -->
      <div class="space-y-3">
        <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-300">Step-by-Step Setup Guide</h4>
        <ol class="space-y-2.5 text-sm text-slate-300">
          ${connectionInfo.steps.map((step, idx) => `
            <li class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs flex items-center justify-center font-bold">
                ${idx + 1}
              </span>
              <span class="pt-0.5 leading-relaxed">${step}</span>
            </li>
          `).join("")}
        </ol>
      </div>

      <!-- Configuration Snippet with 1-click Copy -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
            <i data-lucide="file-code" class="w-3.5 h-3.5 text-cyan-400"></i>
            <span>Configuration Code</span>
          </div>
          <button 
            onclick="copyToClipboard(\`${escapeForAttribute(connectionInfo.configSnippet)}\`, 'Configuration copied!')"
            class="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Copy Snippet</span>
          </button>
        </div>

        <div class="relative bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre><code>${escapeHtml(connectionInfo.configSnippet)}</code></pre>
        </div>
      </div>

      <!-- Security Guardrail Alert -->
      <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
        <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"></i>
        <div>
          <strong class="font-semibold text-amber-300">Security Rule:</strong>
          <span class="ml-1">${connectionInfo.securityNote}</span>
        </div>
      </div>

    </div>
  `;

  lucide.createIcons();
}

// 2. Broker Breakdown Cards
function initBrokerCards() {
  const container = document.getElementById("broker-cards-grid");
  if (!container) return;

  container.innerHTML = TRADING_DATA.brokers.map(broker => {
    return `
      <div class="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-${broker.badgeColor}-500/15 text-${broker.badgeColor}-300 border border-${broker.badgeColor}-500/30">
                ${broker.status}
              </span>
              <h3 class="text-xl font-bold text-white mt-2">${broker.name}</h3>
            </div>
            <span class="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              ${broker.difficulty}
            </span>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">${broker.description}</p>

          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <div class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Features</div>
            <ul class="space-y-1.5 text-xs text-slate-400">
              ${broker.features.map(f => `
                <li class="flex items-center gap-2">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"></i>
                  <span>${f}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
          <div class="text-xs text-slate-500 truncate">
            <strong class="text-slate-400">Endpoint:</strong> ${broker.endpoint}
          </div>
          <div class="flex items-center gap-2">
            <button 
              onclick="selectBroker('${broker.id}'); document.getElementById('matcher-section').scrollIntoView({ behavior: 'smooth' });"
              class="w-full py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              <span>View Connection</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
            ${broker.portalUrl ? `
              <a href="${broker.portalUrl}" target="_blank" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Official Link">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

// 3. AI Client Cards
function initClientCards() {
  const container = document.getElementById("client-cards-grid");
  if (!container) return;

  container.innerHTML = TRADING_DATA.aiClients.map(client => {
    return `
      <div class="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <i data-lucide="${client.icon}" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">${client.name}</h3>
            <p class="text-xs text-slate-400">${client.tagline}</p>
          </div>
        </div>

        <p class="text-xs text-slate-400 leading-relaxed">${client.summary}</p>

        <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <div class="text-[10px] uppercase font-bold text-slate-500">Config Path (macOS)</div>
          <div class="text-xs font-mono text-cyan-300 truncate" title="${client.configPath.mac}">
            ${client.configPath.mac}
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <a href="${client.docsUrl}" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <span>Official MCP Guide</span>
            <i data-lucide="external-link" class="w-3 h-3"></i>
          </a>
          <button 
            onclick="selectClient('${client.id}'); document.getElementById('matcher-section').scrollIntoView({ behavior: 'smooth' });"
            class="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1">
            <span>Configure</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

// 4. Config Generator
function initConfigGenerator() {
  const form = document.getElementById("generator-form");
  if (!form) return;

  const updateConfigDisplay = () => {
    const client = document.getElementById("gen-client").value;
    const broker = document.getElementById("gen-broker").value;
    const mode = document.getElementById("gen-mode").value;
    const readOnly = document.getElementById("gen-readonly").checked;

    let output = "";

    if (broker === "zerodha") {
      if (mode === "remote") {
        output = JSON.stringify({
          mcpServers: {
            "zerodha-kite": {
              url: "https://mcp.kite.trade/mcp"
            }
          }
        }, null, 2);
      } else {
        output = JSON.stringify({
          mcpServers: {
            "zerodha-kite-local": {
              command: "uvx",
              args: ["kite-mcp-server"],
              env: {
                KITE_API_KEY: "your_api_key_here",
                KITE_ACCESS_TOKEN: "your_access_token_here",
                READ_ONLY_MODE: readOnly ? "true" : "false"
              }
            }
          }
        }, null, 2);
      }
    } else if (broker === "indmoney") {
      output = JSON.stringify({
        mcpServers: {
          "indmoney": {
            url: "https://mcp.indmoney.com/mcp"
          }
        }
      }, null, 2);
    } else if (broker === "angelone") {
      output = JSON.stringify({
        mcpServers: {
          "angel-smartapi": {
            command: "python3",
            args: ["-m", "angel_smartapi_mcp"],
            env: {
              SMARTAPI_API_KEY: "your_api_key",
              SMARTAPI_CLIENT_CODE: "your_client_code",
              SMARTAPI_PIN: "your_pin",
              SMARTAPI_TOTP_SECRET: "your_totp_secret",
              READ_ONLY: readOnly ? "true" : "false"
            }
          }
        }
      }, null, 2);
    } else if (broker === "groww") {
      output = JSON.stringify({
        mcpServers: {
          "groww-trade": {
            command: "python3",
            args: ["-m", "groww_trade_mcp"],
            env: {
              GROWW_API_KEY: "your_groww_key",
              GROWW_API_SECRET: "your_groww_secret",
              READ_ONLY: readOnly ? "true" : "false"
            }
          }
        }
      }, null, 2);
    }

    const codeEl = document.getElementById("gen-output-code");
    if (codeEl) {
      codeEl.textContent = output;
    }
  };

  form.addEventListener("change", updateConfigDisplay);
  updateConfigDisplay();

  const copyBtn = document.getElementById("copy-gen-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const code = document.getElementById("gen-output-code").textContent;
      copyToClipboard(code, "Generated configuration copied!");
    });
  }
}

// 5. Official Links Table with Filter & Search
function initLinksTable() {
  const container = document.getElementById("links-table-body");
  const searchInput = document.getElementById("links-search");
  const filterChips = document.querySelectorAll(".link-filter-chip");

  if (!container) return;

  const render = () => {
    let filtered = TRADING_DATA.officialLinks.filter(item => {
      const matchFilter = activeLinkFilter === "all" || item.category.toLowerCase().includes(activeLinkFilter) || item.type.toLowerCase().includes(activeLinkFilter);
      const matchSearch = searchQuery === "" || 
        item.title.toLowerCase().includes(searchQuery) || 
        item.url.toLowerCase().includes(searchQuery) ||
        item.type.toLowerCase().includes(searchQuery);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-8 text-center text-slate-500 text-sm">
            No links matching "${searchQuery}".
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = filtered.map(link => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
        <td class="px-6 py-4">
          <div class="font-semibold text-white text-sm flex items-center gap-2">
            <span>${link.title}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              ${link.badge}
            </span>
          </div>
          <div class="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-sm">${link.url}</div>
        </td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-1 text-xs rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
            ${link.category}
          </span>
        </td>
        <td class="px-6 py-4 text-xs text-slate-400">
          ${link.type}
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button 
              onclick="copyToClipboard('${link.url}', 'Link copied to clipboard!')"
              class="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Copy URL">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <a 
              href="${link.url}" 
              target="_blank" 
              class="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-all">
              <span>Open</span>
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          </div>
        </td>
      </tr>
    `).join("");

    lucide.createIcons();
  };

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      render();
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active-chip"));
      chip.classList.add("active-chip");
      activeLinkFilter = chip.getAttribute("data-filter");
      render();
    });
  });

  render();
}

// 6. Security Audit Checklist & Score
function initSecurityChecklist() {
  const checkboxes = document.querySelectorAll(".security-checkbox");
  const scoreText = document.getElementById("security-score-text");
  const scoreBar = document.getElementById("security-score-bar");
  const gradeBadge = document.getElementById("security-grade-badge");

  if (!checkboxes.length || !scoreText || !scoreBar || !gradeBadge) return;

  const updateScore = () => {
    const total = checkboxes.length;
    let checked = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) checked++;
    });

    const percentage = Math.round((checked / total) * 100);
    scoreText.textContent = `${percentage}%`;
    scoreBar.style.width = `${percentage}%`;

    if (percentage === 100) {
      gradeBadge.textContent = "Safe • Institutional Grade";
      gradeBadge.className = "px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold";
      scoreBar.className = "h-full bg-emerald-500 transition-all duration-300";
    } else if (percentage >= 60) {
      gradeBadge.textContent = "Moderate • Needs Hard Stops";
      gradeBadge.className = "px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold";
      scoreBar.className = "h-full bg-amber-500 transition-all duration-300";
    } else {
      gradeBadge.textContent = "High Risk • Fix Credential Exposure";
      gradeBadge.className = "px-3 py-1 text-xs rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold";
      scoreBar.className = "h-full bg-rose-500 transition-all duration-300";
    }
  };

  checkboxes.forEach(cb => {
    cb.addEventListener("change", updateScore);
  });

  updateScore();
}

// Helper escape functions
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeForAttribute(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}
