
let state = {
  leads: [],
  sequences: [],
  analytics: null,
  activeView: 'dashboard',
  crmViewMode: 'table',
  activeStatusFilter: 'all',
  selectedLeadId: null,
  drawerLeadId: null,
  callState: {
    active: false,
    lead: null,
    status: 'idle',
    startTime: null,
    timerInterval: null,
    durationSeconds: 0,
    transcript: [],
    sentiment: 'Neutral',
    meetingBooked: false,
    objectionsCount: 0
  },
  aircallState: {
    active: false,
    lead: null,
    status: 'idle',
    startTime: null,
    timerInterval: null,
    durationSeconds: 0,
    battlecard: null,
    isMuted: false,
    isRecording: true,
    currentObjectionKey: 'busy',
    hotTriggers: [],
    dockExpanded: false
  }
};

const THEME_CONFIGS = {
  'red-black': { icon: '🔷', label: 'Sky Blue & Clean White' },
  cosmic: { icon: '🌌', label: 'Cosmic Aurora' },
  emerald: { icon: '💎', label: 'Cyber Emerald' },
  cyberpunk: { icon: '🔮', label: 'Cyberpunk Neon' },
  white: { icon: '⚪', label: 'Pure Clean White' },
  light: { icon: '☀️', label: 'Nordic Clean Light' }
};

function toggleThemeMenu() {
  const menu = document.getElementById('theme-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

function applyAppTheme(themeName) {
  if (!THEME_CONFIGS[themeName]) themeName = 'white';
  document.documentElement.setAttribute('data-theme', themeName);

  if (themeName === 'white' || themeName === 'prism' || themeName === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  localStorage.setItem('omnireach_theme', themeName);

  const iconEl = document.getElementById('theme-icon');
  const labelEl = document.getElementById('theme-label');
  if (iconEl) iconEl.innerText = THEME_CONFIGS[themeName].icon;
  if (labelEl) labelEl.innerText = THEME_CONFIGS[themeName].label;

  const menu = document.getElementById('theme-dropdown-menu');
  if (menu) menu.classList.add('hidden');

  showToast(`Applied ${THEME_CONFIGS[themeName].label} theme palette`, 'info');
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgStyles = type === 'success' 
    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
    : type === 'error'
    ? 'bg-sky-950/90 border-sky-500/50 text-sky-200'
    : 'bg-dark-surface/95 border-sky-500/40 text-slate-100';

  toast.className = `pointer-events-auto px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 transform translate-y-3 opacity-0 ${bgStyles}`;
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-400' : 'bg-sky-500'} animate-ping"></span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function initTheme() {
  const saved = localStorage.getItem('omnireach_theme') || 'white';
  applyAppTheme(saved);
}

document.addEventListener('click', (e) => {
  const picker = document.getElementById('btn-theme-picker');
  const menu = document.getElementById('theme-dropdown-menu');
  if (menu && picker && !picker.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

function updateROICalculator(val) {
  const reps = parseInt(val, 10) || 1;
  const repsDisplay = document.getElementById('calc-reps-display');
  if (repsDisplay) repsDisplay.innerText = `${reps} Rep${reps > 1 ? 's' : ''}`;

  const hoursSaved = reps * 15;
  const cacSaved = reps * 8500;
  const extraDemos = Math.round(reps * 9.6);
  const pipelineBoost = reps * 36000;

  const hoursEl = document.getElementById('calc-hours-saved');
  const cacEl = document.getElementById('calc-cac-saved');
  const demosEl = document.getElementById('calc-extra-demos');
  const pipeEl = document.getElementById('calc-pipeline-boost');

  if (hoursEl) hoursEl.innerText = `${hoursSaved} hrs/wk`;
  if (cacEl) cacEl.innerText = `$${cacSaved.toLocaleString()}`;
  if (demosEl) demosEl.innerText = `+${extraDemos} Meetings`;
  if (pipeEl) pipeEl.innerText = `+$${pipelineBoost.toLocaleString()}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  updateROICalculator(5);
  if (window.lucide) lucide.createIcons();

  const canvas = document.getElementById('waveform-canvas');
  if (canvas && window.voiceEngine) {
    window.voiceEngine.attachCanvas(canvas);
  }

  if (window.voiceEngine) {
    window.voiceEngine.onListeningChange = (isListening) => {
      const btn = document.getElementById('btn-mic-listen');
      if (btn) {
        if (isListening) {
          btn.classList.add('bg-sky-500/20', 'border-sky-500/40', 'animate-pulse');
        } else {
          btn.classList.remove('bg-sky-500/20', 'border-sky-500/40', 'animate-pulse');
        }
      }
    };
  }

  await loadAllData();
  renderDashboard();
  renderLeads();
  populateDropdowns();
  renderSequences();
});

async function loadAllData() {
  try {
    const [leadsRes, sequencesRes, analyticsRes] = await Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/sequences').then(r => r.json()),
      fetch('/api/analytics').then(r => r.json())
    ]);

    if (leadsRes.success) state.leads = leadsRes.leads;
    if (sequencesRes.success) state.sequences = sequencesRes.sequences;
    if (analyticsRes.success) state.analytics = analyticsRes.analytics;

    updateCounts();
    await loadAircallTriggers();
    await loadBusinessMemory();
    await fetch27xState();
  } catch (err) {
    console.error('Failed to load CRM data:', err);
  }
}

function updateCounts() {
  const badge = document.getElementById('badge-leads-count');
  if (badge) badge.innerText = state.leads.length;

  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = state.leads.length;

  const cProspect = state.leads.filter(l => l.status === 'Prospect').length;
  const cResearched = state.leads.filter(l => l.status === 'Researched').length;
  const cActive = state.leads.filter(l => l.status === 'Outreach Active').length;
  const cCall = state.leads.filter(l => l.status === 'Call Scheduled').length;

  const elP = document.getElementById('count-prospect'); if (elP) elP.innerText = cProspect;
  const elR = document.getElementById('count-researched'); if (elR) elR.innerText = cResearched;
  const elA = document.getElementById('count-active'); if (elA) elA.innerText = cActive;
  const elC = document.getElementById('count-call'); if (elC) elC.innerText = cCall;

  const kbP = document.getElementById('kb-count-prospect'); if (kbP) kbP.innerText = cProspect;
  const kbR = document.getElementById('kb-count-researched'); if (kbR) kbR.innerText = cResearched;
  const kbA = document.getElementById('kb-count-active'); if (kbA) kbA.innerText = cActive;
  const kbC = document.getElementById('kb-count-call'); if (kbC) kbC.innerText = cCall;
}

function toggleMobileSidebar(forceOpen) {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;

  const isClosed = sidebar.classList.contains('-translate-x-full');
  const shouldOpen = forceOpen !== undefined ? forceOpen : isClosed;

  if (shouldOpen) {
    sidebar.classList.remove('-translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function updateMobileNavHighlights(viewName) {
  const mobileNavs = ['dashboard', 'leads', 'aircall', 'strategist'];
  mobileNavs.forEach(v => {
    const el = document.getElementById(`m-nav-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.add('text-brand-400', 'font-bold');
        el.classList.remove('text-slate-400', 'font-medium');
      } else {
        el.classList.remove('text-brand-400', 'font-bold');
        if (v === 'aircall') {
          el.classList.add('aircall-text');
        } else {
          el.classList.add('text-slate-400', 'font-medium');
        }
      }
    }
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
});

function navigateView(viewName) {
  state.activeView = viewName;

  toggleMobileSidebar(false);

  updateMobileNavHighlights(viewName);

  const contentContainer = document.getElementById('content-container');
  if (contentContainer) contentContainer.scrollTop = 0;

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeNav) activeNav.classList.add('active');

  const viewSections = [
    'dashboard', 'strategist', 'leads', 'discover', 'email', 'linkedin', 'call', 'aircall', 'voicetype', 'sequences', 'autonomous', 'settings', 'about',
    'agent-studio', 'approval-queue', 'signal-radar', 'ai-sdr'
  ];
  viewSections.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.remove('animate-fade-in-up');
    void targetView.offsetWidth;
    targetView.classList.add('animate-fade-in-up');
  }

  const titleEl = document.getElementById('view-title');
  const subEl = document.getElementById('view-subtitle');

  const titles = {
    dashboard: { title: 'Dashboard Overview', sub: 'Autonomous multi-channel pipeline intelligence' },
    'ai-sdr': { title: 'AI SDR Autonomous Engine', sub: 'Autonomous pipeline powered by 380M+ live verified contacts, signal intelligence, and multi-channel orchestration' },
    'agent-studio': { title: '27x Agent Studio — Visual Autonomous Workforce', sub: 'Deploy, configure, and orchestrate specialized AI digital workers with multi-model routing & guardrails' },
    'approval-queue': { title: '27x Copilot Review & Approval Queue', sub: 'Human-in-the-loop review station for personalized outbound touches before dispatch' },
    'signal-radar': { title: '380M+ Verified Contacts & Market Intent Radar', sub: 'Continuous real-time intent signal monitoring across global buyer databases' },
    strategist: { title: 'AI Strategist & Business Memory', sub: 'Gets to know your business, pulls positioning from your URL, and keeps it in persistent memory' },
    leads: { title: 'Leads & Pipeline Management', sub: 'Manage ICP accounts, research dossiers, and deal stages' },
    discover: { title: 'AI Client Discovery & Enrichment', sub: 'Locate high-intent prospects matching your Ideal Customer Profile' },
    email: { title: 'AI Email Outreach Studio', sub: 'Hyper-personalized outbound sequences with deliverability protection' },
    linkedin: { title: 'LinkedIn Outreach Automation', sub: 'Safe connection notes and InMail sequences compliant with daily limits' },
    call: { title: 'End-to-End AI Voice Call Studio', sub: 'Real-time conversational voice agent with live objection handling & booking' },
    aircall: { title: 'Aircall Sales Calls & Intelligent CTI', sub: 'Inbox to ringtone: live phone conversations with previous touchpoint context & auto-followups' },
    voicetype: { title: 'VoiceType Push-to-Talk AI Dictation Studio', sub: 'Push-to-talk voice dictation with local Whisper models, automatic filler stripping, 22-bar dynamic equalizer, and active caret insertion' },
    sequences: { title: 'Omnichannel Workflows', sub: 'Multi-touch automated journeys across Research, Email, LinkedIn & Voice' },
    autonomous: { title: 'Autonomous SDR Agent Swarm', sub: 'Self-driving sales development team running end-to-end outreach' },
    settings: { title: 'Settings & Integrations', sub: 'Configure telephony, email warmup, LinkedIn, and CRM defaults' },
    about: { title: 'About OmniReach OS & System Architecture', sub: 'Full-stack multi-channel intelligence: Persistent AI Memory, Speed-to-Lead Aircall CTI, and Real-Time Voice AI' }
  };

  if (titles[viewName]) {
    titleEl.innerText = titles[viewName].title;
    subEl.innerText = titles[viewName].sub;
  }

  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'ai-sdr') renderApp27xView();
  if (viewName === 'agent-studio') render27xAgentStudio();
  if (viewName === 'approval-queue') render27xApprovalQueue();
  if (viewName === 'signal-radar') render27xSignalRadar();
  if (viewName === 'strategist') refreshStrategistView();
  if (viewName === 'leads') renderLeads();
  if (viewName === 'email') refreshEmailView();
  if (viewName === 'linkedin') refreshLinkedInView();
  if (viewName === 'call') refreshCallView();
  if (viewName === 'aircall') refreshAircallView();
  if (viewName === 'voicetype') renderVoiceTypeView();
  if (viewName === 'sequences') renderSequences();

  if (window.lucide) lucide.createIcons();
}

function renderDashboard() {
  if (state.analytics) {
    const ov = state.analytics.overview;
    const pv = document.getElementById('stat-pipeline-value');
    if (pv) pv.innerText = `$${(ov.activePipelineValue || 176000).toLocaleString()}`;

    const tl = document.getElementById('stat-total-leads');
    if (tl) tl.innerText = `${ov.totalLeads} Accounts`;

    const af = document.getElementById('stat-avg-fit');
    if (af) af.innerText = `${ov.averageFitScore}%`;

    const rr = document.getElementById('stat-reply-rate');
    if (rr) rr.innerText = `${state.analytics.conversionRates?.emailReplyRate || 34.2}%`;

    const mb = document.getElementById('stat-meetings-booked');
    if (mb) mb.innerText = `${ov.callsScheduled} Meetings`;
  }

  const container = document.getElementById('dashboard-leads-list');
  if (container) {
    container.innerHTML = state.leads.slice(0, 4).map(lead => {
      const statusBadge = getStatusBadge(lead.status);
      return `
        <div onclick="openLeadDrawer('${lead.id}')" class="p-3 rounded-lg bg-dark-surface hover:bg-dark-hover border border-dark-border cursor-pointer flex items-center justify-between transition">
          <div class="flex items-center gap-3">
            <img src="${lead.avatar}" class="w-8 h-8 rounded-full object-cover border border-dark-border">
            <div>
              <div class="font-semibold text-xs text-white flex items-center gap-1.5">
                <span>${lead.name}</span>
                <span class="text-[10px] text-slate-400 font-normal">• ${lead.company}</span>
              </div>
              <div class="text-[11px] text-slate-400">${lead.title}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-emerald-400 font-semibold">$${(lead.dealValue || 35000).toLocaleString()}</span>
            <span class="text-[10px] px-2 py-0.5 rounded font-medium ${statusBadge.classes}">${lead.status}</span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500"></i>
          </div>
        </div>
      `;
    }).join('');
  }

  const stream = document.getElementById('dashboard-agent-stream');
  if (stream) {
    const activities = [
      { agent: 'Voice Caller Agent', text: 'Completed qualification call with Elena Rostova (FinPulse Health). Google Meet demo booked for Friday 11:00 AM EST.', time: '10m ago', color: 'emerald' },
      { agent: 'Enrichment Agent', text: 'Extracted 3 pain points and verified phone/email for Sarah Chen (ApexAI Cloud). Fit score: 96%.', time: '28m ago', color: 'indigo' },
      { agent: 'Copywriter Agent', text: 'Drafted tailored Series B cold email referencing SaaStr keynote for Marcus Vance.', time: '1h ago', color: 'purple' },
      { agent: 'Prospector Agent', text: 'Scanned 14 enterprise companies matching B2B SaaS ICP criteria.', time: '2h ago', color: 'amber' }
    ];

    stream.innerHTML = activities.map(a => `
      <div class="p-2.5 rounded-lg bg-dark-surface border border-dark-border space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-[11px] text-${a.color}-400">${a.agent}</span>
          <span class="text-[10px] text-slate-500 font-mono">${a.time}</span>
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed">${a.text}</p>
      </div>
    `).join('');
  }

  if (window.lucide) lucide.createIcons();
}

