// Comprehensive dataset for AI Trading Connections Guide
const TRADING_DATA = {

  aiClients: [
    {
      id: "claude",
      name: "Claude (Anthropic)",
      tagline: "Desktop, Web & Claude Code",
      icon: "bot",
      badge: "Native Connector & Desktop MCP",
      configPath: {
        mac: "~/Library/Application Support/Claude/claude_desktop_config.json",
        win: "%APPDATA%\\Claude\\claude_desktop_config.json"
      },
      docsUrl: "https://docs.anthropic.com/en/docs/mcp",
      summary: "Claude natively supports MCP servers via Claude Desktop config and custom remote connectors in Claude Web/Team settings."
    },
    {
      id: "cursor",
      name: "Cursor IDE",
      tagline: "AI-First Code Editor",
      icon: "code-2",
      badge: "IDE Integration & SSE",
      configPath: {
        mac: "~/.cursor/mcp.json or Project: .cursor/mcp.json",
        win: "%USERPROFILE%\\.cursor\\mcp.json"
      },
      docsUrl: "https://docs.cursor.com/context/model-context-protocol",
      summary: "Cursor provides built-in Model Context Protocol support with stdio and remote HTTP/SSE streaming connection modes."
    },
    {
      id: "antigravity",
      name: "Google Antigravity",
      tagline: "Advanced Agentic Coding Environment",
      icon: "sparkles",
      badge: "Deep Agentic & Tool Ecosystem",
      configPath: {
        mac: "~/.gemini/config/mcp_config.json or .agents/mcp_config.json",
        win: "%USERPROFILE%\\.gemini\\config\\mcp_config.json"
      },
      docsUrl: "https://www.antigravity.google/docs/mcp",
      summary: "Antigravity supports hierarchical MCP configs, native tool definitions, background tasks, and seamless remote/stdio server connections."
    },
    {
      id: "chatgpt",
      name: "ChatGPT / OpenAI",
      tagline: "OpenAI Developer Platform",
      icon: "cpu",
      badge: "Developer API & Remote Tools",
      configPath: {
        mac: "OpenAI API Tool Call payload / Custom Action Schema",
        win: "OpenAI API Tool Call payload / Custom Action Schema"
      },
      docsUrl: "https://platform.openai.com/docs/quickstart/make-your-first-api-request",
      summary: "OpenAI supports remote MCP servers as tools via Responses API, Assistants API, and Custom GPT Actions."
    }
  ],

  brokers: [
    {
      id: "indmoney",
      name: "INDmoney",
      type: "Official Hosted MCP",
      status: "Official Remote Ready",
      difficulty: "Easiest (Zero-Code)",
      badgeColor: "emerald",
      endpoint: "https://mcp.indmoney.com/mcp",
      portalUrl: "https://www.indmoney.com/mcp",
      readOnly: true,
      description: "INDmoney provides an official, read-only remote MCP endpoint directly authenticated via OTP & MPIN.",
      features: [
        "Read-only portfolio tracking",
        "Net worth and investment analytics",
        "Mutual funds & Indian/US stock tracking",
        "No API key maintenance required"
      ],
      authFlow: "Mobile Number + OTP + MPIN verification via official INDmoney authorization webpage."
    },
    {
      id: "zerodha",
      name: "Zerodha (Kite)",
      type: "Official Hosted MCP & Open Source",
      status: "Official Kite MCP",
      difficulty: "Easy",
      badgeColor: "blue",
      endpoint: "https://mcp.kite.trade/mcp",
      githubUrl: "https://github.com/zerodha/kite-mcp-server",
      portalUrl: "https://kite.trade/docs/connect/v3/",
      supportUrl: "https://support.zerodha.com/category/trading-and-markets/general-kite/others-kite/articles/connect-zerodha-ai-assistant",
      readOnly: false,
      description: "Zerodha provides an open-source Kite MCP server and a hosted remote MCP server leveraging Kite Connect API v3.",
      features: [
        "Live market quotes & ticker depth",
        "Portfolio holdings and positions",
        "Order history & execution status",
        "Order placement (when authorized with write tokens)"
      ],
      authFlow: "Kite Connect API Key + API Secret + daily Request Token / Access Token."
    },
    {
      id: "angelone",
      name: "Angel One (SmartAPI)",
      type: "Developer API (Custom Bridge)",
      status: "SmartAPI Integration",
      difficulty: "Intermediate",
      badgeColor: "amber",
      endpoint: "Local / Self-hosted MCP Server",
      portalUrl: "https://smartapi.angelone.in/",
      docsUrl: "https://smartapi.angelone.in/docs",
      createAppUrl: "https://smartapi.angelone.in/create",
      readOnly: false,
      description: "Angel One offers SmartAPI for full algorithmic capabilities. Connect via an MCP wrapper bridging SmartAPI endpoints to your AI assistant.",
      features: [
        "Full trading capabilities (Equity, F&O, Commodity, Currency)",
        "Historical OHLCV candle data",
        "Live WebSocket feeds",
        "Order management & margin calculator"
      ],
      authFlow: "SmartAPI Key + Client Code + Password/PIN + TOTP Seed."
    },
    {
      id: "groww",
      name: "Groww",
      type: "Developer Trade API (Custom Bridge)",
      status: "Trading API Integration",
      difficulty: "Intermediate",
      badgeColor: "purple",
      endpoint: "Local / Self-hosted MCP Server",
      portalUrl: "https://groww.in/trade-api/docs",
      curlUrl: "https://groww.in/trade-api/docs/curl",
      sdkUrl: "https://groww.in/trade-api/docs/python-sdk",
      ordersUrl: "https://groww.in/trade-api/docs/curl/orders",
      liveDataUrl: "https://groww.in/trade-api/docs/curl/live-data",
      portfolioUrl: "https://groww.in/trade-api/docs/curl/portfolio",
      instrumentsUrl: "https://groww.in/trade-api/docs/curl/instruments",
      readOnly: false,
      description: "Groww's modern Trading API supports order placement, portfolio analytics, and live market quotes through an MCP bridge.",
      features: [
        "Orders placement, modification & cancellation",
        "Live market data & real-time quotes",
        "Portfolio holdings & positions synchronization",
        "Complete instruments master database"
      ],
      authFlow: "Groww Trade API Key + Secret + JWT Session Token."
    }
  ],

  // Specific guides and snippet generator rules per pair
  connections: {
    "claude-indmoney": {
      recommended: true,
      difficulty: "Very Easy",
      flowType: "Hosted Remote Connector",
      headline: "Claude + INDmoney Official Remote Setup",
      steps: [
        "Open Claude Web (claude.ai) or Claude Desktop.",
        "Navigate to <strong>Settings</strong> → <strong>Connectors</strong> (or Integrations).",
        "Click <strong>Add custom connector</strong>.",
        "Paste the hosted MCP URL: <code>https://mcp.indmoney.com/mcp</code>.",
        "Click <strong>Connect</strong>.",
        "A popup will open INDmoney's official auth page: enter your Mobile Number, verify OTP, and enter your MPIN.",
        "Approve access. Claude can now analyze your portfolio, net worth, and holdings in real time!"
      ],
      securityNote: "INDmoney MCP is strictly read-only. It cannot place trades or move funds.",
      configSnippet: `{
  // Configured via Claude Web Settings UI
  // Connector URL:
  "url": "https://mcp.indmoney.com/mcp"
}`
    },

    "claude-zerodha": {
      recommended: true,
      difficulty: "Easy",
      flowType: "Hosted SSE / Local Server",
      headline: "Claude + Zerodha Kite MCP Setup",
      steps: [
        "Ensure you have a Zerodha Kite Connect developer app and API credentials.",
        "For Claude Desktop: Open your <code>claude_desktop_config.json</code>.",
        "Add the official Kite MCP server definition using either the hosted URL or local Python runner.",
        "Restart Claude Desktop. Verify the hammer icon (tools) shows Kite tools like <code>get_holdings</code>, <code>get_margins</code>, and <code>get_quote</code>."
      ],
      securityNote: "Never paste your Kite API Secret or daily access token into the chat box. Configure them in the JSON config or environment variables.",
      configSnippet: `{
  "mcpServers": {
    "zerodha-kite": {
      "url": "https://mcp.kite.trade/mcp"
    }
  }
}`
    },

    "antigravity-zerodha": {
      recommended: true,
      difficulty: "Easy",
      flowType: "Remote MCP Server",
      headline: "Antigravity + Zerodha Kite MCP Setup",
      steps: [
        "In your Antigravity project, open or create <code>.agents/mcp_config.json</code> (or global <code>~/.gemini/config/mcp_config.json</code>).",
        "Add the official Zerodha Kite remote MCP configuration.",
        "Antigravity will automatically load the Kite MCP tools into your agent context.",
        "You can now ask Antigravity to analyze your portfolio, monitor live quotes, and write backtesting scripts against your real positions."
      ],
      securityNote: "Keep trading execution disabled until you've verified data models with paper-trading.",
      configSnippet: `{
  "mcpServers": {
    "zerodha-kite": {
      "url": "https://mcp.kite.trade/mcp"
    }
  }
}`
    },

    "cursor-zerodha": {
      recommended: true,
      difficulty: "Easy",
      flowType: "Remote SSE MCP Server",
      headline: "Cursor + Zerodha Kite MCP Setup",
      steps: [
        "Open Cursor Settings → Features → MCP Servers.",
        "Click <strong>+ Add New MCP Server</strong>.",
        "Set Type to <strong>SSE</strong> (or HTTP).",
        "Name: <code>zerodha-kite</code>, URL: <code>https://mcp.kite.trade/mcp</code>.",
        "Alternatively, save to <code>.cursor/mcp.json</code> in your project root.",
        "Open Cursor Composer or Agent and use @zerodha-kite tools directly."
      ],
      securityNote: "Use project-level gitignore to ensure secrets never leak to GitHub.",
      configSnippet: `{
  "mcpServers": {
    "zerodha-kite": {
      "url": "https://mcp.kite.trade/mcp"
    }
  }
}`
    },

    "generic-angelone": {
      recommended: false,
      difficulty: "Intermediate",
      flowType: "Custom MCP Bridge → SmartAPI",
      headline: "Angel One SmartAPI Bridge Setup",
      steps: [
        "Log in to <a href='https://smartapi.angelone.in/' target='_blank' class='text-cyan-400 underline'>SmartAPI Portal</a> and create an app to get your <code>API_KEY</code>.",
        "Install the official Python SDK: <code>pip install smartapi-python pyotp mcp</code>.",
        "Run the lightweight SmartAPI FastMCP server bridge on your machine.",
        "Point your AI client (Antigravity, Cursor, or Claude) to your local bridge script via stdio."
      ],
      securityNote: "Generate TOTP using pyotp locally inside your script. Do not expose TOTP keys to third-party servers.",
      configSnippet: `{
  "mcpServers": {
    "angel-smartapi": {
      "command": "python3",
      "args": ["-m", "angel_mcp_bridge"],
      "env": {
        "SMARTAPI_API_KEY": "YOUR_API_KEY",
        "SMARTAPI_CLIENT_CODE": "YOUR_CLIENT_CODE",
        "SMARTAPI_PIN": "YOUR_PIN",
        "SMARTAPI_TOTP_TOKEN": "YOUR_TOTP_SECRET"
      }
    }
  }
}`
    },

    "generic-groww": {
      recommended: false,
      difficulty: "Intermediate",
      flowType: "Custom MCP Bridge → Groww Trade API",
      headline: "Groww Trade API Bridge Setup",
      steps: [
        "Access <a href='https://groww.in/trade-api/docs' target='_blank' class='text-cyan-400 underline'>Groww Trade API Documentation</a> and generate API access.",
        "Install the Groww SDK: <code>pip install groww-trade-api mcp</code>.",
        "Configure an MCP bridge server that wraps Groww's orders, live-data, and portfolio endpoints.",
        "Connect the MCP bridge to your AI assistant using stdio configuration."
      ],
      securityNote: "Keep order placement functions behind explicit confirmation guards in your bridge code.",
      configSnippet: `{
  "mcpServers": {
    "groww-trade": {
      "command": "python3",
      "args": ["-m", "groww_mcp_bridge"],
      "env": {
        "GROWW_API_KEY": "YOUR_API_KEY",
        "GROWW_API_SECRET": "YOUR_API_SECRET"
      }
    }
  }
}`
    }
  },

  officialLinks: [
    { title: "INDmoney Official MCP Portal", url: "https://www.indmoney.com/mcp", category: "Broker", type: "Official Setup", badge: "Live" },
    { title: "INDmoney Hosted MCP URL", url: "https://mcp.indmoney.com/mcp", category: "Broker", type: "Hosted Server", badge: "Live" },
    { title: "Zerodha AI Connection Guide", url: "https://support.zerodha.com/category/trading-and-markets/general-kite/others-kite/articles/connect-zerodha-ai-assistant", category: "Broker", type: "Official Guide", badge: "Article" },
    { title: "Zerodha Kite MCP Server Repo", url: "https://github.com/zerodha/kite-mcp-server", category: "Broker", type: "Open Source", badge: "GitHub" },
    { title: "Zerodha Hosted Kite MCP Endpoint", url: "https://mcp.kite.trade/mcp", category: "Broker", type: "Hosted Server", badge: "Live" },
    { title: "Zerodha Kite Connect v3 Docs", url: "https://kite.trade/docs/connect/v3/", category: "Broker", type: "API Docs", badge: "Docs" },
    { title: "Angel One SmartAPI Home", url: "https://smartapi.angelone.in/", category: "Broker", type: "Portal", badge: "Live" },
    { title: "Angel One SmartAPI Docs", url: "https://smartapi.angelone.in/docs", category: "Broker", type: "API Docs", badge: "Docs" },
    { title: "Angel One Create SmartAPI App", url: "https://smartapi.angelone.in/create", category: "Broker", type: "Developer App", badge: "Console" },
    { title: "Groww Trade API Home", url: "https://groww.in/trade-api/docs", category: "Broker", type: "API Docs", badge: "Docs" },
    { title: "Groww API cURL Quickstart", url: "https://groww.in/trade-api/docs/curl", category: "Broker", type: "API Docs", badge: "Guide" },
    { title: "Groww Python SDK", url: "https://groww.in/trade-api/docs/python-sdk", category: "Broker", type: "SDK", badge: "Python" },
    { title: "Groww Orders API Reference", url: "https://groww.in/trade-api/docs/curl/orders", category: "Broker", type: "API Docs", badge: "Orders" },
    { title: "Groww Live Data API", url: "https://groww.in/trade-api/docs/curl/live-data", category: "Broker", type: "API Docs", badge: "Streaming" },
    { title: "Groww Portfolio API", url: "https://groww.in/trade-api/docs/curl/portfolio", category: "Broker", type: "API Docs", badge: "Portfolio" },
    { title: "Groww Instruments Master", url: "https://groww.in/trade-api/docs/curl/instruments", category: "Broker", type: "API Docs", badge: "Instruments" },
    { title: "Anthropic Claude MCP Guide", url: "https://docs.anthropic.com/en/docs/mcp", category: "AI Client", type: "Official Docs", badge: "Docs" },
    { title: "Cursor MCP Specification Guide", url: "https://docs.cursor.com/context/model-context-protocol", category: "AI Client", type: "Official Docs", badge: "Docs" },
    { title: "OpenAI Developer API Quickstart", url: "https://platform.openai.com/docs/quickstart/make-your-first-api-request", category: "AI Client", type: "Official Docs", badge: "Docs" },
    { title: "Google Antigravity MCP Guide", url: "https://www.antigravity.google/docs/mcp", category: "AI Client", type: "Official Docs", badge: "Docs" }
  ],

  pythonBridgeSnippet: `"""
Sample Lightweight FastMCP Bridge for Indian Brokers (Angel One / Groww)
Runs as a local MCP server that exposes safe, read-only tools to your AI assistant.
Install: pip install mcp uvicorn pydantic
"""

from mcp.server.fastmcp import FastMCP
import os

# Initialize FastMCP Server
mcp = FastMCP("IndianBrokerBridge")

@mcp.tool()
def get_portfolio_summary() -> dict:
    """Fetch current holdings, total portfolio value, and P&L."""
    # Connect with official broker SDK (e.g. SmartAPI or Groww SDK)
    return {
        "status": "success",
        "total_value": 450200.50,
        "unrealized_pnl": 34120.00,
        "holdings_count": 8,
        "top_holdings": ["RELIANCE", "TCS", "INFY", "HDFCBANK"]
    }

@mcp.tool()
def get_market_quote(symbol: str) -> dict:
    """Get live LTP, OHLC, and volume for an NSE/BSE symbol."""
    return {
        "symbol": symbol.upper(),
        "ltp": 2980.50,
        "change_percent": 1.45,
        "volume": 2450000,
        "day_high": 2995.00,
        "day_low": 2940.10
    }

if __name__ == "__main__":
    # Runs over stdio for Claude Desktop, Cursor, or Antigravity
    mcp.run()
`
};

if (typeof window !== "undefined") {
  window.TRADING_DATA = TRADING_DATA;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TRADING_DATA;
}