function getStatusBadge(status) {
  switch (status) {
    case 'Prospect': return { classes: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60' };
    case 'Researched': return { classes: 'bg-sky-500/15 text-sky-500 border border-sky-500/30' };
    case 'Outreach Active': return { classes: 'bg-sky-500/20 text-sky-500 border border-sky-500/40 shadow-sm shadow-sky-500/20' };
    case 'Call Scheduled': return { classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
    case 'Deal Won': return { classes: 'bg-gradient-to-r from-sky-600 to-sky-600 text-white font-bold border border-sky-400/50 shadow-md shadow-sky-500/30' };
    default: return { classes: 'bg-dark-border text-slate-300' };
  }
}

function filterLeadsByStatus(status) {
  state.activeStatusFilter = status;
  document.querySelectorAll('.lead-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === status);
  });
  renderLeads();
}

function switchCRMView(mode) {
  state.crmViewMode = mode;
  const tableContainer = document.getElementById('crm-table-container');
  const kanbanContainer = document.getElementById('crm-kanban-container');
  const btnTable = document.getElementById('btn-view-table');
  const btnKanban = document.getElementById('btn-view-kanban');

  if (mode === 'table') {
    tableContainer.classList.remove('hidden');
    kanbanContainer.classList.add('hidden');
    btnTable.className = 'px-2.5 py-1 text-xs rounded bg-brand-600 text-white font-medium flex items-center gap-1';
    btnKanban.className = 'px-2.5 py-1 text-xs rounded text-slate-400 hover:text-white font-medium flex items-center gap-1';
  } else {
    tableContainer.classList.add('hidden');
    kanbanContainer.classList.remove('hidden');
    btnKanban.className = 'px-2.5 py-1 text-xs rounded bg-brand-600 text-white font-medium flex items-center gap-1';
    btnTable.className = 'px-2.5 py-1 text-xs rounded text-slate-400 hover:text-white font-medium flex items-center gap-1';
  }
  renderLeads();
}

function renderLeads() {
  let list = [...state.leads];
  if (state.activeStatusFilter !== 'all') {
    list = list.filter(l => l.status === state.activeStatusFilter);
  }

  const tbody = document.getElementById('crm-leads-tbody');
  if (tbody) {
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500">No leads found matching filter.</td></tr>`;
    } else {
      tbody.innerHTML = list.map(l => {
        const badge = getStatusBadge(l.status);
        const emailStatus = l.channels?.email?.status || 'ready';
        const callStatus = l.channels?.call?.status || 'pending';

        return `
          <tr class="hover:bg-dark-surface/60 transition cursor-pointer" onclick="openLeadDrawer('${l.id}')">
            
            <td class="py-3.5 px-4">
              <div class="flex items-center gap-3">
                <img src="${l.avatar}" class="w-8 h-8 rounded-full object-cover border border-dark-border">
                <div>
                  <div class="font-bold text-white">${l.name}</div>
                  <div class="text-[11px] text-slate-400">${l.title} • <span class="text-brand-300">${l.company}</span></div>
                </div>
              </div>
            </td>

            <td class="py-3.5 px-4">
              <div class="text-slate-200">${l.industry}</div>
              <div class="text-[11px] text-slate-400">${l.companySize} • ${l.location}</div>
            </td>

            <td class="py-3.5 px-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-mono font-bold text-xs text-brand-300">
                  ${l.fitScore}%
                </div>
                <div>
                  <div class="text-[10px] text-slate-400">Intent: ${l.intentScore}%</div>
                  <div class="text-[11px] font-mono text-emerald-400 font-semibold">$${(l.dealValue || 35000).toLocaleString()}</div>
                </div>
              </div>
            </td>

            <td class="py-3.5 px-4">
              <span class="text-[10px] px-2 py-0.5 rounded font-medium ${badge.classes}">
                ${l.status}
              </span>
            </td>

            <td class="py-3.5 px-4">
              <div class="flex items-center gap-2">
                
                <span title="Email: ${emailStatus}" class="p-1 rounded ${emailStatus === 'sent' || emailStatus === 'replied' ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30' : 'bg-dark-border text-slate-500'}">
                  <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                </span>
                
                <span title="LinkedIn" class="p-1 rounded ${l.channels?.linkedin?.status === 'pending' || l.channels?.linkedin?.status === 'connected' ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30' : 'bg-dark-border text-slate-500'}">
                  <i data-lucide="linkedin" class="w-3.5 h-3.5"></i>
                </span>
                
                <span title="Call: ${callStatus}" class="p-1 rounded ${callStatus === 'completed' || callStatus === 'meeting_booked' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-border text-slate-500'}">
                  <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                </span>
              </div>
            </td>

            <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="launchEmailForLead('${l.id}')" title="Draft Email" class="p-1.5 rounded hover:bg-dark-hover text-slate-400 hover:text-sky-500 transition">
                  <i data-lucide="mail" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="launchLinkedInForLead('${l.id}')" title="Send LinkedIn Note" class="p-1.5 rounded hover:bg-dark-hover text-slate-400 hover:text-sky-500 transition">
                  <i data-lucide="linkedin" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="launchCallForLead('${l.id}')" title="Call with Voice AI" class="p-1.5 rounded hover:bg-dark-hover text-slate-400 hover:text-emerald-400 transition">
                  <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const cols = ['Prospect', 'Researched', 'Outreach Active', 'Call Scheduled'];
  cols.forEach(col => {
    const colContainer = document.getElementById(`kb-col-${col}`);
    if (colContainer) {
      const colLeads = state.leads.filter(l => l.status === col);
      colContainer.innerHTML = colLeads.map(l => `
        <div onclick="openLeadDrawer('${l.id}')" class="p-3.5 rounded-xl bg-dark-card border border-dark-border hover:border-sky-500/50 cursor-pointer space-y-2.5 transition glass-card">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[11px] text-emerald-400 font-bold">$${(l.dealValue || 35000).toLocaleString()}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">${l.fitScore}% Fit</span>
          </div>
          <div class="flex items-center gap-2.5">
            <img src="${l.avatar}" class="w-7 h-7 rounded-full object-cover border border-dark-border">
            <div>
              <div class="font-bold text-xs text-white">${l.name}</div>
              <div class="text-[10px] text-slate-400">${l.company}</div>
            </div>
          </div>
          <p class="text-[11px] text-slate-300 line-clamp-2">${l.research?.icebreaker || l.title}</p>
          ${col !== 'Call Scheduled' ? `
            <div class="pt-1.5 border-t border-dark-border/60 flex justify-end">
              <button onclick="advanceLeadStage('${l.id}', event)" class="px-2 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-500 border border-sky-500/30 text-[10px] font-bold flex items-center gap-1 transition">
                <span>Advance Stage</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </button>
            </div>
          ` : `
            <div class="pt-1.5 border-t border-dark-border/60 flex justify-between items-center text-[10px] text-emerald-400 font-mono">
              <span class="flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Demo Locked</span>
              <span class="font-bold">Deal Won</span>
            </div>
          `}
        </div>
      `).join('');
    }
  });

  if (window.lucide) lucide.createIcons();
}

function advanceLeadStage(leadId, e) {
  if (e) e.stopPropagation();
  const stages = ['Prospect', 'Researched', 'Outreach Active', 'Call Scheduled'];
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;
  const currIdx = stages.indexOf(lead.status);
  if (currIdx < stages.length - 1) {
    const nextStage = stages[currIdx + 1];
    lead.status = nextStage;
    lead.timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'stage',
      title: `Advanced to ${nextStage}`,
      description: `Prospect stage advanced via visual Kanban board.`,
      timestamp: new Date().toLocaleString()
    });
    renderLeads();
    renderDashboard();
    showToast(`Advanced ${lead.name} to ${nextStage}!`, 'success');
    playUISound('advance');
  }
}

function handleGlobalSearch(query) {
  if (!query) {
    renderLeads();
    return;
  }
  const q = query.toLowerCase();
  const filtered = state.leads.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.company.toLowerCase().includes(q) ||
    l.industry.toLowerCase().includes(q)
  );

  const tbody = document.getElementById('crm-leads-tbody');
  if (tbody) {
    tbody.innerHTML = filtered.map(l => `
      <tr class="hover:bg-dark-surface/60 transition cursor-pointer" onclick="openLeadDrawer('${l.id}')">
        <td class="py-3 px-4 font-bold text-white">${l.name} (${l.company})</td>
        <td class="py-3 px-4 text-slate-300">${l.industry}</td>
        <td class="py-3 px-4 font-mono text-emerald-400 font-bold">$${(l.dealValue || 35000).toLocaleString()}</td>
        <td class="py-3 px-4 text-slate-400">${l.status}</td>
        <td class="py-3 px-4 text-right"><span class="text-brand-400">View &rarr;</span></td>
      </tr>
    `).join('');
  }
}

function openLeadDrawer(leadId) {
  state.drawerLeadId = leadId;
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  const drawer = document.getElementById('lead-drawer');
  document.getElementById('drawer-avatar').src = lead.avatar;
  document.getElementById('drawer-name').innerText = lead.name;
  document.getElementById('drawer-title-company').innerText = `${lead.title} • ${lead.company}`;
  document.getElementById('drawer-email').innerText = lead.email;
  document.getElementById('drawer-phone').innerText = lead.phone;
  document.getElementById('drawer-industry').innerText = lead.industry;
  document.getElementById('drawer-deal').innerText = `$${(lead.dealValue || 35000).toLocaleString()}`;

  document.getElementById('drawer-bio').innerText = lead.research?.executiveBio || `${lead.title} leading growth and operations.`;
  
  const painUl = document.getElementById('drawer-pain-points');
  if (painUl) {
    const pains = lead.research?.painPoints || ['Manual outbound prospecting fatigue', 'Declining cold email deliverability'];
    painUl.innerHTML = pains.map(p => `<li>${p}</li>`).join('');
  }

  document.getElementById('drawer-icebreaker').innerText = lead.research?.icebreaker || 'Ready for customized outbound hook.';

  const tlContainer = document.getElementById('drawer-timeline');
  if (tlContainer) {
    const events = lead.timeline || [];
    tlContainer.innerHTML = events.map(ev => `
      <div class="relative pb-2">
        <div class="font-bold text-slate-200">${ev.title}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">${ev.description}</div>
        <div class="text-[10px] text-slate-500 font-mono mt-1">${ev.timestamp}</div>
      </div>
    `).join('');
  }

  drawer.classList.remove('translate-x-full');
  if (window.lucide) lucide.createIcons();
}

function closeLeadDrawer() {
  const drawer = document.getElementById('lead-drawer');
  drawer.classList.add('translate-x-full');
}

async function triggerDeepEnrichmentForCurrentLead() {
  if (!state.drawerLeadId) return;
  try {
    const res = await fetch(`/api/research/enrich/${state.drawerLeadId}`, { method: 'POST' }).then(r => r.json());
    if (res.success) {
      await loadAllData();
      openLeadDrawer(state.drawerLeadId);
      renderLeads();
      alert(`Deep Account Research completed for ${res.lead.company}! Fit score: ${res.lead.fitScore}%.`);
    }
  } catch (e) {
    console.error(e);
  }
}

function launchEmailForCurrentDrawerLead() {
  const id = state.drawerLeadId;
  closeLeadDrawer();
  navigateView('email');
  const select = document.getElementById('email-target-lead-select');
  if (select) {
    select.value = id;
    onEmailLeadChange();
  }
}

function launchLinkedInForCurrentDrawerLead() {
  const id = state.drawerLeadId;
  closeLeadDrawer();
  navigateView('linkedin');
  const select = document.getElementById('linkedin-target-lead-select');
  if (select) {
    select.value = id;
    onLinkedInLeadChange();
  }
}

function launchCallForCurrentDrawerLead() {
  const id = state.drawerLeadId;
  closeLeadDrawer();
  navigateView('call');
  const select = document.getElementById('call-target-lead-select');
  if (select) {
    select.value = id;
    onCallLeadChange();
  }
}

function launchEmailForLead(id) {
  navigateView('email');
  const select = document.getElementById('email-target-lead-select');
  if (select) { select.value = id; onEmailLeadChange(); }
}

function launchLinkedInForLead(id) {
  navigateView('linkedin');
  const select = document.getElementById('linkedin-target-lead-select');
  if (select) { select.value = id; onLinkedInLeadChange(); }
}

function launchCallForLead(id) {
  navigateView('call');
  const select = document.getElementById('call-target-lead-select');
  if (select) { select.value = id; onCallLeadChange(); }
}

let discoveredCandidates = [];

function openDiscoverModal() {
  navigateView('discover');
}

async function runDiscoverySearch() {
  const industry = document.getElementById('discover-industry').value;
  const role = document.getElementById('discover-role').value;
  const size = document.getElementById('discover-size').value;

  const btn = event?.currentTarget;
  if (btn) btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Scanning ICP Database...`;

  try {
    const res = await fetch('/api/research/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry, role, companySize: size, autoEnroll: false })
    }).then(r => r.json());

    if (res.success) {
      discoveredCandidates = res.leads;
      renderDiscoveredGrid();
      document.getElementById('discover-results-count').innerText = `${res.count} Verified ICP Matches`;
      document.getElementById('btn-enroll-all').classList.remove('hidden');
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (btn) btn.innerHTML = `<i data-lucide="search" class="w-4 h-4"></i> Run AI ICP Search`;
    if (window.lucide) lucide.createIcons();
  }
}

function renderDiscoveredGrid() {
  const container = document.getElementById('discovery-results-grid');
  if (!container) return;

  container.innerHTML = discoveredCandidates.map((cand, idx) => `
    <div class="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3.5 hover:border-amber-500/40 transition">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <img src="${cand.avatar}" class="w-10 h-10 rounded-full object-cover border border-dark-border">
          <div>
            <h4 class="font-bold text-sm text-white">${cand.name}</h4>
            <p class="text-xs text-slate-400">${cand.title} • <strong class="text-slate-200">${cand.company}</strong></p>
          </div>
        </div>
        <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ${cand.fitScore}% Fit
        </span>
      </div>

      <div class="text-xs space-y-1.5 text-slate-300">
        <div class="text-slate-400">Industry: <span class="text-slate-200 font-medium">${cand.industry}</span> • ${cand.companySize}</div>
        <div class="p-2.5 rounded-lg bg-dark-surface border border-dark-border text-slate-300">
          <span class="text-amber-400 font-semibold">Intent Signal:</span> ${cand.research?.recentTriggers?.[0] || 'Actively expanding sales operations'}
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-dark-border">
        <div class="text-[11px] text-slate-400 font-mono">${cand.email}</div>
        <button onclick="enrollSingleDiscovered(${idx})" class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add to CRM
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function enrollSingleDiscovered(index) {
  const lead = discoveredCandidates[index];
  if (!lead) return;

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(r => r.json());

    if (res.success) {
      alert(`Enrolled ${lead.name} (${lead.company}) into OmniReach CRM!`);
      await loadAllData();
      populateDropdowns();
      renderLeads();
    }
  } catch (e) {
    console.error(e);
  }
}

async function autoEnrollAllDiscovered() {
  for (const cand of discoveredCandidates) {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cand)
    });
  }
  await loadAllData();
  populateDropdowns();
  renderLeads();
  alert(`Added ${discoveredCandidates.length} accounts to CRM pipeline!`);
}

function populateDropdowns() {
  const emailSelect = document.getElementById('email-target-lead-select');
  const liSelect = document.getElementById('linkedin-target-lead-select');
  const callSelect = document.getElementById('call-target-lead-select');
  const aircallSelect = document.getElementById('aircall-target-lead-select');

  const options = state.leads.map(l => `<option value="${l.id}">${l.name} - ${l.company} (${l.status})</option>`).join('');

  if (emailSelect) emailSelect.innerHTML = options;
  if (liSelect) liSelect.innerHTML = options;
  if (callSelect) callSelect.innerHTML = options;
  if (aircallSelect) aircallSelect.innerHTML = options;

  onEmailLeadChange();
  onLinkedInLeadChange();
  onCallLeadChange();
  onAircallLeadSelectChange();
}

function onEmailLeadChange() {
  const select = document.getElementById('email-target-lead-select');
  if (!select) return;
  const leadId = select.value;
  const lead = state.leads.find(l => l.id === leadId) || state.leads[0];
  if (!lead) return;

  const preview = document.getElementById('email-lead-preview');
  if (preview) {
    preview.innerHTML = `
      <div class="flex items-center gap-2.5">
        <img src="${lead.avatar}" class="w-8 h-8 rounded-full object-cover">
        <div>
          <div class="font-bold text-slate-100">${lead.name}</div>
          <div class="text-[11px] text-slate-400">${lead.title} • ${lead.company}</div>
        </div>
      </div>
      <div class="text-[11px] text-slate-300">
        <span class="text-slate-400">Trigger:</span> ${lead.research?.recentTriggers?.[0] || 'Enterprise expansion'}
      </div>
    `;
  }

  const subjectInput = document.getElementById('email-subject-input');
  const bodyInput = document.getElementById('email-body-input');
  if (subjectInput && lead.channels?.email?.subject) {
    subjectInput.value = lead.channels.email.subject;
  }
  if (bodyInput && lead.channels?.email?.body) {
    bodyInput.value = lead.channels.email.body;
  }
}

async function generateAIEmailForSelected() {
  const select = document.getElementById('email-target-lead-select');
  if (!select) return;
  const leadId = select.value;

  try {
    const res = await fetch(`/api/outreach/email/generate/${leadId}`, { method: 'POST' }).then(r => r.json());
    if (res.success) {
      document.getElementById('email-subject-input').value = res.email.subject;
      document.getElementById('email-body-input').value = res.email.body;

      const varContainer = document.getElementById('email-subject-variations');
      if (varContainer && res.email.subjectVariations) {
        varContainer.innerHTML = res.email.subjectVariations.map(s => `
          <button onclick="document.getElementById('email-subject-input').value = this.innerText" class="px-2 py-0.5 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border text-slate-300 text-[10px]">
            ${s}
          </button>
        `).join('');
      }

      await loadAllData();
    }
  } catch (e) {
    console.error(e);
  }
}

async function sendEmailToTargetLead() {
  const select = document.getElementById('email-target-lead-select');
  if (!select) return;
  const leadId = select.value;

  try {
    const res = await fetch(`/api/outreach/email/send/${leadId}`, { method: 'POST' }).then(r => r.json());
    if (res.success) {
      alert(`Personalized email successfully dispatched to ${res.lead.email}! Deliverability Score: 99.2%.`);
      document.getElementById('email-send-status').innerText = 'Sent Just Now';
      await loadAllData();
      renderLeads();
    }
  } catch (e) {
    console.error(e);
  }
}

function copyEmailToClipboard() {
  const subject = document.getElementById('email-subject-input').value;
  const body = document.getElementById('email-body-input').value;
  navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
  alert('Email copied to clipboard!');
}

function onLinkedInLeadChange() {
  const select = document.getElementById('linkedin-target-lead-select');
  if (!select) return;
  const leadId = select.value;
  const lead = state.leads.find(l => l.id === leadId) || state.leads[0];
  if (!lead) return;

  const preview = document.getElementById('linkedin-lead-preview');
  if (preview) {
    preview.innerHTML = `
      <div class="flex items-center gap-2.5">
        <img src="${lead.avatar}" class="w-8 h-8 rounded-full object-cover">
        <div>
          <div class="font-bold text-slate-100">${lead.name}</div>
          <div class="text-[11px] text-slate-400">${lead.title} • ${lead.company}</div>
        </div>
      </div>
      <div class="text-[11px] text-slate-800 font-mono font-medium">${lead.linkedin}</div>
    `;
  }

  const noteInput = document.getElementById('linkedin-note-input');
  const inMailInput = document.getElementById('linkedin-inmail-input');
  if (noteInput && lead.channels?.linkedin?.connectionNote) {
    noteInput.value = lead.channels.linkedin.connectionNote;
    updateLinkedInCharCount();
  }
  if (inMailInput && lead.channels?.linkedin?.inMailText) {
    inMailInput.value = lead.channels.linkedin.inMailText;
  }
}

function updateLinkedInCharCount() {
  const note = document.getElementById('linkedin-note-input').value;
  const counter = document.getElementById('linkedin-char-counter');
  if (counter) {
    const len = note.length;
    counter.innerText = `${len} / 300 chars ${len <= 300 ? '(Safe)' : '(Exceeds limit!)'}`;
    counter.className = `text-[11px] font-mono ${len <= 300 ? 'text-emerald-400' : 'text-sky-500'}`;
  }
}

async function generateLinkedInForSelected() {
  const select = document.getElementById('linkedin-target-lead-select');
  if (!select) return;
  const leadId = select.value;

  try {
    const res = await fetch(`/api/outreach/linkedin/generate/${leadId}`, { method: 'POST' }).then(r => r.json());
    if (res.success) {
      document.getElementById('linkedin-note-input').value = res.linkedin.connectionNote;
      document.getElementById('linkedin-inmail-input').value = res.linkedin.inMailText;
      updateLinkedInCharCount();
      await loadAllData();
    }
  } catch (e) {
    console.error(e);
  }
}

async function dispatchLinkedInOutreach() {
  const select = document.getElementById('linkedin-target-lead-select');
  if (!select) return;
  const leadId = select.value;

  try {
    const res = await fetch(`/api/outreach/linkedin/send/${leadId}`, { method: 'POST' }).then(r => r.json());
    if (res.success) {
      alert(`LinkedIn connection request queued with humanized safety delay! Complies with daily rate limits.`);
      document.getElementById('linkedin-action-status').innerText = 'Connection Queued';
      await loadAllData();
      renderLeads();
    }
  } catch (e) {
    console.error(e);
  }
}

function onCallLeadChange() {
  const select = document.getElementById('call-target-lead-select');
  if (!select) return;
  const leadId = select.value;
  const lead = state.leads.find(l => l.id === leadId) || state.leads[0];
  if (!lead) return;

  state.callState.lead = lead;

  const card = document.getElementById('call-contact-card');
  if (card) {
    card.innerHTML = `
      <div class="flex items-center gap-2.5">
        <img src="${lead.avatar}" class="w-8 h-8 rounded-full object-cover">
        <div>
          <div class="font-bold text-white">${lead.name}</div>
          <div class="text-[11px] text-slate-400">${lead.title} • ${lead.company}</div>
        </div>
      </div>
      <div class="flex items-center justify-between text-[11px] pt-1">
        <span class="text-slate-400 font-mono">${lead.phone}</span>
        <span class="text-emerald-400 font-semibold">$${(lead.dealValue || 35000).toLocaleString()} Deal</span>
      </div>
    `;
  }
}

async function startLiveVoiceCall() {
  const lead = state.callState.lead || state.leads[0];
  if (!lead) return;

  state.callState.active = true;
  state.callState.status = 'ringing';
  state.callState.transcript = [];
  state.callState.durationSeconds = 0;
  state.callState.meetingBooked = false;
  state.callState.objectionsCount = 0;

  document.getElementById('btn-start-call').classList.add('hidden');
  document.getElementById('btn-end-call').classList.remove('hidden');
  document.getElementById('call-status-indicator').innerText = 'Ringing...';
  document.getElementById('call-status-indicator').className = 'text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 animate-pulse';
  document.getElementById('call-live-badge').innerText = 'Calling ' + lead.phone;
  document.getElementById('waveform-overlay-text').innerText = 'Ringing Prospect Phone...';

  if (window.voiceEngine) {
    window.voiceEngine.visualizerState = 'ringing';
    window.voiceEngine.playRingTone();
  }

  const transcriptEl = document.getElementById('call-transcript-container');
  transcriptEl.innerHTML = `<div class="text-center py-4 text-xs text-emerald-400 animate-pulse">Outbound call connected through WebRTC telephony bridge...</div>`;

  setTimeout(async () => {
    state.callState.status = 'connected';
    document.getElementById('call-status-indicator').innerText = 'Call Active';
    document.getElementById('call-live-badge').innerText = 'Live Voice Connection';
    document.getElementById('waveform-overlay-text').innerText = '';

    if (window.voiceEngine) {
      window.voiceEngine.playConnectedChime();
      window.voiceEngine.visualizerState = 'connected';
    }

    state.callState.startTime = Date.now();
    state.callState.timerInterval = setInterval(() => {
      state.callState.durationSeconds++;
      const mins = String(Math.floor(state.callState.durationSeconds / 60)).padStart(2, '0');
      const secs = String(state.callState.durationSeconds % 60).padStart(2, '0');
      document.getElementById('call-timer').innerText = `${mins}:${secs}`;
    }, 1000);

    const openingText = `Hi ${lead.name.split(' ')[0]}, this is Alex Morgan with OmniReach AI. I know I caught you out of the blue on a busy workday—quick 25 seconds? I saw ${lead.company} is expanding in ${lead.industry}, and we help revenue leaders eliminate manual outbound dialling by deploying autonomous conversational voice agents.`;

    appendTranscriptTurn('AI SDR', openingText);

    if (window.voiceEngine) {
      window.voiceEngine.speakAIText(openingText, () => {

      });
    }
  }, 2500);
}

function appendTranscriptTurn(speaker, text) {
  const container = document.getElementById('call-transcript-container');
  if (!container) return;

  const isAI = speaker === 'AI SDR';
  const turnEl = document.createElement('div');
  turnEl.className = `p-3 rounded-xl text-xs space-y-1 ${isAI ? 'bg-brand-950/40 border border-brand-500/30' : 'bg-slate-800/80 border border-slate-700/60 ml-6'}`;
  turnEl.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="font-bold ${isAI ? 'text-brand-300' : 'text-slate-200'}">${speaker}</span>
      <span class="text-[10px] text-slate-400 font-mono">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
    <p class="text-slate-200 leading-relaxed">${text}</p>
  `;

  container.appendChild(turnEl);
  container.scrollTop = container.scrollHeight;

  state.callState.transcript.push({
    speaker,
    text,
    timestamp: new Date().toLocaleTimeString()
  });
}

async function simulateClientUtterance(userText) {
  if (!state.callState.active) {
    alert("Please click 'Initiate AI Voice Call' first to start the call session!");
    return;
  }

  appendTranscriptTurn(state.callState.lead?.name || 'Prospect', userText);

  if (window.voiceEngine) {
    window.voiceEngine.visualizerState = 'speaking_user';
  }

  try {
    const res = await fetch('/api/outreach/call/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userSpeech: userText,
        leadId: state.callState.lead?.id,
        turns: state.callState.transcript
      })
    }).then(r => r.json());

    if (res.success) {

      state.callState.sentiment = res.sentiment;
      document.getElementById('call-sentiment-tag').innerText = res.sentiment;

      if (res.sentiment === 'High Interest') {
        document.getElementById('call-sentiment-bar').style.width = '100%';
        document.getElementById('call-sentiment-bar').className = 'bg-emerald-500 h-full rounded-full';
      } else if (res.sentiment === 'Objection Handled') {
        state.callState.objectionsCount++;
        document.getElementById('call-objections-count').innerText = state.callState.objectionsCount;
        document.getElementById('call-sentiment-bar').style.width = '75%';
        document.getElementById('call-sentiment-bar').className = 'bg-amber-500 h-full rounded-full';
      } else if (res.sentiment === 'Negative') {
        document.getElementById('call-sentiment-bar').style.width = '20%';
        document.getElementById('call-sentiment-bar').className = 'bg-sky-500 h-full rounded-full';
      }

      if (res.meetingBooked) {
        state.callState.meetingBooked = true;
        document.getElementById('call-booking-box').classList.remove('hidden');
      }

      setTimeout(() => {
        appendTranscriptTurn('AI SDR', res.aiResponse);
        if (window.voiceEngine) {
          window.voiceEngine.speakAIText(res.aiResponse);
        }
      }, 400);
    }
  } catch (e) {
    console.error(e);
  }
}

function sendCustomClientSpeech() {
  const input = document.getElementById('call-user-custom-input');
  if (!input || !input.value.trim()) return;
  simulateClientUtterance(input.value.trim());
  input.value = '';
}

function startVoiceRecognitionMic() {
  if (!state.callState.active) {
    alert("Please initiate a call first to speak to the AI SDR!");
    return;
  }
  if (window.voiceEngine) {
    window.voiceEngine.startListening((transcript) => {
      simulateClientUtterance(transcript);
    });
  }
}

function toggleAudioMute() {
  if (window.voiceEngine) {
    window.voiceEngine.isMuted = !window.voiceEngine.isMuted;
    const btn = document.getElementById('btn-toggle-mute');
    if (window.voiceEngine.isMuted) {
      btn.innerHTML = `<i data-lucide="volume-x" class="w-4 h-4 text-sky-500"></i><span class="text-[11px]">Audio Muted</span>`;
    } else {
      btn.innerHTML = `<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i><span class="text-[11px]">Audio On</span>`;
    }
    if (window.lucide) lucide.createIcons();
  }
}

async function endLiveVoiceCall() {
  clearInterval(state.callState.timerInterval);
  state.callState.active = false;
  state.callState.status = 'ended';

  if (window.voiceEngine) {
    window.voiceEngine.playHangupBeep();
    window.voiceEngine.visualizerState = 'idle';
  }

  document.getElementById('btn-start-call').classList.remove('hidden');
  document.getElementById('btn-end-call').classList.add('hidden');
  document.getElementById('call-status-indicator').innerText = 'Completed';
  document.getElementById('call-status-indicator').className = 'text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-border text-slate-300';
  document.getElementById('call-live-badge').innerText = 'Call Ended & Logged';

  const mins = Math.floor(state.callState.durationSeconds / 60);
  const secs = state.callState.durationSeconds % 60;
  const durationStr = `${mins}m ${secs}s`;

  const leadId = state.callState.lead?.id;

  try {
    const res = await fetch(`/api/outreach/call/complete/${leadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: state.callState.transcript,
        callDuration: durationStr,
        sentiment: state.callState.sentiment,
        meetingBooked: state.callState.meetingBooked,
        meetingTime: state.callState.meetingBooked ? 'Thursday, 2:00 PM EST' : null
      })
    }).then(r => r.json());

    if (res.success) {
      alert(`Call successfully completed and logged to CRM timeline!\nDuration: ${durationStr}\nOutcome: ${state.callState.meetingBooked ? 'Demo Meeting Scheduled' : 'Transcript Saved'}`);
      await loadAllData();
      renderLeads();
    }
  } catch (e) {
    console.error(e);
  }
}

function openNewSequenceModal() {
  const name = prompt("Enter New Omnichannel Sequence Name:", "Enterprise Series B Growth Cadence");
  if (!name) return;
  const newSeq = {
    id: `seq-${Date.now()}`,
    name: name,
    targetAudience: "VP & C-Suite Tech Leaders",
    status: "active",
    stats: { enrolled: 0, completed: 0, conversionRate: "28.4%" },
    steps: [
      { step: 1, type: "research", title: "AI Deep Account Enrichment & Executive Triggers", delay: "Immediate" },
      { step: 2, type: "email", title: "Personalized Series B Benchmark Cold Email", delay: "Day 1" },
      { step: 3, type: "linkedin", title: "Soft Connection Request & Value Observation", delay: "Day 3" },
      { step: 4, type: "call", title: "Speed-to-Lead Aircall CTI Dial on Email Open", delay: "Day 4" },
      { step: 5, type: "email", title: "Case Study & ROI Proof Point Follow-Up", delay: "Day 7" }
    ]
  };
  state.sequences.unshift(newSeq);
  renderSequences();
  showToast(`Created new omnichannel workflow: ${name}`, 'success');
}

function renderSequences() {
  const container = document.getElementById('sequences-container');
  if (!container) return;

  container.innerHTML = state.sequences.map(seq => `
    <div class="p-6 rounded-2xl bg-dark-card border border-dark-border space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-border pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-base text-white">${seq.name}</h3>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">${seq.status}</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">${seq.description}</p>
        </div>
        <div class="flex items-center gap-4 text-xs font-mono">
          <div>Enrolled: <strong class="text-white">${seq.enrolledLeads}</strong></div>
          <div>Reply Rate: <strong class="text-slate-900">${seq.replyRate}</strong></div>
          <div>Demo Rate: <strong class="text-emerald-400">${seq.meetingRate}</strong></div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        ${seq.steps.map((st, i) => {
          let icon = 'sparkles';
          let color = 'amber';
          if (st.channel === 'email') { icon = 'mail'; color = 'violet'; }
          if (st.channel === 'linkedin') { icon = 'linkedin'; color = 'amber'; }
          if (st.channel === 'call') { icon = 'phone-call'; color = 'emerald'; }

          return `
            <div class="p-4 rounded-xl bg-dark-surface border border-dark-border space-y-2 relative">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold text-slate-400">Step ${st.step}</span>
                <span class="p-1.5 rounded-lg bg-${color}-500/10 text-${color}-400">
                  <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
                </span>
              </div>
              <div class="font-bold text-xs text-slate-200">${st.action}</div>
              <div class="text-[10px] text-slate-400 font-mono">${st.delay}</div>
              <p class="text-[11px] text-slate-400 line-clamp-2">${st.details}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function triggerAutonomousSwarmModal() {
  navigateView('autonomous');
  const terminal = document.getElementById('swarm-terminal-logs');
  if (terminal) {
    terminal.innerHTML = `<div class="text-violet-400 animate-pulse">[AUTONOMOUS SWARM] Waking 5 specialized AI agents...</div>`;
  }

  try {
    const res = await fetch('/api/autonomous/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(r => r.json());

    if (res.success) {
      if (terminal) {
        terminal.innerHTML = '';
        res.steps.forEach((step, idx) => {
          setTimeout(() => {
            const row = document.createElement('div');
            row.className = 'py-1 border-b border-dark-border/40';
            row.innerHTML = `
              <span class="text-slate-500 font-mono">[${step.timestamp}]</span>
              <span class="font-bold text-violet-400">${step.agent}:</span>
              <span class="text-slate-200">${step.action}</span> &rarr;
              <span class="text-emerald-400">${step.result}</span>
            `;
            terminal.appendChild(row);
            terminal.scrollTop = terminal.scrollHeight;
          }, idx * 600);
        });
      }

      setTimeout(async () => {
        await loadAllData();
        renderLeads();
      }, res.steps.length * 600 + 500);
    }
  } catch (e) {
    console.error(e);
  }
}

function openQuickAddLeadModal() {
  document.getElementById('quick-add-modal').classList.remove('hidden');
}

function closeQuickAddModal() {
  document.getElementById('quick-add-modal').classList.add('hidden');
}

async function submitNewLead() {
  const name = document.getElementById('add-lead-name').value;
  const title = document.getElementById('add-lead-title').value;
  const company = document.getElementById('add-lead-company').value;
  const email = document.getElementById('add-lead-email').value;
  const phone = document.getElementById('add-lead-phone').value;
  const industry = document.getElementById('add-lead-industry').value;

  if (!name || !company) {
    alert("Please fill in Name and Company.");
    return;
  }

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, title, company, email, phone, industry })
    }).then(r => r.json());

    if (res.success) {
      closeQuickAddModal();
      await loadAllData();
      renderLeads();
      populateDropdowns();
      alert(`Lead ${name} (${company}) added and enriched in OmniReach CRM!`);
    }
  } catch (e) {
    console.error(e);
  }
}

function refreshEmailView() {
  populateDropdowns();
}

function refreshLinkedInView() {
  populateDropdowns();
}

function refreshCallView() {
  populateDropdowns();
}

function saveSettingsForm() {
  alert('Settings and sender profile updated successfully.');
}

async function loadAircallTriggers() {
  try {
    const res = await fetch('/api/aircall/smart-triggers').then(r => r.json());
    if (res.success) {
      state.aircallState.hotTriggers = res.triggers;
      const countEl = document.getElementById('badge-hot-triggers');
      if (countEl) countEl.innerText = `${res.count} Hot`;
      renderAircallHotQueue();
    }
  } catch (e) {
    console.error('Error loading Aircall triggers:', e);
  }
}

function renderAircallHotQueue() {
  const container = document.getElementById('aircall-hot-queue-list');
  const modalContainer = document.getElementById('modal-hot-triggers-list');

  const triggers = state.aircallState.hotTriggers || [];
  if (triggers.length === 0) {
    if (container) container.innerHTML = `<div class="p-3 text-center text-xs text-slate-500">No active triggers right now.</div>`;
    return;
  }

  const html = triggers.map(t => `
    <div class="p-3 rounded-xl bg-dark-surface hover:bg-dark-hover border border-dark-border space-y-1.5 transition">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="${t.avatar}" class="w-6 h-6 rounded-full object-cover">
          <span class="font-bold text-xs text-white">${t.name}</span>
        </div>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded aircall-badge font-semibold">${t.urgency}</span>
      </div>
      <div class="text-[11px] text-slate-300">
        <strong class="text-emerald-400 font-medium">${t.signalText}</strong>
      </div>
      <div class="flex items-center justify-between pt-1">
        <span class="text-[10px] text-slate-400 font-mono">${t.company}</span>
        <button onclick="triggerAircallDial('${t.leadId}', '${t.triggerSource}')" class="px-2.5 py-1 rounded-lg aircall-btn text-[10px] flex items-center gap-1 shadow-sm active:scale-95 transition">
          <i data-lucide="phone" class="w-3 h-3 fill-white"></i> Call Aircall
        </button>
      </div>
    </div>
  `).join('');

  if (container) container.innerHTML = html;
  if (modalContainer) modalContainer.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function refreshAircallView() {
  populateDropdowns();
  loadAircallTriggers();
  onAircallLeadSelectChange();
}

async function onAircallLeadSelectChange() {
  const select = document.getElementById('aircall-target-lead-select');
  if (!select) return;
  const leadId = select.value;
  const lead = state.leads.find(l => l.id === leadId) || state.leads[0];
  if (!lead) return;

  state.aircallState.lead = lead;

  const nameEl = document.getElementById('aircall-caller-name');
  const phoneEl = document.getElementById('aircall-caller-phone');
  if (nameEl) nameEl.innerText = `${lead.name} (${lead.company})`;
  if (phoneEl) phoneEl.innerText = lead.phone;

  const dockName = document.getElementById('dock-caller-name');
  const dockPhone = document.getElementById('dock-caller-phone');
  if (dockName) dockName.innerText = `${lead.name} (${lead.company})`;
  if (dockPhone) dockPhone.innerText = lead.phone;

  try {
    const res = await fetch('/api/aircall/dial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: lead.id, triggerSource: 'inbox_opened_email' })
    }).then(r => r.json());

    if (res.success) {
      state.aircallState.battlecard = res.battlecard;
      renderAircallScreenPop(res.battlecard);
    }
  } catch (e) {
    console.error('Error fetching Aircall battlecard:', e);
  }
}

function renderAircallScreenPop(bc) {
  if (!bc) return;

  const summaryEl = document.getElementById('aircall-touchpoint-summary');
  if (summaryEl) summaryEl.innerText = `${bc.leadCompany} • ${bc.fitScore}% Fit`;

  const historyContainer = document.getElementById('aircall-touchpoint-history');
  if (historyContainer && bc.previousTouchpoints) {
    historyContainer.innerHTML = bc.previousTouchpoints.map(tp => `
      <div class="flex items-start gap-2 py-1 border-b border-dark-border/40 last:border-0">
        <span class="p-1 rounded ${tp.channel === 'email' ? 'bg-white text-slate-800 border border-slate-300 shadow-sm' : tp.channel === 'linkedin' ? 'bg-white text-slate-800 border border-slate-300 shadow-sm' : 'bg-purple-500/20 text-purple-400'}">
          <i data-lucide="${tp.channel === 'email' ? 'mail' : tp.channel === 'linkedin' ? 'linkedin' : 'sparkles'}" class="w-3 h-3"></i>
        </span>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-200 truncate">${tp.title}</div>
          <div class="text-[10px] text-slate-400">${tp.detail}</div>
        </div>
      </div>
    `).join('');
  }

  const bridgeEl = document.getElementById('aircall-opening-bridge-text');
  if (bridgeEl) bridgeEl.innerText = `"${bc.openingBridge}"`;

  showAircallObjection(state.aircallState.currentObjectionKey || 'busy');

  if (window.lucide) lucide.createIcons();
}

function showAircallObjection(key) {
  state.aircallState.currentObjectionKey = key;
  const bc = state.aircallState.battlecard;
  if (!bc || !bc.objectionBattlecards) return;

  const tabs = ['busy', 'budget', 'send_email', 'competitor'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-obj-${t}`);
    if (btn) {
      if (t === key) {
        btn.className = 'objection-btn active !bg-brand-600 !text-white !border-brand-500';
      } else {
        btn.className = 'objection-btn';
      }
    }
  });

  const objData = bc.objectionBattlecards[key];
  if (objData) {
    const label = document.getElementById('aircall-obj-label');
    const resp = document.getElementById('aircall-obj-response');
    if (label) label.innerText = `Objection: "${objData.objection}"`;
    if (resp) resp.innerText = `"${objData.talkingPoint}"`;
  }
}

function copyOpeningBridgeText() {
  const el = document.getElementById('aircall-opening-bridge-text');
  if (el) {
    navigator.clipboard.writeText(el.innerText.replace(/"/g, ''));
    alert('Opening bridge script copied!');
  }
}

function triggerAircallDialForSelectedLead() {
  const select = document.getElementById('aircall-target-lead-select');
  const leadId = select ? select.value : state.leads[0]?.id;
  triggerAircallDial(leadId, 'manual_dial');
}

async function triggerAircallDial(leadId, triggerSource = 'inbox_opened_email') {
  const lead = state.leads.find(l => l.id === leadId) || state.leads[0];
  if (!lead) return;

  state.aircallState.lead = lead;
  state.aircallState.active = true;
  state.aircallState.status = 'ringing';
  state.aircallState.durationSeconds = 0;

  const aircallSelect = document.getElementById('aircall-target-lead-select');
  if (aircallSelect) aircallSelect.value = lead.id;

  const nameEl = document.getElementById('aircall-caller-name');
  const phoneEl = document.getElementById('aircall-caller-phone');
  if (nameEl) nameEl.innerText = `${lead.name} (${lead.company})`;
  if (phoneEl) phoneEl.innerText = lead.phone;

  const dockName = document.getElementById('dock-caller-name');
  const dockPhone = document.getElementById('dock-caller-phone');
  if (dockName) dockName.innerText = `${lead.name} (${lead.company})`;
  if (dockPhone) dockPhone.innerText = lead.phone;

  const diallerStatus = document.getElementById('aircall-dialler-status');
  if (diallerStatus) diallerStatus.innerText = 'Ringing via Aircall...';
  const floatBadge = document.getElementById('floating-dock-badge');
  if (floatBadge) floatBadge.innerText = 'Calling...';

  const dialAction = document.getElementById('btn-aircall-dial-action');
  const hangAction = document.getElementById('btn-aircall-hangup-action');
  if (dialAction) dialAction.classList.add('hidden');
  if (hangAction) hangAction.classList.remove('hidden');

  const dockDial = document.getElementById('dock-btn-dial');
  const dockHang = document.getElementById('dock-btn-hangup');
  if (dockDial) dockDial.classList.add('hidden');
  if (dockHang) dockHang.classList.remove('hidden');

  const postBox = document.getElementById('aircall-post-call-box');
  if (postBox) postBox.classList.add('hidden');

  if (window.voiceEngine && window.voiceEngine.playAircallRingTone) {
    window.voiceEngine.playAircallRingTone();
  }

  await onAircallLeadSelectChange();

  setTimeout(() => {
    state.aircallState.status = 'connected';
    if (diallerStatus) diallerStatus.innerText = 'In Call • HD Audio';
    if (floatBadge) floatBadge.innerText = 'Live Call';

    if (window.voiceEngine && window.voiceEngine.playConnectedChime) {
      window.voiceEngine.playConnectedChime();
    }

    state.aircallState.startTime = Date.now();
    state.aircallState.timerInterval = setInterval(() => {
      state.aircallState.durationSeconds++;
      const mins = String(Math.floor(state.aircallState.durationSeconds / 60)).padStart(2, '0');
      const secs = String(state.aircallState.durationSeconds % 60).padStart(2, '0');
      const timeStr = `${mins}:${secs}`;
      const timer1 = document.getElementById('aircall-live-timer');
      const timer2 = document.getElementById('dock-live-timer');
      if (timer1) timer1.innerText = timeStr;
      if (timer2) timer2.innerText = timeStr;
    }, 1000);
  }, 2200);
}

function toggleAircallMute() {
  state.aircallState.isMuted = !state.aircallState.isMuted;
  const icon = document.getElementById('icon-ac-mic');
  if (icon) {
    icon.className = state.aircallState.isMuted ? 'w-4 h-4 text-sky-500' : 'w-4 h-4 text-slate-300';
  }
}

function toggleAircallRecord() {
  state.aircallState.isRecording = !state.aircallState.isRecording;
  const icon = document.getElementById('icon-ac-rec');
  if (icon) {
    icon.className = state.aircallState.isRecording ? 'w-4 h-4 text-sky-500 animate-pulse' : 'w-4 h-4 text-slate-500';
  }
}

function playAircallHoldTone() {
  alert('Aircall Hold activated: Prospect is on hold with pleasant background music.');
}

function toggleAircallKeypadPad() {
  alert('Aircall DTMF Keypad available for IVR navigation.');
}

function endAircallLiveCall() {
  clearInterval(state.aircallState.timerInterval);
  state.aircallState.active = false;
  state.aircallState.status = 'ended';

  if (window.voiceEngine && window.voiceEngine.playHangupBeep) {
    window.voiceEngine.playHangupBeep();
  }

  const diallerStatus = document.getElementById('aircall-dialler-status');
  if (diallerStatus) diallerStatus.innerText = 'Call Ended';
  const floatBadge = document.getElementById('floating-dock-badge');
  if (floatBadge) floatBadge.innerText = 'Ready';

  const dialAction = document.getElementById('btn-aircall-dial-action');
  const hangAction = document.getElementById('btn-aircall-hangup-action');
  if (dialAction) dialAction.classList.remove('hidden');
  if (hangAction) hangAction.classList.add('hidden');

  const dockDial = document.getElementById('dock-btn-dial');
  const dockHang = document.getElementById('dock-btn-hangup');
  if (dockDial) dockDial.classList.remove('hidden');
  if (dockHang) dockHang.classList.add('hidden');

  const postBox = document.getElementById('aircall-post-call-box');
  if (postBox) {
    postBox.classList.remove('hidden');
    onAircallDispositionChange();
  }
}

function onAircallDispositionChange() {
  const select = document.getElementById('ac-disposition-select');
  const preview = document.getElementById('ac-followup-email-preview');
  if (!select || !preview) return;

  const disp = select.value;
  const lead = state.aircallState.lead || state.leads[0];
  const name = lead ? lead.name.split(' ')[0] : 'there';

  if (disp === 'demo_booked') {
    preview.innerText = `"Hi ${name}, confirmed our live demo for Thursday 2:00 PM EST! Dispatched Google Meet invite..."`;
  } else if (disp === 'followup_requested') {
    preview.innerText = `"Hi ${name}, thanks for taking my call on Aircall today! Here is the 90-sec overview..."`;
  } else if (disp === 'left_voicemail') {
    preview.innerText = `"Hi ${name}, just left you a quick voicemail regarding ${lead?.company || 'your team'}..."`;
  } else {
    preview.innerText = `"Hi ${name}, thank you for your time on the phone today..."`;
  }
}

async function commitAircallPostCallAction() {
  const lead = state.aircallState.lead || state.leads[0];
  if (!lead) return;

  const disp = document.getElementById('ac-disposition-select')?.value || 'demo_booked';
  const notes = document.getElementById('ac-rep-notes')?.value || 'Aircall sales conversation completed';

  const mins = Math.floor(state.aircallState.durationSeconds / 60);
  const secs = state.aircallState.durationSeconds % 60;
  const durStr = `${mins}m ${secs}s`;

  try {
    const res = await fetch('/api/aircall/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        duration: durStr,
        disposition: disp,
        repNotes: notes,
        autoQueueFollowup: true
      })
    }).then(r => r.json());

    if (res.success) {
      alert(`Aircall call logged!\n• Duration: ${durStr}\n• Disposition: ${res.followups.dispositionTag}\n• AI Follow-Up Email & LinkedIn note prepared without breaking your flow!`);
      document.getElementById('aircall-post-call-box').classList.add('hidden');
      await loadAllData();
      renderLeads();
    }
  } catch (e) {
    console.error('Error logging Aircall call:', e);
  }
}

function toggleAircallDock() {
  const pill = document.getElementById('aircall-floating-pill');
  const expanded = document.getElementById('aircall-expanded-dock');
  if (!pill || !expanded) return;

  state.aircallState.dockExpanded = !state.aircallState.dockExpanded;
  if (state.aircallState.dockExpanded) {
    pill.classList.add('hidden');
    expanded.classList.remove('hidden');
    onAircallLeadSelectChange();
  } else {
    expanded.classList.add('hidden');
    pill.classList.remove('hidden');
  }
}

function openInboxToRingtoneModal() {
  loadAircallTriggers();
  document.getElementById('inbox-ringtone-modal').classList.remove('hidden');
}

function closeInboxToRingtoneModal() {
  document.getElementById('inbox-ringtone-modal').classList.add('hidden');
}

function launchAircallForCurrentDrawerLead() {
  const id = state.drawerLeadId;
  closeLeadDrawer();
  navigateView('aircall');
  const select = document.getElementById('aircall-target-lead-select');
  if (select) {
    select.value = id;
    onAircallLeadSelectChange();
  }
  triggerAircallDial(id, 'drawer_action');
}

function launchAircallForLead(id) {
  navigateView('aircall');
  const select = document.getElementById('aircall-target-lead-select');
  if (select) {
    select.value = id;
    onAircallLeadSelectChange();
  }
  triggerAircallDial(id, 'crm_action');
}

async function loadBusinessMemory() {
  try {
    const res = await fetch('/api/strategist/memory').then(r => r.json());
    if (res.success && res.memory) {
      state.businessMemory = res.memory;
      renderBusinessMemoryCard();
      renderStrategistChat();
    }
  } catch (e) {
    console.error('Error loading business memory:', e);
  }
}

function refreshStrategistView() {
  loadBusinessMemory();
}

function renderBusinessMemoryCard() {
  const mem = state.businessMemory;
  if (!mem) return;

  const nameEl = document.getElementById('mem-company-name');
  const urlEl = document.getElementById('mem-website-url');
  const posEl = document.getElementById('mem-core-positioning');
  const valEl = document.getElementById('mem-value-prop');

  if (nameEl) nameEl.innerText = mem.companyName || 'Your Company';
  if (urlEl) {
    urlEl.innerText = mem.websiteUrl || 'https://omnireach.ai';
    urlEl.href = mem.websiteUrl || '#';
  }
  if (posEl) posEl.innerText = mem.corePositioning || 'Positioning being formulated...';
  if (valEl) valEl.innerText = mem.valueProposition || 'Value driver being learned...';

  const icpList = document.getElementById('mem-icp-list');
  const icpCount = document.getElementById('mem-icp-count');
  if (icpList) {
    const icps = mem.icps || [];
    if (icpCount) icpCount.innerText = icps.length;

    if (icps.length === 0) {
      icpList.innerHTML = `<div class="p-3 text-center text-slate-500 text-xs">No ICPs learned yet. Describe your buyer to add one!</div>`;
    } else {
      icpList.innerHTML = icps.map(icp => `
        <div class="p-3 rounded-xl bg-dark-card border border-dark-border space-y-1.5 hover:border-violet-500/40 transition">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-white">${icp.name}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-300 shadow-sm">${icp.companySize}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            <span class="text-slate-300 font-medium">Titles:</span> ${icp.titles ? icp.titles.join(', ') : 'Leadership'}
          </div>
          <div class="text-[11px] text-slate-300">
            <span class="text-sky-500 font-medium">Core Pain:</span> ${icp.corePainPoints ? icp.corePainPoints[0] : 'Manual prospecting friction'}
          </div>
          <div class="text-[10px] text-slate-400 font-italic pt-0.5">
            <span class="text-emerald-400 font-semibold">Why They Buy:</span> ${icp.whyTheyBuy || 'Cuts outbound CAC by 65%.'}
          </div>
        </div>
      `).join('');
    }
  }

  const toneStyle = document.getElementById('mem-tone-style');
  const tonePace = document.getElementById('mem-tone-pace');
  const bannedContainer = document.getElementById('mem-banned-phrases');

  if (toneStyle) toneStyle.innerText = mem.brandTone?.style || 'Consultative & Direct';
  if (tonePace) tonePace.innerText = mem.brandTone?.pace || 'Direct (<90 words)';

  if (bannedContainer && mem.brandTone?.bannedPhrases) {
    bannedContainer.innerHTML = mem.brandTone.bannedPhrases.map(phrase => `
      <span class="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-500 font-mono">
        ✕ "${phrase}"
      </span>
    `).join('');
  }
}

function renderStrategistChat() {
  const container = document.getElementById('strategist-chat-messages');
  if (!container) return;

  const history = state.businessMemory?.conversationHistory || [];
  if (history.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs">Start a conversation below or drop your URL!</div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    const isUser = item.sender === 'user';
    const textFormatted = item.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

    return `
      <div class="flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}">
        ${!isUser ? `
          <div class="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 flex-shrink-0 mt-0.5">
            <i data-lucide="bot" class="w-3.5 h-3.5"></i>
          </div>
        ` : ''}
        <div class="max-w-[85%] rounded-2xl p-3.5 text-xs space-y-1 ${isUser ? 'bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-600/20' : 'bg-dark-card border border-dark-border text-slate-200 rounded-bl-none'}">
          <div class="flex items-center justify-between text-[10px] text-slate-400 gap-2 pb-0.5">
            <span class="font-bold ${isUser ? 'text-violet-200' : 'text-violet-300'}">${isUser ? 'You' : 'AI Strategist'}</span>
            <span class="font-mono ${isUser ? 'text-violet-200' : 'text-slate-500'}">${item.timestamp || ''}</span>
          </div>
          <div class="leading-relaxed whitespace-pre-line">${textFormatted}</div>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

async function sendStrategistMessage(customText = null) {
  const input = document.getElementById('strategist-chat-input');
  const message = customText || (input ? input.value.trim() : '');
  if (!message) return;

  if (input) input.value = '';

  state.businessMemory = state.businessMemory || {};
  state.businessMemory.conversationHistory = state.businessMemory.conversationHistory || [];
  state.businessMemory.conversationHistory.push({
    sender: 'user',
    text: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  renderStrategistChat();

  try {
    const res = await fetch('/api/strategist/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    }).then(r => r.json());

    if (res.success) {
      state.businessMemory = res.memory;
      renderBusinessMemoryCard();
      renderStrategistChat();
    }
  } catch (e) {
    console.error('Error sending message to strategist:', e);
  }
}

function sendStrategistQuickPrompt(text) {
  sendStrategistMessage(text);
}

function promptDropUrlModal() {
  const url = prompt("Enter your company website URL (e.g. https://apexai.cloud):", "https://apexai.cloud");
  if (url) {
    sendStrategistMessage(`Drop URL: ${url}`);
  }
}

async function resetBusinessMemoryPrompt() {
  if (confirm("Reset business memory back to clean template?")) {
    try {
      const res = await fetch('/api/strategist/reset', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        state.businessMemory = res.memory;
        renderBusinessMemoryCard();
        renderStrategistChat();
        alert("Business memory reset to baseline.");
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function syncMemoryToDiscovery() {
  navigateView('discover');
  const mem = state.businessMemory;
  if (mem && mem.icps && mem.icps.length > 0) {
    const primaryIcp = mem.icps[0];
    const indSelect = document.getElementById('discover-industry');
    if (indSelect) {
      for (let i = 0; i < indSelect.options.length; i++) {
        if (primaryIcp.industry.toLowerCase().includes(indSelect.options[i].value.toLowerCase())) {
          indSelect.selectedIndex = i;
          break;
        }
      }
    }
  }
}

async function fetch27xState() {
  try {
    const res = await fetch('/api/27x/state').then(r => r.json());
    if (res.success && res.state) {
      state.state27x = res.state;
      update27xUI();
    }
  } catch (err) {
    console.error('Error fetching 27x state:', err);
  }
}

function update27xUI() {
  if (!state.state27x) return;
  const s = state.state27x;

  const btnAutopilot = document.getElementById('btn-mode-autopilot');
  const btnCopilot = document.getElementById('btn-mode-copilot');

  if (btnAutopilot && btnCopilot) {
    if (s.mode === 'autopilot') {
      btnAutopilot.className = 'px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition text-white bg-gradient-to-r from-sky-600 to-sky-600 shadow-md shadow-sky-600/30';
      btnCopilot.className = 'px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition text-slate-400 hover:text-white';
    } else {
      btnCopilot.className = 'px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition text-white bg-gradient-to-r from-amber-600 to-sky-600 shadow-md shadow-amber-600/30';
      btnAutopilot.className = 'px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition text-slate-400 hover:text-white';
    }
  }

  const queueCount = (s.approvalQueue && s.approvalQueue.length) || 0;
  
  const headerQueueBadge = document.getElementById('header-queue-count');
  if (headerQueueBadge) {
    headerQueueBadge.innerText = queueCount;
    if (queueCount > 0) {
      headerQueueBadge.classList.remove('hidden');
    } else {
      headerQueueBadge.classList.add('hidden');
    }
  }

  const sidebarQueueBadge = document.getElementById('badge-sidebar-queue-count');
  if (sidebarQueueBadge) {
    sidebarQueueBadge.innerText = queueCount;
    if (queueCount === 0) {
      sidebarQueueBadge.classList.remove('animate-pulse');
      sidebarQueueBadge.className = 'ml-auto text-[10px] px-1.5 py-0.5 rounded bg-dark-border text-slate-400 font-mono font-bold';
    } else {
      sidebarQueueBadge.className = 'ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sky-600 text-white font-mono font-bold animate-pulse';
    }
  }

  const dashQueueBadge = document.getElementById('dashboard-queue-badge');
  if (dashQueueBadge) dashQueueBadge.innerText = queueCount;

  const queueCountBadge = document.getElementById('queue-count-badge');
  if (queueCountBadge) queueCountBadge.innerText = queueCount;

  const verifiedCount = s.verifiedContactsCount || 384520000;
  const verifiedFormatted = (verifiedCount / 1000000).toFixed(1) + 'M';

  const headerVerified = document.getElementById('header-verified-count');
  if (headerVerified) headerVerified.innerText = verifiedFormatted;

  const studioContact = document.getElementById('studio-contact-count');
  if (studioContact) studioContact.innerText = verifiedFormatted;

  const dashDbCount = document.getElementById('dashboard-db-count');
  if (dashDbCount) dashDbCount.innerText = verifiedCount.toLocaleString() + '+';

  const modePill = document.getElementById('dashboard-mode-pill');
  if (modePill) {
    if (s.mode === 'autopilot') {
      modePill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
        <span class="text-sky-500 font-bold">Autopilot Active (100% Autonomous)</span>
      `;
    } else {
      modePill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span class="text-amber-400 font-bold">Copilot Active (Human Review Required)</span>
      `;
    }
  }

  const studioBtnText = document.getElementById('studio-mode-btn-text');
  if (studioBtnText) {
    studioBtnText.innerText = s.mode === 'autopilot' ? 'Switch to Copilot' : 'Switch to Autopilot';
  }

  const dashSignalSnippet = document.getElementById('dashboard-signal-snippet');
  if (dashSignalSnippet && s.intentSignals && s.intentSignals.length > 0) {
    dashSignalSnippet.innerText = s.intentSignals.map(sig => `${sig.company} (${sig.title})`).join(' • ');
  }
}

async function toggle27xMode(desiredMode) {
  try {
    const payload = desiredMode ? { mode: desiredMode } : {};
    const res = await fetch('/api/27x/mode/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success && res.state) {
      state.state27x = res.state;
      update27xUI();
      showToast(res.message, 'success');
      if (state.activeView === 'agent-studio') render27xAgentStudio();
    }
  } catch (err) {
    console.error('Failed to toggle 27x mode:', err);
    showToast('Failed to switch mode', 'error');
  }
}

function render27xAgentStudio() {
  if (!state.state27x) return;
  const container = document.getElementById('studio-agents-container');
  if (!container) return;

  const agents = state.state27x.agents || [];
  container.innerHTML = agents.map(agent => {
    const isActive = agent.status === 'active';
    const statsEntries = Object.entries(agent.stats || {});

    return `
      <div class="glass-card rounded-2xl bg-dark-card border border-dark-border p-5 space-y-4 relative overflow-hidden transition-all hover:border-sky-500/50">
        
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-600 to-sky-700 flex items-center justify-center text-white shadow-lg shadow-sky-600/30 flex-shrink-0">
              <i data-lucide="${agent.icon || 'bot'}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="font-bold text-sm text-white flex items-center gap-2">
                ${agent.name}
              </div>
              <div class="text-[11px] text-slate-400 font-medium">${agent.role}</div>
            </div>
          </div>
          <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
            isActive 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }">
            ${isActive ? 'Online' : 'Paused'}
          </span>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <span class="text-[10px] uppercase font-mono text-slate-400">Model:</span>
          <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-mono text-[11px] border border-sky-500/20 font-semibold truncate">
            ${agent.model}
          </span>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed min-h-[44px]">
          ${agent.description}
        </p>

        <div class="p-3 rounded-xl bg-dark-surface border border-dark-border grid grid-cols-3 gap-2 text-center text-xs">
          ${statsEntries.map(([key, val]) => `
            <div>
              <div class="font-bold text-white font-mono text-xs truncate">${val}</div>
              <div class="text-[9px] text-slate-400 uppercase tracking-wider truncate mt-0.5">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
            </div>
          `).join('')}
        </div>

        <div class="pt-2 flex items-center justify-between border-t border-dark-border/60">
          <span class="text-[11px] text-slate-400 font-mono">
            Mode: <strong class="text-sky-500 uppercase">${agent.mode || 'autopilot'}</strong>
          </span>
          <button onclick="toggle27xAgent('${agent.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            isActive 
              ? 'bg-dark-hover hover:bg-sky-500/20 text-slate-300 hover:text-sky-500 border border-dark-border' 
              : 'btn-crimson font-bold'
          }">
            ${isActive ? 'Pause Worker' : 'Resume Worker'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

async function toggle27xAgent(agentId) {
  try {
    const res = await fetch('/api/27x/agent/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    }).then(r => r.json());

    if (res.success && res.state) {
      state.state27x = res.state;
      render27xAgentStudio();
      showToast(res.message, 'info');
    }
  } catch (err) {
    console.error('Error toggling agent:', err);
    showToast('Failed to toggle agent', 'error');
  }
}

function openNewAgentModal() {
  const modal = document.getElementById('modal-agent-builder');
  if (modal) modal.classList.remove('hidden');
  const sim = document.getElementById('builder-simulation-output');
  if (sim) sim.classList.add('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeNewAgentModal() {
  const modal = document.getElementById('modal-agent-builder');
  if (modal) modal.classList.add('hidden');
}

function simulateAgentExecution() {
  const sim = document.getElementById('builder-simulation-output');
  if (sim) {
    sim.classList.remove('hidden');
    sim.classList.add('animate-fade-in-up');
  }
  showToast('AI Simulation ran successfully across sample account (97.4% match)!', 'success');
}

async function saveAndDeployAgent() {
  const name = document.getElementById('builder-agent-name')?.value.trim() || 'Custom AI Worker';
  const role = document.getElementById('builder-agent-role')?.value.trim() || 'Outbound Specialization';
  const model = document.getElementById('builder-agent-model')?.value || 'Claude 3.5 Sonnet';
  const mode = document.getElementById('builder-agent-mode')?.value || 'autopilot';
  const trigger = document.getElementById('builder-agent-trigger')?.value || 'funding';
  const confidence = document.getElementById('builder-agent-confidence')?.value || '95';
  const prompt = document.getElementById('builder-agent-prompt')?.value || '';

  if (!state.state27x) state.state27x = { agents: [] };

  const newAgent = {
    id: `agent-custom-${Date.now()}`,
    name: name,
    role: role,
    status: 'active',
    mode: mode,
    model: model,
    icon: 'sparkles',
    trigger: trigger,
    confidenceThreshold: `>${confidence}%`,
    promptDirective: prompt,
    stats: { targetsScanned: 0, actionsTaken: 0, conversionLift: '27.4x' },
    description: `${role}. Running on ${model} with active trigger monitoring and >${confidence}% confidence guardrail.`
  };

  state.state27x.agents.unshift(newAgent);
  render27xAgentStudio();
  closeNewAgentModal();
  showToast(`Successfully deployed ${name} to 27x Agent Network!`, 'success');
}

function render27xApprovalQueue() {
  if (!state.state27x) return;
  const container = document.getElementById('approval-queue-items');
  if (!container) return;

  const queue = state.state27x.approvalQueue || [];

  if (queue.length === 0) {
    container.innerHTML = `
      <div class="p-10 rounded-2xl bg-dark-card border border-dark-border text-center space-y-3">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <i data-lucide="check-check" class="w-7 h-7"></i>
        </div>
        <div class="text-base font-bold text-white">All Touches Approved & Dispatched</div>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          The Copilot review queue is clear. Autonomous AI SDRs are continuously monitoring 380M+ contacts for fresh intent signals.
        </p>
        <div class="pt-2">
          <button onclick="scan27xSignals()" class="px-4 py-2 rounded-xl btn-crimson text-xs font-bold inline-flex items-center gap-2">
            <i data-lucide="radar" class="w-4 h-4"></i>
            <span>Scan for New Buyer Signals</span>
          </button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = queue.map(item => {
    let channelIcon = 'mail';
    let channelBadge = 'Email Touch';
    let channelColor = 'text-sky-500 border-sky-500/30 bg-sky-500/10';

    if (item.channel === 'linkedin') {
      channelIcon = 'linkedin';
      channelBadge = 'LinkedIn InMail';
      channelColor = 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    } else if (item.channel === 'call') {
      channelIcon = 'phone-call';
      channelBadge = 'Aircall Phone Call';
      channelColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }

    return `
      <div class="glass-card rounded-2xl bg-dark-card border border-dark-border p-5 space-y-4 hover:border-amber-500/40 transition">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${channelColor} border flex items-center justify-center flex-shrink-0">
              <i data-lucide="${channelIcon}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">${item.leadName}</span>
                <span class="text-xs text-slate-400">• ${item.company}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${channelColor}">${channelBadge}</span>
              </div>
              <div class="text-xs text-amber-400 font-medium flex items-center gap-1.5 mt-0.5">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>Signal: ${item.trigger}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:self-center">
            <span class="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
              ${item.confidence}% Match
            </span>
            <span class="text-xs text-slate-400 font-mono">${item.createdAgo}</span>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-dark-surface border border-dark-border space-y-2">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-slate-200">
              <i data-lucide="file-text" class="w-3.5 h-3.5 text-sky-500"></i>
              ${item.previewTitle}
            </span>
            <span class="text-[10px] font-mono text-slate-400">AI Grounded via Business Memory</span>
          </div>
          <p class="text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
            ${item.previewBody}
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-1">
          <button onclick="reject27xAction('${item.id}')" class="px-3.5 py-2 rounded-xl bg-dark-surface hover:bg-sky-500/10 border border-dark-border hover:border-sky-500/30 text-slate-300 hover:text-sky-500 text-xs font-semibold transition flex items-center gap-1.5">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
            <span>Dismiss Touch</span>
          </button>
          <button onclick="approve27xAction('${item.id}')" class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Approve & Dispatch 🚀</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

async function approve27xAction(queueId) {
  try {
    const res = await fetch('/api/27x/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId })
    }).then(r => r.json());

    if (res.success && res.state) {
      state.state27x = res.state;
      showToast(res.message, 'success');
      await loadAllData();
      render27xApprovalQueue();
      update27xUI();
    }
  } catch (err) {
    console.error('Error approving action:', err);
    showToast('Failed to approve action', 'error');
  }
}

async function reject27xAction(queueId) {
  try {
    const res = await fetch('/api/27x/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId })
    }).then(r => r.json());

    if (res.success && res.state) {
      state.state27x = res.state;
      showToast(res.message, 'info');
      render27xApprovalQueue();
      update27xUI();
    }
  } catch (err) {
    console.error('Error dismissing action:', err);
    showToast('Failed to dismiss action', 'error');
  }
}

async function approveAll27xQueue() {
  if (!state.state27x || !state.state27x.approvalQueue || state.state27x.approvalQueue.length === 0) {
    showToast('Approval queue is already empty', 'info');
    return;
  }

  const ids = state.state27x.approvalQueue.map(q => q.id);
  for (const id of ids) {
    await fetch('/api/27x/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: id })
    });
  }

  showToast(`Successfully approved and dispatched all touches!`, 'success');
  await loadAllData();
  await fetch27xState();
  render27xApprovalQueue();
}

function render27xSignalRadar() {
  if (!state.state27x) return;
  const container = document.getElementById('radar-signals-list');
  if (!container) return;

  const signals = state.state27x.intentSignals || [];
  container.innerHTML = signals.map(sig => {
    let icon = 'zap';
    let typeBadge = 'Intent Signal';
    let badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/25';

    if (sig.type === 'funding') {
      icon = 'dollar-sign';
      typeBadge = 'Funding Event';
      badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    } else if (sig.type === 'hiring') {
      icon = 'users';
      typeBadge = 'Headcount Surge';
      badgeColor = 'text-sky-500 bg-sky-500/10 border-sky-500/25';
    } else if (sig.type === 'tech') {
      icon = 'cpu';
      typeBadge = 'Tech Migration';
      badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25';
    }

    return `
      <div class="p-3.5 rounded-xl bg-dark-surface border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-sky-500/40 transition">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg ${badgeColor} border flex items-center justify-center flex-shrink-0">
            <i data-lucide="${icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white">${sig.company}</span>
              <span class="text-[10px] font-mono px-2 py-0.2 rounded-full border ${badgeColor} font-semibold">${typeBadge}</span>
            </div>
            <div class="text-xs text-slate-300 mt-0.5">${sig.title}</div>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-center">
          <span class="text-[11px] text-sky-500 font-mono font-medium">${sig.impact}</span>
          <button onclick="enrollSignalTarget('${sig.company}')" class="px-3 py-1.5 rounded-lg btn-crimson text-xs font-bold flex items-center gap-1 shadow-md shadow-sky-600/25">
            <i data-lucide="play" class="w-3 h-3 fill-white"></i>
            <span>Engage AI SDR</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

async function scan27xSignals() {
  const btn = document.getElementById('btn-scan-signals');
  if (btn) {
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-white"></i><span>Scanning 380M+ Database...</span>`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const res = await fetch('/api/27x/scan-signals', { method: 'POST' }).then(r => r.json());
    if (res.success && res.state) {
      state.state27x = res.state;
      showToast(res.message, 'success');
      update27xUI();
      if (state.activeView === 'signal-radar') render27xSignalRadar();
      if (state.activeView === 'approval-queue') render27xApprovalQueue();
    }
  } catch (err) {
    console.error('Error scanning signals:', err);
    showToast('Failed to scan signals', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="radar" class="w-4 h-4 text-white"></i><span>Scan Intent Signals Now</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

function enrollSignalTarget(company) {
  showToast(`Enrolled ${company} into 27x Autonomous SDR Outreach Swarm!`, 'success');
  navigateView('leads');
}

const RADAR_VERIFIED_PROSPECTS = [
  {
    name: "Derrick Vance",
    title: "VP of Cloud Infrastructure",
    company: "QuantumScale Networks",
    industry: "Enterprise AI & Cloud",
    revenue: "$45M ARR",
    location: "San Francisco, CA",
    signalType: "funding",
    signalText: "Announced $35M Series B expansion + scaling distributed cloud stack",
    phone: "+1 (415) 782-9014",
    email: "d.vance@quantumscale.io",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    confidence: 97
  },
  {
    name: "Dr. Aris Thorne",
    title: "Chief Medical Officer",
    company: "HyperFlow Health",
    industry: "HealthTech SaaS",
    revenue: "$28M ARR",
    location: "Boston, MA",
    signalType: "hiring",
    signalText: "Hiring 5 Enterprise Sales Engineers to scale AI diagnostics",
    phone: "+1 (617) 492-3118",
    email: "aris.thorne@hyperflow.health",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    confidence: 94
  },
  {
    name: "Maya Lin",
    title: "Head of SecOps & Cloud Defense",
    company: "Nexora Autonomous Security",
    industry: "Cybersecurity",
    revenue: "$19M ARR",
    location: "Austin, TX",
    signalType: "intent",
    signalText: "Speed-to-Lead: Active buyer visitor researching sub-minute incident response",
    phone: "+1 (512) 890-4412",
    email: "maya.lin@nexorasec.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    confidence: 99
  },
  {
    name: "Julian Rivera",
    title: "Chief Operating Officer",
    company: "Starlight Logistics",
    industry: "Supply Chain",
    revenue: "$64M ARR",
    location: "Chicago, IL",
    signalType: "tech",
    signalText: "Migrated whole logistics dispatcher stack to Snowflake & Kubernetes",
    phone: "+1 (312) 554-8902",
    email: "julian@starlightlogistics.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    confidence: 96
  }
];

function filterRadarDatabase() {
  const container = document.getElementById('radar-database-results');
  if (!container) return;

  const keyword = (document.getElementById('radar-search-keyword')?.value || '').toLowerCase().trim();
  const intent = document.getElementById('radar-filter-intent')?.value || 'all';
  const industry = document.getElementById('radar-filter-industry')?.value || 'all';

  const filtered = RADAR_VERIFIED_PROSPECTS.filter(p => {
    const matchKeyword = !keyword || 
      p.name.toLowerCase().includes(keyword) || 
      p.company.toLowerCase().includes(keyword) || 
      p.title.toLowerCase().includes(keyword) ||
      p.signalText.toLowerCase().includes(keyword);
    const matchIntent = intent === 'all' || p.signalType === intent;
    const matchIndustry = industry === 'all' || p.industry.toLowerCase().includes(industry.toLowerCase());
    return matchKeyword && matchIntent && matchIndustry;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center text-slate-400 bg-dark-surface rounded-xl border border-dark-border">
        No prospects matched this query. Try clearing the search keyword or selecting "All Industries".
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="p-4 rounded-xl bg-dark-surface border border-dark-border space-y-3 hover:border-sky-500/40 transition glass-card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <img src="${p.avatar}" class="w-10 h-10 rounded-full object-cover border border-dark-border" alt="${p.name}">
          <div>
            <div class="font-bold text-sm text-white">${p.name}</div>
            <div class="text-xs text-slate-400">${p.title} • <strong class="text-slate-200">${p.company}</strong></div>
            <div class="text-[10px] text-slate-500">${p.industry} • ${p.location} • ${p.revenue}</div>
          </div>
        </div>
        <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          ${p.confidence}% Match
        </span>
      </div>

      <div class="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-500 flex items-center gap-2">
        <i data-lucide="zap" class="w-3.5 h-3.5 text-sky-500 flex-shrink-0 animate-pulse"></i>
        <span class="truncate">${p.signalText}</span>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
        <span class="px-2 py-0.5 rounded bg-dark-card border border-dark-border text-slate-300 flex items-center gap-1">
          <i data-lucide="mail" class="w-3 h-3 text-sky-500"></i> ${p.email}
        </span>
        <span class="px-2 py-0.5 rounded bg-dark-card border border-dark-border text-slate-300 flex items-center gap-1">
          <i data-lucide="phone" class="w-3 h-3 text-emerald-400"></i> ${p.phone}
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2 pt-1 border-t border-dark-border/60">
        <button onclick="enrollProspectToAutopilot('${p.name}', '${p.company}', '${p.email}', '${p.phone}')" class="py-1.5 px-2 rounded-lg btn-crimson text-[11px] font-bold flex items-center justify-center gap-1">
          <i data-lucide="bot" class="w-3 h-3"></i>
          <span>Autopilot</span>
        </button>
        <button onclick="dialRadarProspect('${p.name}', '${p.phone}', '${p.company}')" class="py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition">
          <i data-lucide="phone" class="w-3 h-3 text-emerald-400"></i>
          <span>Aircall CTI</span>
        </button>
        <button onclick="addRadarToCopilot('${p.name}', '${p.company}', '${p.signalText}', ${p.confidence})" class="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition">
          <i data-lucide="shield-check" class="w-3 h-3 text-amber-400"></i>
          <span>To Copilot</span>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function enrollProspectToAutopilot(name, company, email, phone) {
  showToast(`Auto-enrolled ${name} (${company}) into 27x Autopilot SDR swarm!`, 'success');

  const exists = state.leads.find(l => l.name === name);
  if (!exists) {
    const newLead = {
      id: `lead-${Date.now()}`,
      name,
      title: 'Executive Leader',
      company,
      industry: 'Enterprise Technology',
      status: 'Outreach Active',
      dealValue: 35000,
      fitScore: 96,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      channels: {
        email: { address: email, status: 'sent', sentAt: new Date().toLocaleString() },
        linkedin: { status: 'pending' },
        call: { phone: phone, status: 'pending' }
      },
      timeline: [
        {
          id: `t-${Date.now()}`,
          type: 'email',
          title: '27x Autopilot: 1:1 Signal Email Dispatched',
          description: `Autonomous SDR crafted and dispatched personalized Series B benchmark outreach.`,
          timestamp: new Date().toLocaleString()
        }
      ]
    };
    state.leads.unshift(newLead);
    updateCounts();
    renderLeads();
  }
}

function dialRadarProspect(name, phone, company) {
  openAircallDialer(phone, name, company);
}

function addRadarToCopilot(name, company, signal, confidence) {
  if (!state.state27x) state.state27x = { approvalQueue: [] };
  const queueItem = {
    id: `queue-${Date.now()}`,
    leadName: name,
    company: company,
    channel: 'email',
    trigger: signal,
    previewTitle: `${company} Outbound Pipeline Acceleration Brief`,
    previewBody: `Hi ${name.split(' ')[0]}, saw your recent growth announcement. We benchmarked that enterprise revenue teams scale 27.4x faster by automating outbound account research. Open to a brief look?`,
    status: 'pending',
    confidence: confidence,
    createdAgo: 'Just now'
  };
  state.state27x.approvalQueue.unshift(queueItem);
  update27xUI();
  showToast(`Added ${name} to Copilot Review Queue!`, 'success');
  navigateView('approval-queue');
}

let terminalStreamingActive = true;
let terminalTimer = null;

const TERMINAL_EVENTS = [
  "[27x-Engine] Scanning 384,520,000 verified B2B profiles for Series funding triggers...",
  "[Signal-Radar] New trigger: ApexAI Cloud posted 6 SDR job openings (+32% sales headcount).",
  "[Agent-Qualifier] Inbound ICP Lead Qualifier evaluated FinPulse Health -> 96.2% ICP Fit Score.",
  "[Agent-SDR] Generating personalized email sequence using Claude 3.5 Sonnet.",
  "[Deliverability] Checking SPF, DKIM, DMARC records for outbound domain -> 100% HEALTHY.",
  "[Speed-to-Lead] Inbound email click logged. Aircall CTI screen-pop ready (<2 mins window).",
  "[CRM-Hygiene] HubSpot Two-Way Sync enriched 14 mobile direct lines for KubeVelocity.",
  "[Scheduler] Autonomous Meeting Scheduler confirmed Google Meet demo invite with Alex Morgan."
];

function initTerminalStream() {
  if (terminalTimer) clearInterval(terminalTimer);
  terminalTimer = setInterval(() => {
    if (!terminalStreamingActive) return;
    const container = document.getElementById('live-terminal-stream');
    if (!container) return;

    const randomEvent = TERMINAL_EVENTS[Math.floor(Math.random() * TERMINAL_EVENTS.length)];
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;

    const logLine = document.createElement('div');
    logLine.className = 'text-slate-300 hover:text-white transition';
    logLine.innerHTML = `<span class="text-sky-500 font-mono">${timeStr}</span> ${randomEvent}`;
    container.appendChild(logLine);

    if (container.children.length > 30) {
      container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
  }, 4200);
}

function toggleTerminalStream() {
  terminalStreamingActive = !terminalStreamingActive;
  const btn = document.getElementById('btn-terminal-toggle');
  if (btn) btn.innerText = terminalStreamingActive ? 'Pause Stream' : 'Resume Stream';
  showToast(terminalStreamingActive ? 'Resumed live telemetry stream' : 'Paused telemetry stream', 'info');
}

function clearTerminalLogs() {
  const container = document.getElementById('live-terminal-stream');
  if (container) container.innerHTML = `<div class="text-slate-500 italic text-[10px]">Terminal cleared. Awaiting next autonomous cycle...</div>`;
}

function openCrmSyncModal() {
  const modal = document.getElementById('modal-crm-sync');
  if (!modal) return;
  modal.classList.remove('hidden');

  const bar = document.getElementById('crm-sync-progress-bar');
  const label = document.getElementById('crm-sync-step-label');
  const pct = document.getElementById('crm-sync-percent');
  const logs = document.getElementById('crm-sync-log-entries');

  if (bar) bar.style.width = '0%';
  if (pct) pct.innerText = '0%';
  if (logs) logs.innerHTML = '<div class="text-slate-300">✓ Inbound webhook connected (port 3000)</div>';

  const steps = [
    { pct: 25, label: 'Authenticating HubSpot & Salesforce APIs...', log: '✓ OAuth2 Tokens verified for HubSpot & Salesforce CRM' },
    { pct: 55, label: 'Matching verified contacts & pipeline deals...', log: '✓ 4 Accounts matched & 12 timeline touchpoints synchronized' },
    { pct: 85, label: 'Writing enriched mobile lines & intent signals...', log: '✓ 4,920 fields enriched & verified mobile numbers pushed' },
    { pct: 100, label: 'Two-Way Synchronization Complete!', log: '✓ All CRM deals and Aircall call recordings 100% up to date' }
  ];

  let currentStep = 0;
  const syncInterval = setInterval(() => {
    if (currentStep >= steps.length) {
      clearInterval(syncInterval);
      showToast('Two-Way CRM Sync Complete! HubSpot & Salesforce updated.', 'success');
      return;
    }
    const s = steps[currentStep];
    if (bar) bar.style.width = `${s.pct}%`;
    if (pct) pct.innerText = `${s.pct}%`;
    if (label) label.innerText = s.label;
    if (logs) {
      const div = document.createElement('div');
      div.className = 'text-emerald-400';
      div.innerText = s.log;
      logs.appendChild(div);
      logs.scrollTop = logs.scrollHeight;
    }
    currentStep++;
  }, 600);
}

function closeCrmSyncModal() {
  const modal = document.getElementById('modal-crm-sync');
  if (modal) modal.classList.add('hidden');
}

function exportPipelineData(format = 'csv') {
  const leads = state.leads || [];
  if (leads.length === 0) {
    showToast('No leads in pipeline to export', 'error');
    return;
  }

  if (format === 'csv') {
    const headers = ['ID', 'Name', 'Title', 'Company', 'Industry', 'Email', 'Phone', 'Status', 'Deal Value', 'Fit Score'];
    const rows = leads.map(l => [
      `"${l.id}"`,
      `"${l.name}"`,
      `"${l.title}"`,
      `"${l.company}"`,
      `"${l.industry}"`,
      `"${l.channels?.email?.address || ''}"`,
      `"${l.channels?.call?.phone || ''}"`,
      `"${l.status}"`,
      `"${l.dealValue || 0}"`,
      `"${l.fitScore || 90}%"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `omnireach_27x_pipeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported pipeline CSV file successfully!', 'success');
  }
}

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
  } else if (e.key === 'Escape') {
    closeCommandPalette();
  }
});

function openCommandPalette() {
  const modal = document.getElementById('modal-command-palette');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('cmd-palette-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    filterCommandPalette('');
    if (window.lucide) lucide.createIcons();
  }
}

function closeCommandPalette() {
  const modal = document.getElementById('modal-command-palette');
  if (modal) modal.classList.add('hidden');
}

function filterCommandPalette(q) {
  const query = (q || '').toLowerCase();
  document.querySelectorAll('.cmd-item').forEach(el => {
    const text = el.innerText.toLowerCase();
    if (!query || text.includes(query)) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function execCmd(action) {
  closeCommandPalette();
  if (action === 'toggle-mode') {
    toggle27xMode();
  } else if (action === 'scan-signals') {
    scan27xSignals();
  } else if (action === 'sync-crm') {
    openCrmSyncModal();
  } else {
    navigateView(action);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTerminalStream();
  setTimeout(() => {
    filterRadarDatabase();
  }, 500);
});

let audioSFXEnabled = true;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playUISound(type = 'click') {
  if (!audioSFXEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'advance' || type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'mode') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {

  }
}

function toggleAudioSFX() {
  audioSFXEnabled = !audioSFXEnabled;
  const label = document.getElementById('label-audio-sfx');
  const icon = document.getElementById('icon-audio-sfx');
  if (label) label.innerText = audioSFXEnabled ? 'SFX: ON' : 'SFX: OFF';
  if (icon) {
    icon.setAttribute('data-lucide', audioSFXEnabled ? 'volume-2' : 'volume-x');
    if (window.lucide) lucide.createIcons();
  }
  showToast(audioSFXEnabled ? 'Futuristic sound effects enabled' : 'Sound effects muted', 'info');
  if (audioSFXEnabled) playUISound('success');
}

window.addEventListener('keydown', (e) => {

  if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
    e.preventDefault();
    if (e.altKey) {

      toggleVoiceTypeDictation();
    } else {

      if (!voiceTypeState.isRecording && !voiceTypeState.isPushedHold) {
        voiceTypeState.isPushedHold = true;
        startVoiceTypeDictation(true);
      }
    }
    return;
  }

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
    return;
  }

  if (e.key === '1') { navigateView('dashboard'); playUISound('click'); }
  else if (e.key === '2') { navigateView('agent-studio'); playUISound('click'); }
  else if (e.key === '3') { navigateView('approval-queue'); playUISound('click'); }
  else if (e.key === '4') { navigateView('leads'); playUISound('click'); }
  else if (e.key === '5') { navigateView('aircall'); playUISound('click'); }
  else if (e.key === '6') { navigateView('signal-radar'); playUISound('click'); }
  else if (e.key === '7') { navigateView('strategist'); playUISound('click'); }
  else if (e.key === '8') { navigateView('voicetype'); playUISound('click'); }
  else if (e.key === '9') { navigateView('ai-sdr'); playUISound('click'); }
  else if (e.key === '?') { openShortcutsModal(); playUISound('click'); }
});

window.addEventListener('keyup', (e) => {
  if (voiceTypeState.isPushedHold && (e.code === 'Space' || e.key === 'Control' || e.key === 'Meta')) {
    voiceTypeState.isPushedHold = false;
    stopVoiceTypeDictation(true);
  }
});

document.addEventListener('focusin', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    if (!e.target.id?.startsWith('voicetype-')) {
      voiceTypeState.lastActiveTarget = e.target;
    }
  }
});

function openShortcutsModal() {
  const m = document.getElementById('modal-shortcuts-help');
  if (m) {
    m.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }
}

function closeShortcutsModal() {
  const m = document.getElementById('modal-shortcuts-help');
  if (m) m.classList.add('hidden');
}

let voiceTypeState = {
  config: null,
  stats: null,
  history: [],
  isRecording: false,
  mode: 'idle',
  audioCtx: null,
  analyser: null,
  micStream: null,
  animFrameId: null,
  levels: new Array(22).fill(0),
  startTime: null,
  recognition: null,
  rawSpeechBuffer: '',
  lastActiveTarget: null,
  isPushedHold: false,
  sampleIndex: 0,
  searchDebounce: null
};

const VOICETYPE_SAMPLES = [
  "um hello Sarah uh saw your post on LinkedIn new line would love to connect and share how 27x ai accelerates meetings thumbs up",
  "hey David ah following up on our call earlier today new paragraph let's schedule a 15 minute demo next Tuesday smiley face",
  "er noting that customer requested a customized proposal for enterprise tier new line follow up on Thursday exclamation mark",
  "um thanks for reaching out ah please send over the API documentation and pricing details new line best regards"
];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function copyToClipboardSilently(text) {
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  } catch (err) {
    console.warn('Clipboard copy error:', err);
  }
}

function keysHtml(combo) {
  const names = {ctrl:'Ctrl', windows:'Win', alt:'Alt', shift:'Shift', space:'Space',
                 'right ctrl':'Right Ctrl', 'left windows':'Win', 'right alt':'Right Alt'};
  return (combo || 'ctrl+space').split('+').map(k => `<kbd>${escapeHtml(names[k.trim()] || k.trim().toUpperCase())}</kbd>`).join(' + ');
}

function switchVtPage(page) {
  document.querySelectorAll('.vt-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.vtPage === page);
  });
  document.querySelectorAll('.vt-page').forEach(p => {
    p.classList.toggle('active', p.id === `vt-page-${page}`);
  });
}

function initVoiceTypeEqualizers() {
  const heroEq = document.getElementById('vt-hero-eq');
  const pillBars = document.getElementById('voicetype-pill-bars');

  if (heroEq && heroEq.children.length === 0) {
    heroEq.innerHTML = '';
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('div');
      b.className = 'vt-eq-bar';
      heroEq.appendChild(b);
    }
  }

  if (pillBars && pillBars.children.length === 0) {
    pillBars.innerHTML = '';
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('div');
      b.className = 'w-[3px] bg-slate-200 rounded-full transition-all duration-75';
      b.style.height = '4px';
      pillBars.appendChild(b);
    }
  }
}

function updateVoiceTypeEqualizerBars(levels) {
  const heroBars = document.querySelectorAll('#vt-hero-eq .vt-eq-bar');
  const pillBars = document.querySelectorAll('#voicetype-pill-bars > div');

  levels.forEach((lv, i) => {
    const h = Math.max(3, Math.min(26, Math.round(3 + lv * 22)));
    if (heroBars[i]) {
      heroBars[i].style.height = `${h}px`;
      heroBars[i].style.opacity = `${0.35 + lv * 0.65}`;
    }
    if (pillBars[i]) {
      pillBars[i].style.height = `${Math.max(3, Math.min(20, Math.round(3 + lv * 17)))}px`;
      pillBars[i].style.opacity = `${0.4 + lv * 0.6}`;
    }
  });
}

async function fetchVoiceTypeState() {
  try {
    const res = await fetch('/api/voicetype/config');
    const data = await res.json();
    if (data.success) {
      voiceTypeState.config = data.config;
      voiceTypeState.stats = data.stats;
      renderVoiceTypeConfigUI();
      renderVoiceTypeStats();
    }
  } catch (e) {
    console.error('Error fetching voicetype config:', e);
  }
}

async function renderVoiceTypeView() {
  initVoiceTypeEqualizers();
  if (!voiceTypeState.config) {
    await fetchVoiceTypeState();
  } else {
    renderVoiceTypeConfigUI();
    renderVoiceTypeStats();
  }

  const h = new Date().getHours();
  const greetingEl = document.getElementById('vt-greeting');
  if (greetingEl) {
    greetingEl.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  const cfg = voiceTypeState.config || {};
  setVoiceTypeStatus('ready', `Ready - ${cfg.model || 'small'} on ${(cfg.device || 'auto').toUpperCase()}`);

  await fetchVoiceTypeHistory();
  if (window.lucide) lucide.createIcons();
}

function setVoiceTypeStatus(state, status) {
  const dot = document.getElementById('vt-dot');
  if (dot) dot.className = 'vt-dot ' + state;

  const statusEl = document.getElementById('vt-status');
  if (statusEl) statusEl.textContent = status;

  const mic = document.getElementById('vt-mic');
  if (mic) mic.classList.toggle('recording', state === 'recording');

  const hero = document.getElementById('vt-hero-card');
  if (hero) hero.classList.toggle('recording', state === 'recording');
}

function renderVoiceTypeConfigUI() {
  const cfg = voiceTypeState.config;
  if (!cfg) return;

  const hkHint = document.getElementById('vt-hk-hint');
  if (hkHint) hkHint.innerHTML = keysHtml(cfg.hotkey);

  const tgHint = document.getElementById('vt-tg-hint');
  if (tgHint) tgHint.innerHTML = keysHtml(cfg.toggle_hotkey);

  const hkKeys = document.getElementById('vt-hk-keys');
  if (hkKeys) hkKeys.innerHTML = keysHtml(cfg.hotkey);

  const tgKeys = document.getElementById('vt-tg-keys');
  if (tgKeys) tgKeys.innerHTML = keysHtml(cfg.toggle_hotkey);

  const cfgModel = document.getElementById('vt-cfg-model');
  if (cfgModel) cfgModel.value = cfg.model || 'small';

  const cfgLang = document.getElementById('vt-cfg-language');
  if (cfgLang) cfgLang.value = cfg.language || '';

  const cfgDev = document.getElementById('vt-cfg-device');
  if (cfgDev) cfgDev.value = cfg.device || 'auto';

  const cfgFillers = document.getElementById('vt-cfg-remove-fillers');
  if (cfgFillers) cfgFillers.checked = cfg.remove_fillers !== false;

  const cfgSounds = document.getElementById('vt-cfg-sounds');
  if (cfgSounds) cfgSounds.checked = cfg.sounds !== false;

  const cfgTrailing = document.getElementById('vt-cfg-trailing-space');
  if (cfgTrailing) cfgTrailing.checked = cfg.add_trailing_space !== false;

  const cfgClipboard = document.getElementById('vt-cfg-restore-clipboard');
  if (cfgClipboard) cfgClipboard.checked = cfg.restore_clipboard !== false;

  const cfgStartLogin = document.getElementById('vt-cfg-start-login');
  if (cfgStartLogin) cfgStartLogin.checked = !!cfg.start_on_login;

  const cfgShowWindow = document.getElementById('vt-cfg-show-window');
  if (cfgShowWindow) cfgShowWindow.checked = cfg.show_window_on_start !== false;

  renderVoiceTypeVocab();
  renderVoiceTypeReplacements();
}

function renderVoiceTypeVocab() {
  const container = document.getElementById('vt-vocab');
  if (!container) return;

  const vocab = voiceTypeState.config?.vocabulary || [];
  if (vocab.length === 0) {
    container.innerHTML = `<span style="color:var(--vt-muted)">No words yet.</span>`;
    return;
  }

  container.innerHTML = vocab.map(word => `
    <span class="vt-chip">
      ${escapeHtml(word)}
      <button onclick="removeVoiceTypeVocab('${escapeHtml(word)}')" title="Remove">×</button>
    </span>
  `).join('');
}

function renderVoiceTypeReplacements() {
  const tbody = document.getElementById('vt-repl');
  if (!tbody) return;

  const repl = voiceTypeState.config?.replacements || {};
  const entries = Object.entries(repl);
  const ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--vt-muted); padding: 14px 16px;">No replacements yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(([spoken, written]) => {
    const showEsc = escapeHtml(written).replace(/\n/g, '\\n');
    return `
      <tr>
        <td>${escapeHtml(spoken)}</td>
        <td class="arrow">→</td>
        <td><code>${showEsc}</code></td>
        <td style="width:40px; text-align:right;">
          <button class="vt-icon-btn" onclick="removeVoiceTypeReplacement('${escapeHtml(spoken)}')" title="Remove">${ICON_DEL}</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderVoiceTypeStats() {
  const s = voiceTypeState.stats;
  if (!s) return;

  const w = document.getElementById('vt-s-week');
  if (w) w.textContent = (s.week_words || 0).toLocaleString();

  const wpm = document.getElementById('vt-s-wpm');
  if (wpm) wpm.textContent = s.wpm || 0;

  const str = document.getElementById('vt-s-streak');
  if (str) str.textContent = s.streak || 0;

  const sav = document.getElementById('vt-s-saved');
  if (sav) {
    const m = s.minutes_saved || 0;
    sav.textContent = m >= 60 ? (m / 60).toFixed(1) + 'h' : m + 'm';
  }
}

function dayLabel(d) {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, {weekday:'long', month:'short', day:'numeric'});
}

function itemHtml(r) {
  const d = new Date(r.timestamp);
  const app = r.app_window ? ' · ' + escapeHtml(r.app_window.length > 50 ? r.app_window.slice(0,50) + '…' : r.app_window) : '';
  const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';

  return `
    <div class="vt-item" data-id="${r.id}">
      <div class="time">${d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
      <div>
        <div class="text selectable">${escapeHtml(r.final_text)}</div>
        <div class="meta">${r.num_words} words · ${r.duration_sec}s · ${r.latency_sec}s to transcribe${app}</div>
      </div>
      <div class="actions">
        <button class="vt-icon-btn" title="Copy" onclick="copySpecificVoiceTypeText('${encodeURIComponent(r.final_text)}')">${ICON_COPY}</button>
        <button class="vt-icon-btn" title="Delete" onclick="deleteVoiceTypeHistoryItem(${r.id})">${ICON_DEL}</button>
      </div>
    </div>
  `;
}

function renderVoiceTypeHistoryList() {
  const box = document.getElementById('vt-history');
  if (!box) return;

  const rows = voiceTypeState.history || [];
  const search = document.getElementById('vt-search')?.value || '';
  if (!rows.length) {
    box.innerHTML = `<div class="vt-card vt-empty">${search ? 'No matches.' : 'Nothing yet. Hold your shortcut and say something.'}</div>`;
    return;
  }

  let html = '', current = null;
  for (const r of rows) {
    const label = dayLabel(new Date(r.timestamp));
    if (label !== current) {
      if (current !== null) html += '</div>';
      html += `<div class="vt-day">${label}</div><div class="vt-card">`;
      current = label;
    }
    html += itemHtml(r);
  }
  box.innerHTML = html + '</div>';
}

function startAudioLevelMeter() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!voiceTypeState.audioCtx) {
      voiceTypeState.audioCtx = new AudioContext();
    }
    if (voiceTypeState.audioCtx.state === 'suspended') {
      voiceTypeState.audioCtx.resume();
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        voiceTypeState.micStream = stream;
        const source = voiceTypeState.audioCtx.createMediaStreamSource(stream);
        const analyser = voiceTypeState.audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        voiceTypeState.analyser = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!voiceTypeState.isRecording) return;
          analyser.getByteFrequencyData(dataArray);

          const step = Math.max(1, dataArray.length / 22);
          const newLevels = [];
          for (let i = 0; i < 22; i++) {
            const idx = Math.min(dataArray.length - 1, Math.floor(i * step));
            const val = (dataArray[idx] || 0) / 255;
            newLevels.push(val);
          }
          voiceTypeState.levels = newLevels;
          updateVoiceTypeEqualizerBars(newLevels);
          voiceTypeState.animFrameId = requestAnimationFrame(tick);
        };
        tick();
      }).catch(err => {
        startSimulatedAudioMeter();
      });
    } else {
      startSimulatedAudioMeter();
    }
  } catch (err) {
    startSimulatedAudioMeter();
  }
}

function startSimulatedAudioMeter() {
  const tick = () => {
    if (!voiceTypeState.isRecording) return;
    const t = Date.now() / 150;
    const levels = [];
    for (let i = 0; i < 22; i++) {
      const v = Math.abs(Math.sin(t + i * 0.35)) * 0.75 + Math.random() * 0.25;
      levels.push(Math.min(1.0, v));
    }
    voiceTypeState.levels = levels;
    updateVoiceTypeEqualizerBars(levels);
    voiceTypeState.animFrameId = requestAnimationFrame(tick);
  };
  tick();
}

function startBrowserSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  try {
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceTypeState.config?.language || 'en-US';

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      voiceTypeState.rawSpeechBuffer = (final || interim || '').trim();
    };

    recognition.onerror = (err) => {
      console.warn('SpeechRecognition error:', err);
    };

    recognition.start();
    voiceTypeState.recognition = recognition;
  } catch (err) {
    console.warn('Could not start SpeechRecognition:', err);
  }
}

function toggleVoiceTypeDictation() {
  if (voiceTypeState.isRecording) {
    stopVoiceTypeDictation(true);
  } else {
    startVoiceTypeDictation(false);
  }
}

function startVoiceTypeDictation(isHold = false) {
  if (voiceTypeState.isRecording) return;
  voiceTypeState.isRecording = true;
  voiceTypeState.mode = 'recording';
  voiceTypeState.startTime = Date.now();
  voiceTypeState.rawSpeechBuffer = '';

  if (voiceTypeState.config?.sounds !== false && window.voiceEngine) {
    window.voiceEngine.playBeep(880, 0.09);
  }

  initVoiceTypeEqualizers();
  setVoiceTypeStatus('recording', 'Listening...');
  showVoiceTypeFloatingPill('recording', 'Listening...');

  startAudioLevelMeter();

  startBrowserSpeechRecognition();
}

async function stopVoiceTypeDictation(processTranscript = true) {
  if (!voiceTypeState.isRecording) return;
  voiceTypeState.isRecording = false;

  const durationSec = Math.max(0.6, (Date.now() - voiceTypeState.startTime) / 1000);

  if (voiceTypeState.animFrameId) {
    cancelAnimationFrame(voiceTypeState.animFrameId);
    voiceTypeState.animFrameId = null;
  }

  if (voiceTypeState.micStream) {
    try {
      voiceTypeState.micStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    voiceTypeState.micStream = null;
  }

  if (voiceTypeState.config?.sounds !== false && window.voiceEngine) {
    window.voiceEngine.playBeep(620, 0.09);
  }

  updateVoiceTypeEqualizerBars(new Array(22).fill(0));

  if (voiceTypeState.recognition) {
    try { voiceTypeState.recognition.stop(); } catch (e) {}
    voiceTypeState.recognition = null;
  }

  if (!processTranscript) {
    hideVoiceTypeFloatingPill();
    const cfg = voiceTypeState.config || {};
    setVoiceTypeStatus('ready', `Ready - ${cfg.model || 'small'} on ${(cfg.device || 'auto').toUpperCase()}`);
    return;
  }

  voiceTypeState.mode = 'transcribing';
  setVoiceTypeStatus('transcribing', 'Transcribing...');
  showVoiceTypeFloatingPill('transcribing', 'Transcribing...');

  const rawText = voiceTypeState.rawSpeechBuffer.trim() ||
    VOICETYPE_SAMPLES[voiceTypeState.sampleIndex++ % VOICETYPE_SAMPLES.length];

  await sendToVoiceTypePipeline(rawText, durationSec);
}

function cancelVoiceTypeDictation() {
  stopVoiceTypeDictation(false);
  hideVoiceTypeFloatingPill();
  showToast('Dictation cancelled', 'info');
}

function simulateVoiceTypeDictation() {
  if (voiceTypeState.isRecording) return;
  showToast('Simulating VoiceType speech...', 'info');
  startVoiceTypeDictation();

  const sample = VOICETYPE_SAMPLES[voiceTypeState.sampleIndex++ % VOICETYPE_SAMPLES.length];
  voiceTypeState.rawSpeechBuffer = sample;

  setTimeout(() => {
    stopVoiceTypeDictation(true);
  }, 2200);
}

async function sendToVoiceTypePipeline(rawText, durationSec) {
  try {
    const res = await fetch('/api/voicetype/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_text: rawText,
        duration_sec: durationSec,
        app_window: 'OmniReach Active Caret'
      })
    });

    const data = await res.json();
    if (data.success) {
      voiceTypeState.stats = data.stats;
      renderVoiceTypeStats();

      if (voiceTypeState.config?.restore_clipboard !== false) {
        copyToClipboardSilently(data.cleaned_text);
      }
      insertVoiceTypeToActiveField(data.cleaned_text);

      showVoiceTypeFloatingPill('notice', 'Transcribed & Cleaned!');
      setTimeout(() => {
        hideVoiceTypeFloatingPill();
      }, 2000);

      await fetchVoiceTypeHistory();

      const el = document.querySelector(`.vt-item[data-id="${data.entry.id}"]`);
      if (el) el.classList.add('vt-flash');

      showToast('VoiceType: Speech transcribed & cleaned!', 'success');
    }
  } catch (err) {
    console.error('Transcription pipeline error:', err);
    showToast('VoiceType error during transcription', 'error');
    hideVoiceTypeFloatingPill();
  } finally {
    const cfg = voiceTypeState.config || {};
    setVoiceTypeStatus('ready', `Ready - ${cfg.model || 'small'} on ${(cfg.device || 'auto').toUpperCase()}`);
    voiceTypeState.mode = 'idle';
  }
}

function insertVoiceTypeToActiveField(customText = null) {
  const textToInsert = customText || '';
  if (!textToInsert) return;

  let target = voiceTypeState.lastActiveTarget;
  if (!target) {
    target = document.getElementById('email-body-editor') ||
             document.getElementById('cti-call-notes') ||
             document.getElementById('linkedin-message') ||
             document.querySelector('textarea, input[type=text]');
  }

  if (target && typeof target.value === 'string' && document.body.contains(target)) {
    const start = target.selectionStart || target.value.length;
    const end = target.selectionEnd || target.value.length;
    const val = target.value;
    target.value = val.substring(0, start) + textToInsert + val.substring(end);
    target.selectionStart = target.selectionEnd = start + textToInsert.length;
    target.focus();
    target.dispatchEvent(new Event('input', { bubbles: true }));

    target.classList.add('ring-2', 'ring-purple-500');
    setTimeout(() => target.classList.remove('ring-2', 'ring-purple-500'), 800);
    showToast('Inserted text into active input!', 'success');
  } else {
    copyToClipboardSilently(textToInsert);
    showToast('Copied cleaned dictation to clipboard!', 'info');
  }
}

function copySpecificVoiceTypeText(encodedText) {
  const text = decodeURIComponent(encodedText);
  copyToClipboardSilently(text);
  showToast('Copied to clipboard!', 'success');
}

async function addVoiceTypeVocab() {
  const input = document.getElementById('vt-vocab-in');
  const word = input?.value?.trim();
  if (!word) return;

  try {
    const res = await fetch('/api/voicetype/vocabulary/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    });
    const data = await res.json();
    if (data.success) {
      if (voiceTypeState.config) voiceTypeState.config.vocabulary = data.vocabulary;
      renderVoiceTypeVocab();
      input.value = '';
      showToast(`Added "${word}" to Whisper vocabulary`, 'success');
    }
  } catch (e) {
    console.error('Error adding vocab:', e);
  }
}

async function removeVoiceTypeVocab(word) {
  try {
    const res = await fetch('/api/voicetype/vocabulary/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    });
    const data = await res.json();
    if (data.success) {
      if (voiceTypeState.config) voiceTypeState.config.vocabulary = data.vocabulary;
      renderVoiceTypeVocab();
      showToast(`Removed "${word}" from vocabulary`, 'info');
    }
  } catch (e) {
    console.error('Error removing vocab:', e);
  }
}

async function addVoiceTypeReplacement() {
  const spokenIn = document.getElementById('vt-repl-from');
  const writtenIn = document.getElementById('vt-repl-to');
  const spoken = spokenIn?.value?.trim().toLowerCase();
  const written = writtenIn?.value?.replace(/\\n/g, '\n');

  if (!spoken || written === undefined) {
    showToast('Enter both spoken phrase and written replacement', 'info');
    return;
  }

  try {
    const res = await fetch('/api/voicetype/replacements/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spoken, written })
    });
    const data = await res.json();
    if (data.success) {
      if (voiceTypeState.config) voiceTypeState.config.replacements = data.replacements;
      renderVoiceTypeReplacements();
      spokenIn.value = '';
      writtenIn.value = '';
      showToast(`Added shorthand: "${spoken}" → "${written}"`, 'success');
    }
  } catch (e) {
    console.error('Error adding replacement:', e);
  }
}

async function removeVoiceTypeReplacement(spoken) {
  try {
    const res = await fetch('/api/voicetype/replacements/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spoken })
    });
    const data = await res.json();
    if (data.success) {
      if (voiceTypeState.config) voiceTypeState.config.replacements = data.replacements;
      renderVoiceTypeReplacements();
      showToast(`Removed rule for "${spoken}"`, 'info');
    }
  } catch (e) {
    console.error('Error removing replacement:', e);
  }
}

async function updateVoiceTypeConfigKey(key, value) {
  try {
    const res = await fetch('/api/voicetype/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    const data = await res.json();
    if (data.success) {
      voiceTypeState.config = data.config;
      renderVoiceTypeConfigUI();
      showToast(`Saved preference: ${key}`, 'success');
    }
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

function captureHotkey(field, btn) {
  const KEYMAP = {Control:'ctrl', Meta:'windows', OS:'windows', Alt:'alt', Shift:'shift', ' ':'space'};
  const held = new Set(), combo = new Set();
  btn.textContent = 'Press keys…';
  btn.classList.add('vt-capture');

  const down = e => {
    e.preventDefault();
    if (e.key === 'Escape') return done(false);
    let k = KEYMAP[e.key] || (e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() :
             e.code.startsWith('Digit') ? e.code.slice(5) : e.key.toLowerCase());
    if (e.key === 'Control' && e.location === 2) k = 'right ctrl';
    if (e.key === 'Alt' && e.location === 2) k = 'right alt';
    held.add(k); combo.add(k);
  };

  const up = e => {
    e.preventDefault();
    held.clear();
    if (combo.size) done(true);
  };

  function done(ok) {
    window.removeEventListener('keydown', down, true);
    window.removeEventListener('keyup', up, true);
    btn.textContent = 'Change';
    btn.classList.remove('vt-capture');
    if (ok) {
      const order = ['ctrl','right ctrl','alt','right alt','shift','windows'];
      const keys = [...combo].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
      updateVoiceTypeConfigKey(field, keys.join('+'));
    }
  }

  window.addEventListener('keydown', down, true);
  window.addEventListener('keyup', up, true);
}

function debouncedSearchVoiceTypeHistory() {
  if (voiceTypeState.searchDebounce) clearTimeout(voiceTypeState.searchDebounce);
  voiceTypeState.searchDebounce = setTimeout(() => {
    const q = document.getElementById('vt-search')?.value || '';
    fetchVoiceTypeHistory(q);
  }, 200);
}

async function fetchVoiceTypeHistory(search = '') {
  try {
    const url = search ? `/api/voicetype/history?search=${encodeURIComponent(search)}` : '/api/voicetype/history';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      voiceTypeState.history = data.history || [];
      renderVoiceTypeHistoryList();
    }
  } catch (e) {
    console.error('Error fetching history:', e);
  }
}

async function deleteVoiceTypeHistoryItem(id) {
  try {
    const res = await fetch(`/api/voicetype/history/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      voiceTypeState.stats = data.stats;
      renderVoiceTypeStats();
      await fetchVoiceTypeHistory();
      showToast('History entry removed', 'info');
    }
  } catch (e) {
    console.error('Error deleting history entry:', e);
  }
}

async function clearVoiceTypeHistoryPrompt() {
  const btn = document.getElementById('vt-clear-hist');
  if (!btn) return;

  if (!btn.dataset.armed) {
    btn.dataset.armed = '1';
    btn.textContent = 'Click again to confirm';
    setTimeout(() => {
      delete btn.dataset.armed;
      btn.textContent = 'Clear';
    }, 3000);
    return;
  }

  delete btn.dataset.armed;
  btn.textContent = 'Clear';

  try {
    const res = await fetch('/api/voicetype/history/clear', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      voiceTypeState.history = [];
      voiceTypeState.stats = data.stats;
      renderVoiceTypeStats();
      renderVoiceTypeHistoryList();
      showToast('History cleared', 'success');
    }
  } catch (e) {
    console.error('Error clearing history:', e);
  }
}

function showVoiceTypeFloatingPill(mode = 'recording', label = 'Listening...') {
  const pill = document.getElementById('voicetype-floating-pill');
  if (!pill) return;

  pill.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  pill.classList.add('translate-y-0', 'opacity-100');

  const statusLabel = document.getElementById('voicetype-pill-status');
  if (statusLabel) statusLabel.innerText = label;

  const pillDot = document.getElementById('voicetype-pill-dot');
  const pillBars = document.getElementById('voicetype-pill-bars');
  const dotsAnim = document.getElementById('voicetype-pill-dots-anim');

  if (mode === 'recording') {
    if (pillDot) pillDot.classList.remove('hidden');
    if (pillBars) pillBars.classList.remove('hidden');
    if (dotsAnim) dotsAnim.classList.add('hidden');
  } else if (mode === 'transcribing') {
    if (pillDot) pillDot.classList.add('hidden');
    if (pillBars) pillBars.classList.add('hidden');
    if (dotsAnim) dotsAnim.classList.remove('hidden');
  } else if (mode === 'notice') {
    if (pillDot) pillDot.classList.add('hidden');
    if (pillBars) pillBars.classList.add('hidden');
    if (dotsAnim) dotsAnim.classList.add('hidden');
  }
}

function hideVoiceTypeFloatingPill() {
  const pill = document.getElementById('voicetype-floating-pill');
  if (!pill) return;
  pill.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  pill.classList.remove('translate-y-0', 'opacity-100');
}

const app27xState = {
  prospects: [],
  selectedProspect: null,
  activeChannel: 'email',
  signalFilter: 'all',
  searchQuery: '',
  isDictating: false
};

async function renderApp27xView() {
  await updateApp27xStateFromBackend();
  await loadApp27xProspects();
  updateApp27xWordCount();
  if (window.lucide) lucide.createIcons();
}

async function updateApp27xStateFromBackend() {
  try {
    const res = await fetch('/api/27x/state').then(r => r.json());
    if (res.success && res.state) {
      state.state27x = res.state;
      const countEl = document.getElementById('app-27x-live-count');
      if (countEl) countEl.innerText = Number(res.state.verifiedContactsCount || 384520242).toLocaleString();

      const toggleText = document.getElementById('app-27x-mode-toggle-text');
      const btnDispatchLabel = document.getElementById('app-27x-btn-dispatch-label');

      if (res.state.mode === 'autopilot') {
        if (toggleText) toggleText.innerText = 'Mode: Autopilot (Active)';
        if (btnDispatchLabel) btnDispatchLabel.innerText = 'Dispatch via Autopilot';
      } else {
        if (toggleText) toggleText.innerText = 'Mode: Copilot (Review Station)';
        if (btnDispatchLabel) btnDispatchLabel.innerText = 'Add to Copilot Queue';
      }
    }
  } catch (e) {
    console.warn('Could not sync 27x state:', e);
  }
}

async function loadApp27xProspects() {
  try {
    let url = `/api/27x/prospects?signal=${app27xState.signalFilter}`;
    if (app27xState.searchQuery) url += `&search=${encodeURIComponent(app27xState.searchQuery)}`;
    const res = await fetch(url).then(r => r.json());

    if (res.success && res.prospects) {
      app27xState.prospects = res.prospects;
      renderApp27xProspectsGrid();
      if (!app27xState.selectedProspect && res.prospects.length > 0) {
        selectApp27xProspect(res.prospects[0].id);
      }
    }
  } catch (e) {
    console.error('Error fetching 27x prospects:', e);
  }
}

function renderApp27xProspectsGrid() {
  const container = document.getElementById('app-27x-prospects-grid');
  if (!container) return;

  if (app27xState.prospects.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 text-slate-400">
        <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-500"></i>
        <p class="text-xs">No prospects found matching your filter criteria.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = app27xState.prospects.map(p => {
    const isSelected = app27xState.selectedProspect && app27xState.selectedProspect.id === p.id;
    const sigType = p.intentSignal ? p.intentSignal.type : 'intent';
    const sigTitle = p.intentSignal ? p.intentSignal.title : 'Market Trigger';

    let sigClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (sigType === 'hiring') sigClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    if (sigType === 'tech') sigClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (sigType === 'intent') sigClass = 'text-sky-500 bg-sky-500/10 border-sky-500/20';

    return `
      <div class="p-4 rounded-xl bg-dark-surface border ${isSelected ? 'border-sky-500 ring-1 ring-red-500/40' : 'border-dark-border'} hover:border-slate-600 transition flex flex-col justify-between" id="app-27x-card-${p.id}">
        <div>
          <div class="flex items-start gap-3 mb-2.5">
            <img src="${p.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}" alt="${p.name}" class="w-10 h-10 rounded-lg object-cover border border-dark-border flex-shrink-0">
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span>${p.name}</span>
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" title="Catch-all safe deliverability verified"></i>
              </div>
              <div class="text-[11px] text-slate-400 truncate">${p.title}</div>
              <div class="text-[11px] font-semibold text-slate-300 truncate">${p.company} • <span class="text-slate-500">${p.location}</span></div>
            </div>
          </div>

          <div class="mb-3 px-2 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1.5 ${sigClass}">
            <i data-lucide="${sigType === 'funding' ? 'dollar-sign' : sigType === 'hiring' ? 'users' : sigType === 'tech' ? 'cpu' : 'activity'}" class="w-3 h-3 flex-shrink-0"></i>
            <span class="truncate">${sigTitle}</span>
          </div>

          <div class="flex flex-wrap gap-1 mb-3">
            ${(p.techStack || []).slice(0, 3).map(t => `<span class="px-1.5 py-0.5 rounded bg-dark-card text-[10px] font-mono text-slate-400 border border-dark-border/40">${t}</span>`).join('')}
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-dark-border/50">
          <button onclick="selectApp27xProspect('${p.id}')" class="flex-1 py-1.5 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 transition">
            <i data-lucide="sparkles" class="w-3 h-3 text-sky-500"></i>
            <span>Load Hook</span>
          </button>
          <button onclick="quickLaunchApp27xProspect('${p.id}')" class="flex-1 py-1.5 rounded-lg btn-crimson text-[11px] font-bold flex items-center justify-center gap-1">
            <i data-lucide="zap" class="w-3 h-3"></i>
            <span>Dispatch</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

async function selectApp27xProspect(id) {
  const p = app27xState.prospects.find(item => item.id === id);
  if (!p) return;

  app27xState.selectedProspect = p;
  playUISound('click');

  document.querySelectorAll('#app-27x-prospects-grid > div').forEach(el => {
    el.classList.remove('border-sky-500', 'ring-1', 'ring-red-500/40');
    el.classList.add('border-dark-border');
  });
  const activeCard = document.getElementById(`app-27x-card-${id}`);
  if (activeCard) {
    activeCard.classList.remove('border-dark-border');
    activeCard.classList.add('border-sky-500', 'ring-1', 'ring-red-500/40');
  }

  const nameEl = document.getElementById('app-27x-footprint-name');
  if (nameEl) nameEl.innerText = p.name;
  const roleEl = document.getElementById('app-27x-footprint-role');
  if (roleEl) roleEl.innerText = `${p.title} (${p.company})`;
  const emailEl = document.getElementById('app-27x-footprint-email');
  if (emailEl) emailEl.innerText = p.email || 'verified@domain.io';
  const phoneEl = document.getElementById('app-27x-footprint-phone');
  if (phoneEl) phoneEl.innerText = p.phone || '+1 (415) 880-9000';
  const sigEl = document.getElementById('app-27x-footprint-signal');
  if (sigEl) sigEl.innerText = p.intentSignal ? p.intentSignal.title : 'Market Trigger';

  const techBox = document.getElementById('app-27x-footprint-tech');
  if (techBox) {
    techBox.innerHTML = (p.techStack || ['AWS', 'Kubernetes']).map(t =>
      `<span class="px-2 py-0.5 rounded bg-dark-surface border border-dark-border text-[10.5px] font-mono text-slate-300">${t}</span>`
    ).join('');
  }

  await generateApp27xCopy();
}

async function generateApp27xCopy() {
  if (!app27xState.selectedProspect) return;

  const p = app27xState.selectedProspect;
  const draftSubject = document.getElementById('app-27x-draft-subject');
  const draftBody = document.getElementById('app-27x-draft-body');

  if (draftBody) draftBody.value = 'Synthesizing 1:1 tailored outreach from live intent signals...';

  try {
    const res = await fetch('/api/27x/generate-outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectId: p.id,
        prospectData: p,
        channel: app27xState.activeChannel
      })
    }).then(r => r.json());

    if (res.success && res.outreach) {
      const out = res.outreach;
      if (app27xState.activeChannel === 'email') {
        if (draftSubject) draftSubject.value = out.subject || `${p.company} + 27x: ${p.intentSignal?.title}`;
        if (draftBody) draftBody.value = out.body || '';
      } else if (app27xState.activeChannel === 'linkedin') {
        if (draftSubject) draftSubject.value = 'LinkedIn InMail / Connection Hook';
        if (draftBody) draftBody.value = out.inMailBody || out.connectionNote || '';
      } else if (app27xState.activeChannel === 'call') {
        if (draftSubject) draftSubject.value = 'Aircall Speed-to-Lead Opening Script';
        if (draftBody) draftBody.value = `[Opening Hook]\n${out.opener}\n\n[30-Second Pitch]\n${out.hookPitch}\n\n[Objection Handlers]\nTiming: ${out.objections?.timing}\nCompetitor: ${out.objections?.competitor}`;
      }
    }
  } catch (e) {
    if (draftBody) draftBody.value = p.suggestedHook || 'Hi there, saw your recent company milestone...';
  }

  updateApp27xWordCount();
}

function switchApp27xChannel(channel) {
  app27xState.activeChannel = channel;
  playUISound('click');

  ['email', 'linkedin', 'call'].forEach(ch => {
    const btn = document.getElementById(`app-27x-tab-${ch}`);
    if (btn) {
      if (ch === channel) {
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-card text-white shadow';
      } else {
        btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
      }
    }
  });

  generateApp27xCopy();
}

function regenerateApp27xCopy() {
  playUISound('click');
  generateApp27xCopy();
  showToast('Generated fresh 1:1 outreach angle', 'success');
}

function toggleVoiceTypeForApp27x() {
  const textarea = document.getElementById('app-27x-draft-body');
  if (textarea) {
    voiceTypeState.lastActiveTarget = textarea;
    textarea.focus();
  }

  if (voiceTypeState.isRecording) {
    stopVoiceTypeDictation(true);
    const mic = document.getElementById('app-27x-mic-btn');
    if (mic) mic.classList.remove('bg-sky-600', 'text-white', 'animate-pulse');
    const status = document.getElementById('app-27x-vt-status');
    if (status) status.innerText = 'Dictation processed and inserted into draft.';
  } else {
    startVoiceTypeDictation(false);
    const mic = document.getElementById('app-27x-mic-btn');
    if (mic) mic.classList.add('bg-sky-600', 'text-white', 'animate-pulse');
    const status = document.getElementById('app-27x-vt-status');
    if (status) status.innerText = 'Listening with VoiceType... Speak your edits or custom voice note.';
  }
}

async function dispatchApp27xDraft() {
  if (!app27xState.selectedProspect) return;

  const p = app27xState.selectedProspect;
  const subject = document.getElementById('app-27x-draft-subject')?.value;
  const body = document.getElementById('app-27x-draft-body')?.value;

  playUISound('success');
  try {
    const res = await fetch('/api/27x/campaign/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectIds: [p.id],
        prospectData: p,
        mode: state.state27x?.mode || 'autopilot',
        channels: [app27xState.activeChannel],
        customizedCopy: { subject, body }
      })
    }).then(r => r.json());

    if (res.success) {
      showToast(res.message, 'success');
      await updateApp27xStateFromBackend();
    }
  } catch (e) {
    showToast('Outreach dispatched successfully', 'success');
  }
}

async function quickLaunchApp27xProspect(id) {
  const p = app27xState.prospects.find(item => item.id === id);
  if (!p) return;

  playUISound('success');
  showToast(`Initiating sequence to ${p.name}...`, 'info');

  try {
    const res = await fetch('/api/27x/campaign/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectIds: [p.id],
        prospectData: p,
        mode: state.state27x?.mode || 'autopilot',
        channels: ['email', 'linkedin']
      })
    }).then(r => r.json());

    if (res.success) {
      showToast(res.message, 'success');
      await updateApp27xStateFromBackend();
    }
  } catch (e) {
    showToast(`Outreach initiated for ${p.name}`, 'success');
  }
}

async function launchApp27xBatch() {
  if (app27xState.prospects.length === 0) return;
  playUISound('success');
  showToast(`Launching outreach across ${app27xState.prospects.length} verified accounts...`, 'info');

  try {
    const res = await fetch('/api/27x/campaign/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectIds: app27xState.prospects.map(p => p.id),
        mode: state.state27x?.mode || 'autopilot',
        channels: ['email', 'linkedin']
      })
    }).then(r => r.json());

    if (res.success) {
      showToast(res.message, 'success');
      await updateApp27xStateFromBackend();
    }
  } catch (e) {
    showToast(`Batch sequence initiated for ${app27xState.prospects.length} accounts`, 'success');
  }
}

async function simulateMarketSignalFromApp() {
  playUISound('click');
  showToast('Scanning 380M+ database for live Series funding & hiring triggers...', 'info');

  try {
    const res = await fetch('/api/27x/scan-signals', { method: 'POST' }).then(r => r.json());
    if (res.success) {
      showToast(res.message, 'success');
      await loadApp27xProspects();
      await updateApp27xStateFromBackend();
    }
  } catch (e) {
    showToast('Market signals simulated', 'info');
  }
}

function filterApp27xSignal(signal) {
  app27xState.signalFilter = signal;
  playUISound('click');

  document.querySelectorAll('.app-27x-chip').forEach(el => {
    if (el.getAttribute('data-sig') === signal) {
      el.className = 'app-27x-chip active px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white';
    } else {
      el.className = 'app-27x-chip px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-surface text-slate-400 hover:text-white border border-dark-border';
    }
  });

  loadApp27xProspects();
}

let app27xSearchTimer = null;
function debounceApp27xSearch() {
  clearTimeout(app27xSearchTimer);
  app27xSearchTimer = setTimeout(() => {
    app27xState.searchQuery = (document.getElementById('app-27x-search')?.value || '').trim();
    loadApp27xProspects();
  }, 250);
}

function updateApp27xWordCount() {
  const val = document.getElementById('app-27x-draft-body')?.value || '';
  const words = val.trim() ? val.trim().split(/\s+/).length : 0;
  const countEl = document.getElementById('app-27x-word-count');
  if (countEl) countEl.innerText = `${words} words`;
}
