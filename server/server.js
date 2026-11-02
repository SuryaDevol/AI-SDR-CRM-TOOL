const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const aiService = require('./aiService');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
  }
  return defaultValue;
}

function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    return false;
  }
}

let leads = readJsonFile('leads.json', []);
let sequences = readJsonFile('sequences.json', []);
let settings = readJsonFile('settings.json', {});
let businessMemory = readJsonFile('business_memory.json', {});
let autonomousLogs = [];

let voiceTypeConfig = readJsonFile('voicetype_config.json', {
  hotkey: 'ctrl+space',
  toggle_hotkey: 'ctrl+alt+space',
  model: 'small',
  device: 'auto',
  language: 'en',
  beam_size: 5,
  remove_fillers: true,
  add_trailing_space: true,
  sounds: true,
  min_duration_sec: 0.3,
  max_duration_sec: 360,
  restore_clipboard: true,
  vocabulary: ["VoiceType", "OmniReach", "27x.ai", "Aircall", "SDR Swarm", "CRM", "Pipeline"],
  replacements: {
    "new line": "\n",
    "new paragraph": "\n\n",
    "smiley face": "😊",
    "thumbs up": "👍",
    "question mark": "?",
    "exclamation mark": "!",
    "at rate": "@"
  }
});
let voiceTypeHistory = readJsonFile('voicetype_history.json', []);

let state27x = readJsonFile('state_27x.json', {
  mode: 'autopilot',
  verifiedContactsCount: 384520242,
  pipelineSpeedMultiplier: 27.4,
  agents: [
    {
      id: 'agent-sdr',
      name: 'Autonomous AI SDR',
      role: 'Outbound Prospecting & 1:1 Personalization',
      status: 'active',
      mode: 'autopilot',
      model: 'Claude 3.5 Sonnet / GPT-4o',
      icon: 'sparkles',
      stats: { contactsResearched: 1420, draftsCreated: 840, conversionLift: '27.4x' },
      description: 'Scans 380M+ contacts, studies buyer digital footprint & tech stack, writes hyper-personalized emails and LinkedIn InMails.'
    },
    {
      id: 'agent-qualifier',
      name: 'Inbound ICP Lead Qualifier',
      role: 'Account Scoring & Signal Intelligence',
      status: 'active',
      mode: 'copilot',
      model: 'GPT-4o Enterprise',
      icon: 'target',
      stats: { accountsEvaluated: 612, icpFitScore: '96.2%', flaggedHighIntent: 128 },
      description: 'Scores website visitors and inbound demo requests against ICP criteria in real time, routing tier-1 accounts directly to rep.'
    },
    {
      id: 'agent-scheduler',
      name: 'Autonomous Meeting Scheduler',
      role: 'Calendar Coordination & Auto-Booking',
      status: 'active',
      mode: 'autopilot',
      model: 'Claude 3.5 Sonnet',
      icon: 'calendar-check',
      stats: { demosBookedThisMonth: 54, avgBookingSpeed: '4m 12s', noShowRate: '3.1%' },
      description: 'Evaluates high purchase interest in emails/calls, checks rep calendar availability, and locks confirmed Google Meet demo invites.'
    },
    {
      id: 'agent-cti',
      name: 'Speed-to-Lead Aircall CTI Agent',
      role: 'Live Phone Telephony & Inbox-to-Ringtone',
      status: 'active',
      mode: 'autopilot',
      model: 'WebAudio Synth + Aircall CTI',
      icon: 'phone-forwarded',
      stats: { connectRate: '68.4%', triggerLatency: '<3 mins', liveCallsPlaced: 38 },
      description: 'Triggers outbound calls via Aircall within 5 minutes of an email open or click, popping battlecards with full context.'
    },
    {
      id: 'agent-crm-sync',
      name: 'CRM Enrichment & Hygiene Agent',
      role: 'HubSpot & Salesforce Two-Way Sync',
      status: 'active',
      mode: 'autopilot',
      model: 'DataSync Engine',
      icon: 'database',
      stats: { fieldsEnriched: 4920, duplicatesEliminated: 184, lastSync: 'Just now' },
      description: 'Continuously enriches CRM accounts with verified phone lines, tech stack changes, and logs every touchpoint automatically.'
    }
  ],
  approvalQueue: [
    {
      id: 'queue-01',
      leadId: 'lead-01',
      leadName: 'Sarah Chen',
      company: 'ApexAI Cloud',
      channel: 'email',
      trigger: 'Hiring 6 SDRs & Scaling Outbound',
      previewTitle: 'Tailored Series B Outbound Scaling Benchmark',
      previewBody: 'Hi Sarah, noticed ApexAI Cloud is scaling sales headcount after your Series B. Built a benchmark showing how autonomous SDRs eliminate 15 hrs/rep/week of manual research while driving 27x pipeline lift. Quick 10 mins this Thursday?',
      status: 'pending',
      confidence: 96,
      createdAgo: '4m ago'
    },
    {
      id: 'queue-02',
      leadId: 'lead-02',
      leadName: 'Marcus Vance',
      company: 'KubeVelocity',
      channel: 'linkedin',
      trigger: 'Keynote at KubeCon on Multi-Cloud Reliability',
      previewTitle: 'LinkedIn Connection Note (<300 chars)',
      previewBody: 'Marcus, your KubeCon session on multi-cloud reliability resonated. We help DevOps revenue leaders automate outbound prospect research with live buyer signals. Would love to stay connected.',
      status: 'pending',
      confidence: 94,
      createdAgo: '12m ago'
    },
    {
      id: 'queue-03',
      leadId: 'lead-03',
      leadName: 'Elena Rostova',
      company: 'FinPulse Health',
      channel: 'call',
      trigger: 'Speed-to-Lead: Email Opened 3x in 5 Minutes',
      previewTitle: 'Aircall Outbound Call + Battlecard Ready',
      previewBody: 'Elena opened the HIPAA Compliance ROI cold email 3 times in the last 4 minutes. Aircall CTI line +1 (415) 890-7621 primed with opening bridge.',
      status: 'pending',
      confidence: 98,
      createdAgo: 'Just now'
    }
  ],
  intentSignals: [
    { id: 'sig-01', type: 'funding', title: '$24M Series B Announced', company: 'ApexAI Cloud', date: 'Yesterday', impact: 'High Budget Unlocked' },
    { id: 'sig-02', type: 'hiring', title: 'Hiring 8 Enterprise AEs & SDRs', company: 'KubeVelocity', date: '3 days ago', impact: 'Sales Expansion' },
    { id: 'sig-03', type: 'tech', title: 'Adopted Snowflake & Kubernetes', company: 'FinPulse Health', date: '1 week ago', impact: 'Modern Tech Stack' },
    { id: 'sig-04', type: 'intent', title: 'Researching Outbound Automation Tools', company: 'Starlight Logistics', date: '2 hours ago', impact: 'Active In-Market Buyer' }
  ]
});
let prospects27x = readJsonFile('prospects_27x.json', []);

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function calculateAnalytics() {
  const totalLeads = leads.length;
  const researched = leads.filter(l => l.status !== 'Prospect').length;
  const outreachActive = leads.filter(l => l.status === 'Outreach Active').length;
  const callsScheduled = leads.filter(l => l.status === 'Call Scheduled' || l.channels?.call?.meetingBooked).length;
  const wonDeals = leads.filter(l => l.status === 'Deal Won').length;

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const activePipelineValue = leads
    .filter(l => ['Outreach Active', 'Call Scheduled', 'Negotiation'].includes(l.status))
    .reduce((sum, l) => sum + (l.dealValue || 0), 0);

  const emailSent = leads.filter(l => l.channels?.email?.status === 'sent' || l.channels?.email?.sentAt).length;
  const emailOpened = leads.filter(l => (l.channels?.email?.opens || 0) > 0).length;
  const emailReplied = leads.filter(l => l.channels?.email?.status === 'replied').length;

  const linkedinConnected = leads.filter(l => l.channels?.linkedin?.status === 'connected' || l.channels?.linkedin?.status === 'messaged').length;
  const callsCompleted = leads.filter(l => l.channels?.call?.status === 'completed' || l.channels?.call?.meetingBooked).length;

  return {
    overview: {
      totalLeads,
      researched,
      outreachActive,
      callsScheduled,
      wonDeals,
      totalPipelineValue,
      activePipelineValue,
      averageFitScore: totalLeads ? Math.round(leads.reduce((s, l) => s + (l.fitScore || 0), 0) / totalLeads) : 0
    },
    conversionRates: {
      emailOpenRate: emailSent ? Math.round((emailOpened / emailSent) * 100) : 68,
      emailReplyRate: emailSent ? Math.round((emailReplied / emailSent) * 100) : 32,
      linkedinAcceptRate: 74,
      callConnectRate: 62,
      meetingBookingRate: totalLeads ? Math.round((callsScheduled / totalLeads) * 100) : 25
    },
    channelMetrics: {
      email: { sent: Math.max(emailSent, 24), opened: Math.max(emailOpened, 18), replied: Math.max(emailReplied, 8) },
      linkedin: { invitesSent: 35, accepted: Math.max(linkedinConnected, 26), messaged: 19 },
      call: { dials: 18, answered: 11, qualified: Math.max(callsCompleted, 4), booked: Math.max(callsScheduled, 3) }
    }
  };
}

const FILLERS_REGEX = /\b(um+|uh+|erm+|er|ah+|hmm+|mm+)\b[,.]?\s*/gi;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanVoiceTypeText(text, cfg = voiceTypeConfig) {
  let cleaned = text || '';
  if (cfg.remove_fillers !== false) {
    cleaned = cleaned.replace(FILLERS_REGEX, '');
  }
  const replacements = cfg.replacements || {};
  for (const [spoken, written] of Object.entries(replacements)) {
    if (!spoken) continue;
    const pattern = new RegExp(`\\s*\\b${escapeRegExp(spoken)}\\b[,.]?\\s*`, 'gi');
    cleaned = cleaned.replace(pattern, written);
  }

  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').trim();

  if (cleaned.length > 0 && /^[a-z]/i.test(cleaned[0])) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }

  if (cleaned.length > 0 && cfg.add_trailing_space && !cleaned.endsWith('\n') && !cleaned.endsWith(' ')) {
    cleaned += ' ';
  }
  return cleaned;
}

function calcVoiceTypeStats(history = voiceTypeHistory) {
  const total_words = history.reduce((sum, h) => sum + (h.num_words || 0), 0);
  const total_secs = history.reduce((sum, h) => sum + (h.duration_sec || 0), 0);
  const sessions = history.length;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const week_words = history
    .filter(h => h.timestamp >= weekAgo)
    .reduce((sum, h) => sum + (h.num_words || 0), 0);

  const days = new Set(history.map(h => (h.timestamp || '').slice(0, 10)).filter(Boolean));
  let streak = 0;
  let curr = new Date(now);
  const todayStr = curr.toISOString().slice(0, 10);
  if (!days.has(todayStr)) {
    curr.setDate(curr.getDate() - 1);
  }
  while (days.has(curr.toISOString().slice(0, 10))) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }

  const wpm = total_secs > 5 ? Math.round(total_words / (total_secs / 60)) : 0;

  const minutes_saved = Math.max(0, Math.round((total_words / 40) - (total_secs / 60)));

  return {
    total_words,
    week_words,
    sessions,
    wpm,
    streak,
    minutes_saved
  };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  if (pathname === '/api/leads' && method === 'GET') {
    const { status, search, industry } = query;
    let filtered = [...leads];

    if (status && status !== 'all') {
      filtered = filtered.filter(l => l.status.toLowerCase() === status.toLowerCase());
    }
    if (industry && industry !== 'all') {
      filtered = filtered.filter(l => l.industry.toLowerCase().includes(industry.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    }
    return sendJson(res, 200, { success: true, count: filtered.length, leads: filtered });
  }

  if (pathname.startsWith('/api/leads/') && method === 'GET') {
    const id = pathname.replace('/api/leads/', '');
    const lead = leads.find(l => l.id === id);
    if (!lead) return sendJson(res, 404, { success: false, error: 'Lead not found' });
    return sendJson(res, 200, { success: true, lead });
  }

  if (pathname === '/api/leads' && method === 'POST') {
    const body = await parseBody(req);
    const newLead = {
      id: `lead-${Date.now()}`,
      name: body.name || 'New Prospect',
      title: body.title || 'Executive',
      company: body.company || 'Enterprise Corp',
      website: body.website || 'https://example.com',
      industry: body.industry || 'Technology SaaS',
      location: body.location || 'United States',
      companySize: body.companySize || '50-200 employees',
      annualRevenue: body.annualRevenue || '$10M ARR',
      email: body.email || `lead@${(body.company || 'example').toLowerCase().replace(/\s+/g, '')}.com`,
      phone: body.phone || '+1 (555) 019-2834',
      linkedin: body.linkedin || `linkedin.com/in/${(body.name || 'prospect').toLowerCase().replace(/\s+/g, '')}`,
      avatar: body.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      status: 'Prospect',
      fitScore: body.fitScore || 85,
      intentScore: body.intentScore || 75,
      dealValue: body.dealValue || 35000,
      channels: {
        email: { status: 'ready', subject: '', body: '', opens: 0, clicks: 0 },
        linkedin: { status: 'ready', connectionNote: '', inMailText: '', socialActions: [] },
        call: { status: 'pending', callScript: '', transcript: [], callDuration: '0s', sentiment: 'Neutral', meetingBooked: false, meetingTime: null }
      },
      timeline: [
        { id: `t-${Date.now()}`, type: 'note', title: 'Lead Added to OmniReach CRM', description: 'Lead successfully captured and queued for AI intelligence processing.', timestamp: new Date().toLocaleString() }
      ]
    };

    leads.unshift(newLead);
    writeJsonFile('leads.json', leads);
    return sendJson(res, 201, { success: true, lead: newLead });
  }

  if (pathname.startsWith('/api/leads/') && method === 'PUT') {
    const id = pathname.replace('/api/leads/', '');
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const updates = await parseBody(req);
    leads[index] = { ...leads[index], ...updates };
    writeJsonFile('leads.json', leads);
    return sendJson(res, 200, { success: true, lead: leads[index] });
  }

  if (pathname.startsWith('/api/leads/') && method === 'DELETE') {
    const id = pathname.replace('/api/leads/', '');
    leads = leads.filter(l => l.id !== id);
    writeJsonFile('leads.json', leads);
    return sendJson(res, 200, { success: true, message: 'Lead deleted' });
  }

  if (pathname === '/api/research/discover' && method === 'POST') {
    const body = await parseBody(req);
    const { industry, title, companySize, autoEnroll = false } = body;

    const candidates = aiService.SAMPLE_DISCOVERY_DATABASE.filter(c => {
      let match = true;
      if (industry && industry !== 'all') {
        match = match && c.industry.toLowerCase().includes(industry.toLowerCase());
      }
      return match;
    });

    const discovered = (candidates.length ? candidates : aiService.SAMPLE_DISCOVERY_DATABASE).map(c => {
      const enriched = aiService.enrichLeadData(c);
      return {
        id: `lead-disc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...enriched,
        status: 'Prospect',
        channels: {
          email: { status: 'ready', subject: '', body: '', opens: 0, clicks: 0 },
          linkedin: { status: 'ready', connectionNote: '', inMailText: '', socialActions: [] },
          call: { status: 'pending', callScript: '', transcript: [], callDuration: '0s', sentiment: 'Neutral', meetingBooked: false, meetingTime: null }
        },
        timeline: [
          {
            id: `t-${Date.now()}`,
            type: 'research',
            title: 'Prospect Discovered via AI ICP Scanner',
            description: `Matched on industry [${enriched.industry}] with high intent signals. Fit score: ${enriched.fitScore}%.`,
            timestamp: new Date().toLocaleString()
          }
        ]
      };
    });

    if (autoEnroll) {
      discovered.forEach(d => leads.unshift(d));
      writeJsonFile('leads.json', leads);
    }

    return sendJson(res, 200, {
      success: true,
      count: discovered.length,
      leads: discovered,
      message: `AI ICP Engine discovered ${discovered.length} verified high-intent accounts.`
    });
  }

  if (pathname.startsWith('/api/research/enrich/') && method === 'POST') {
    const id = pathname.replace('/api/research/enrich/', '');
    const lead = leads.find(l => l.id === id);
    if (!lead) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const enriched = aiService.enrichLeadData(lead);
    enriched.status = enriched.status === 'Prospect' ? 'Researched' : enriched.status;
    enriched.timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'research',
      title: 'AI Deep Account Enrichment Complete',
      description: `Identified 3 core operational pain points, tech stack (${enriched.research.techStack.join(', ')}), and customized executive icebreaker.`,
      timestamp: new Date().toLocaleString()
    });

    const index = leads.findIndex(l => l.id === id);
    leads[index] = enriched;
    writeJsonFile('leads.json', leads);

    return sendJson(res, 200, { success: true, lead: enriched });
  }

  if (pathname.startsWith('/api/outreach/email/generate/') && method === 'POST') {
    const id = pathname.replace('/api/outreach/email/generate/', '');
    const lead = leads.find(l => l.id === id);
    if (!lead) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const generated = aiService.generatePersonalizedEmail(lead, 'Book 10-min Intro Demo', businessMemory);
    lead.channels.email.subject = generated.subject;
    lead.channels.email.body = generated.body;
    writeJsonFile('leads.json', leads);

    return sendJson(res, 200, { success: true, email: generated, lead });
  }

  if (pathname.startsWith('/api/outreach/email/send/') && method === 'POST') {
    const id = pathname.replace('/api/outreach/email/send/', '');
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const lead = leads[index];
    lead.channels.email.status = 'sent';
    lead.channels.email.sentAt = new Date().toLocaleString();
    lead.status = 'Outreach Active';

    lead.timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'email',
      title: 'AI Personalized Cold Email Sent',
      description: `Dispatched "${lead.channels.email.subject || 'Automating Outbound Pipeline'}" to ${lead.email}. Deliverability Grade A+.`,
      timestamp: new Date().toLocaleString()
    });

    writeJsonFile('leads.json', leads);
    return sendJson(res, 200, { success: true, message: 'Email sent successfully', lead });
  }

  if (pathname.startsWith('/api/outreach/linkedin/generate/') && method === 'POST') {
    const id = pathname.replace('/api/outreach/linkedin/generate/', '');
    const lead = leads.find(l => l.id === id);
    if (!lead) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const generated = aiService.generateLinkedInOutreach(lead);
    lead.channels.linkedin.connectionNote = generated.connectionNote;
    lead.channels.linkedin.inMailText = generated.inMailText;
    writeJsonFile('leads.json', leads);

    return sendJson(res, 200, { success: true, linkedin: generated, lead });
  }

  if (pathname.startsWith('/api/outreach/linkedin/send/') && method === 'POST') {
    const id = pathname.replace('/api/outreach/linkedin/send/', '');
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const lead = leads[index];
    lead.channels.linkedin.status = 'pending';
    lead.channels.linkedin.socialActions = lead.channels.linkedin.socialActions || [];
    lead.channels.linkedin.socialActions.unshift({
      action: 'Connection Request Sent with Custom Note',
      timestamp: new Date().toLocaleString()
    });
    lead.status = 'Outreach Active';

    lead.timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'linkedin',
      title: 'LinkedIn Connection Request Dispatched',
      description: `Sent personalized connection note: "${lead.channels.linkedin.connectionNote?.slice(0, 70)}..."`,
      timestamp: new Date().toLocaleString()
    });

    writeJsonFile('leads.json', leads);
    return sendJson(res, 200, { success: true, message: 'LinkedIn invite dispatched', lead });
  }

  if (pathname.startsWith('/api/outreach/call/script/') && method === 'POST') {
    const id = pathname.replace('/api/outreach/call/script/', '');
    const lead = leads.find(l => l.id === id);
    if (!lead) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const script = aiService.generateCallScript(lead);
    lead.channels.call.callScript = `${script.opening}\n\n${script.hook}\n\n${script.closeQuestion}`;
    lead.channels.call.objectionPlan = script.objectionPlaybook;
    writeJsonFile('leads.json', leads);

    return sendJson(res, 200, { success: true, script, lead });
  }

  if (pathname === '/api/outreach/call/turn' && method === 'POST') {
    const body = await parseBody(req);
    const { userSpeech, leadId, turns = [] } = body;

    const lead = leads.find(l => l.id === leadId) || { name: 'Alex Rivera', company: 'CloudScale' };
    const turnResult = aiService.handleLiveCallTurn(userSpeech, lead, turns);

    return sendJson(res, 200, { success: true, ...turnResult });
  }

  if (pathname.startsWith('/api/outreach/call/complete/') && method === 'POST') {
    const id = pathname.replace('/api/outreach/call/complete/', '');
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const body = await parseBody(req);
    const { transcript = [], callDuration = '2m 14s', sentiment = 'High Interest', meetingBooked = false, meetingTime = null } = body;

    const lead = leads[index];
    lead.channels.call.status = meetingBooked ? 'meeting_booked' : 'completed';
    lead.channels.call.transcript = transcript;
    lead.channels.call.callDuration = callDuration;
    lead.channels.call.sentiment = sentiment;
    lead.channels.call.meetingBooked = meetingBooked;
    lead.channels.call.meetingTime = meetingTime || (meetingBooked ? 'Thursday, 2:00 PM EST' : null);

    if (meetingBooked) {
      lead.status = 'Call Scheduled';
    }

    lead.timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'call',
      title: meetingBooked ? 'AI Voice Call - Meeting Successfully Booked!' : 'AI Conversational Call Completed',
      description: `Duration: ${callDuration}. Sentiment: ${sentiment}. ${meetingBooked ? `Demo scheduled for ${lead.channels.call.meetingTime}` : 'Detailed transcript logged.'}`,
      timestamp: new Date().toLocaleString()
    });

    writeJsonFile('leads.json', leads);
    return sendJson(res, 200, { success: true, message: 'Call completed and logged', lead });
  }

  if (pathname === '/api/aircall/status' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      connected: true,
      provider: 'Aircall Voice CTI',
      account: {
        name: 'OmniReach AI Sales Org',
        user: 'Alex Morgan',
        status: 'Available',
        activeNumber: '+1 (415) 890-7621',
        activeNumberLabel: 'US Enterprise SDR Priority Line',
        availableLines: [
          { number: '+1 (415) 890-7621', label: 'US Enterprise SDR Priority Line', country: 'US' },
          { number: '+1 (646) 555-0199', label: 'New York Outbound Fast-Dial', country: 'US' },
          { number: '+44 20 7946 0912', label: 'London EMEA Expansion Line', country: 'GB' }
        ]
      },
      stats: {
        callsToday: 18,
        connectedRate: '68%',
        avgDuration: '2m 45s',
        inboxToRingtoneConversions: 5
      }
    });
  }

  if (pathname === '/api/aircall/smart-triggers' && method === 'GET') {
    const hotTriggers = leads
      .filter(l => (l.channels?.email?.opens || 0) > 0 || l.channels?.linkedin?.status === 'connected')
      .map(lead => {
        const opens = lead.channels?.email?.opens || 0;
        const lastSubject = lead.channels?.email?.subject || 'Outbound Pipeline';
        const isUrgent = opens >= 2;

        return {
          leadId: lead.id,
          name: lead.name,
          title: lead.title,
          company: lead.company,
          phone: lead.phone,
          avatar: lead.avatar,
          signalType: opens > 0 ? 'email_open' : 'linkedin_connected',
          signalText: opens > 0
            ? `Opened "${lastSubject.slice(0, 38)}..." ${opens}x`
            : `Accepted LinkedIn connection request`,
          urgency: isUrgent ? '🔥 Immediate Hot Lead' : '⚡ High Engagement',
          recommendation: `Call now via Aircall (${opens >= 2 ? '391% higher demo conversion' : 'Active social touchpoint'})`,
          idealCallWindow: 'Next 5 Minutes',
          triggerSource: opens > 0 ? 'inbox_opened_email' : 'linkedin_accepted'
        };
      });

    return sendJson(res, 200, {
      success: true,
      count: hotTriggers.length,
      triggers: hotTriggers
    });
  }

  if (pathname === '/api/aircall/dial' && method === 'POST') {
    const body = await parseBody(req);
    const { leadId, triggerSource = 'inbox_opened_email', fromNumber } = body;

    const lead = leads.find(l => l.id === leadId);
    if (!lead) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const battlecard = aiService.generateAircallScreenPopContext(lead, triggerSource);
    const callSessionId = `ac_call_${Date.now()}`;

    return sendJson(res, 200, {
      success: true,
      callId: callSessionId,
      toNumber: lead.phone,
      fromNumber: fromNumber || '+1 (415) 890-7621',
      lead,
      battlecard,
      message: `Aircall dialler bridged to ${lead.phone} with live context screen pop.`
    });
  }

  if (pathname === '/api/aircall/log' && method === 'POST') {
    const body = await parseBody(req);
    const {
      leadId,
      callId = `ac_${Date.now()}`,
      duration = '2m 18s',
      disposition = 'demo_booked',
      repNotes = '',
      meetingTime = null,
      autoQueueFollowup = true
    } = body;

    const index = leads.findIndex(l => l.id === leadId);
    if (index === -1) return sendJson(res, 404, { success: false, error: 'Lead not found' });

    const lead = leads[index];
    const followups = aiService.generateAircallPostCallFollowup(lead, disposition, repNotes);

    if (disposition === 'demo_booked') {
      lead.status = 'Call Scheduled';
      lead.channels.call.meetingBooked = true;
      lead.channels.call.meetingTime = meetingTime || 'Thursday 2:00 PM EST';
    } else if (lead.status === 'Prospect' || lead.status === 'Researched') {
      lead.status = 'Outreach Active';
    }

    if (autoQueueFollowup && followups.email) {
      lead.channels.email.subject = followups.email.subject;
      lead.channels.email.body = followups.email.body;
      lead.channels.email.status = 'ready_followup';
    }

    if (autoQueueFollowup && followups.linkedin && lead.channels?.linkedin) {
      lead.channels.linkedin.followUpMessage = followups.linkedin.text;
    }

    lead.timeline.unshift({
      id: `t-ac-${Date.now()}`,
      type: 'call',
      title: `Aircall Sales Call: ${followups.dispositionTag}`,
      description: `Duration: ${duration}. ${repNotes ? `Rep notes: "${repNotes}". ` : ''}Aircall ID: ${callId}. AI follow-up email and LinkedIn touchpoint prepared.`,
      timestamp: new Date().toLocaleString()
    });

    writeJsonFile('leads.json', leads);

    return sendJson(res, 200, {
      success: true,
      lead,
      followups,
      message: `Aircall call logged! Automatic follow-ups generated without breaking your workflow.`
    });
  }

  if (pathname === '/api/aircall/webhook' && method === 'POST') {
    const payload = await parseBody(req);
    console.log('[Aircall Webhook Received]:', payload.event || 'call.event');
    return sendJson(res, 200, { success: true, received: true });
  }

  if (pathname === '/api/strategist/memory' && method === 'GET') {
    return sendJson(res, 200, { success: true, memory: businessMemory });
  }

  if (pathname === '/api/strategist/chat' && method === 'POST') {
    const body = await parseBody(req);
    const { message = '', websiteUrl = '' } = body;

    const input = websiteUrl ? `${message} ${websiteUrl}`.trim() : message;
    const result = aiService.chatWithAIStrategist(input, businessMemory);

    businessMemory = result.updatedMemory;
    businessMemory.conversationHistory = businessMemory.conversationHistory || [];

    businessMemory.conversationHistory.push({
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    businessMemory.conversationHistory.push({
      sender: 'assistant',
      text: result.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: result.action
    });

    if (businessMemory.conversationHistory.length > 30) {
      businessMemory.conversationHistory = businessMemory.conversationHistory.slice(-30);
    }

    writeJsonFile('business_memory.json', businessMemory);

    return sendJson(res, 200, {
      success: true,
      reply: result.reply,
      memory: businessMemory,
      action: result.action,
      message: 'Memory updated and persisted across sessions.'
    });
  }

  if (pathname === '/api/strategist/memory' && method === 'POST') {
    const updates = await parseBody(req);
    businessMemory = { ...businessMemory, ...updates, updatedAt: new Date().toISOString() };
    writeJsonFile('business_memory.json', businessMemory);
    return sendJson(res, 200, { success: true, memory: businessMemory, message: 'Business memory saved.' });
  }

  if (pathname === '/api/strategist/reset' && method === 'POST') {
    businessMemory = {
      websiteUrl: 'https://omnireach.ai',
      companyName: 'OmniReach AI',
      tagline: 'Autonomous Multi-Channel AI SDR Platform',
      corePositioning: 'OmniReach AI automates multi-channel research, cold emails, LinkedIn touches, and Aircall voice calling to 3x executive meetings.',
      valueProposition: 'Cuts outbound prospecting time by 80% with autonomous AI intelligence.',
      keyProducts: ['Multi-Agent SDR Swarm', 'Aircall Voice CTI Bridge', 'AI Account Deep Enrichment'],
      icps: [],
      brandTone: {
        style: 'Consultative and authoritative',
        pace: 'Direct (<90 words)',
        formality: 'Warm executive',
        powerPhrases: ['decouple quota from headcount', '3.4x more meetings'],
        bannedPhrases: ['hope this email finds you well', 'just checking in']
      },
      preferences: { autoSyncToEmail: true, autoSyncToLinkedIn: true, autoSyncToVoice: true },
      conversationHistory: [
        { sender: 'assistant', text: 'Memory refreshed. Drop your website URL or describe your buyer to start learning!', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ],
      updatedAt: new Date().toISOString()
    };
    writeJsonFile('business_memory.json', businessMemory);
    return sendJson(res, 200, { success: true, memory: businessMemory, message: 'Memory reset to baseline.' });
  }

  if (pathname === '/api/autonomous/run' && method === 'POST') {
    const body = await parseBody(req);
    const targetLeadId = body.leadId;

    let targetLead = targetLeadId ? leads.find(l => l.id === targetLeadId) : leads.find(l => l.status === 'Prospect' || l.status === 'Researched');

    if (!targetLead && leads.length > 0) {
      targetLead = leads[0];
    }

    if (!targetLead) {
      return sendJson(res, 400, { success: false, error: 'No leads available for autonomous run' });
    }

    const steps = [
      {
        agent: 'Prospector & Researcher Agent',
        status: 'completed',
        action: `Enriched ${targetLead.company} profile`,
        result: `Extracted 3 hiring triggers, verified email (${targetLead.email}) & phone (${targetLead.phone}). Fit score: ${targetLead.fitScore}%.`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent: 'Channel Timing & ICP Strategist',
        status: 'completed',
        action: `Optimized multi-touch sequence for ${targetLead.name}`,
        result: `Determined primary channel: Hyper-personalized Email + immediate LinkedIn touchpoint + AI Voice Followup.`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent: 'Psychographic Copywriter Agent',
        status: 'completed',
        action: `Drafted high-converting email & LinkedIn connection note`,
        result: `Hooked on recent triggers. Zero spam trigger words found. Estimated read time: 38s.`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent: 'Autonomous Voice & Dispatch Agent',
        status: 'completed',
        action: `Queued multi-channel delivery schedule`,
        result: `Automated dispatch scheduled within local prospect working hours. Compliance & TCPA verified.`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent: 'Real-Time CRM Sync Agent',
        status: 'completed',
        action: `Updated pipeline stage for ${targetLead.name}`,
        result: `Status transitioned to 'Outreach Active'. Deal value $${targetLead.dealValue.toLocaleString()} reflected in forecast.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ];

    targetLead.status = 'Outreach Active';
    targetLead.channels.email.status = 'sent';
    targetLead.channels.email.sentAt = new Date().toLocaleString();
    targetLead.channels.linkedin.status = 'pending';
    targetLead.timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'research',
      title: 'Autonomous SDR Agent Swarm Executed',
      description: `AI Swarm executed 5-step autonomous cycle: Research -> Strategic Channel Selection -> Copywriting -> Omnichannel Dispatch.`,
      timestamp: new Date().toLocaleString()
    });

    writeJsonFile('leads.json', leads);

    return sendJson(res, 200, {
      success: true,
      lead: targetLead,
      steps,
      message: `Autonomous SDR Swarm successfully executed outreach cycle for ${targetLead.name} (${targetLead.company}).`
    });
  }

  if (pathname === '/api/sequences' && method === 'GET') {
    return sendJson(res, 200, { success: true, sequences });
  }

  if (pathname === '/api/settings' && method === 'GET') {
    return sendJson(res, 200, { success: true, settings });
  }

  if (pathname === '/api/settings' && method === 'POST') {
    const body = await parseBody(req);
    settings = { ...settings, ...body };
    writeJsonFile('settings.json', settings);
    return sendJson(res, 200, { success: true, settings, message: 'Settings saved' });
  }

  if (pathname === '/api/analytics' && method === 'GET') {
    const analytics = calculateAnalytics();
    return sendJson(res, 200, { success: true, analytics });
  }

  if (pathname === '/api/27x/state' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      state: state27x
    });
  }

  if (pathname === '/api/27x/mode/toggle' && method === 'POST') {
    const body = await parseBody(req);
    if (body.mode && (body.mode === 'autopilot' || body.mode === 'copilot')) {
      state27x.mode = body.mode;
    } else {
      state27x.mode = state27x.mode === 'autopilot' ? 'copilot' : 'autopilot';
    }
    writeJsonFile('state_27x.json', state27x);
    return sendJson(res, 200, {
      success: true,
      mode: state27x.mode,
      message: `27x.ai mode switched to ${state27x.mode.toUpperCase()}`,
      state: state27x
    });
  }

  if (pathname === '/api/27x/approve' && method === 'POST') {
    const body = await parseBody(req);
    const { queueId } = body;
    const index = state27x.approvalQueue.findIndex(q => q.id === queueId);

    if (index === -1) {
      return sendJson(res, 404, { success: false, error: 'Approval item not found' });
    }

    const item = state27x.approvalQueue[index];

    if (item.leadId) {
      const lead = leads.find(l => l.id === item.leadId);
      if (lead) {
        if (item.channel === 'email') {
          lead.channels.email.status = 'sent';
          lead.channels.email.sentAt = new Date().toLocaleString();
        } else if (item.channel === 'linkedin') {
          lead.channels.linkedin.status = 'connected';
        } else if (item.channel === 'call') {
          lead.channels.call.status = 'completed';
          lead.channels.call.notes = `Aircall call connected via 27x Speed-to-Lead trigger.`;
        }
        lead.status = 'Outreach Active';
        lead.timeline.unshift({
          id: `t-${Date.now()}`,
          type: item.channel,
          title: `27x Copilot: Approved & Dispatched ${item.channel.toUpperCase()}`,
          description: `Dispatched to ${item.leadName} (${item.company}) following manual review. Confidence: ${item.confidence}%.`,
          timestamp: new Date().toLocaleString()
        });
        writeJsonFile('leads.json', leads);
      }
    }

    state27x.approvalQueue.splice(index, 1);
    writeJsonFile('state_27x.json', state27x);

    return sendJson(res, 200, {
      success: true,
      approvedItem: item,
      remainingCount: state27x.approvalQueue.length,
      state: state27x,
      message: `Action approved and autonomously dispatched to ${item.leadName}!`
    });
  }

  if (pathname === '/api/27x/reject' && method === 'POST') {
    const body = await parseBody(req);
    const { queueId } = body;
    const index = state27x.approvalQueue.findIndex(q => q.id === queueId);

    if (index === -1) {
      return sendJson(res, 404, { success: false, error: 'Queue item not found' });
    }

    const removed = state27x.approvalQueue.splice(index, 1)[0];
    writeJsonFile('state_27x.json', state27x);

    return sendJson(res, 200, {
      success: true,
      removed,
      remainingCount: state27x.approvalQueue.length,
      state: state27x,
      message: `Action dismissed from approval queue.`
    });
  }

  if (pathname === '/api/27x/agent/toggle' && method === 'POST') {
    const body = await parseBody(req);
    const { agentId } = body;
    const agent = state27x.agents.find(a => a.id === agentId);

    if (!agent) {
      return sendJson(res, 404, { success: false, error: 'Agent not found' });
    }

    agent.status = agent.status === 'active' ? 'paused' : 'active';
    writeJsonFile('state_27x.json', state27x);

    return sendJson(res, 200, {
      success: true,
      agent,
      state: state27x,
      message: `Agent ${agent.name} is now ${agent.status.toUpperCase()}`
    });
  }

  if (pathname === '/api/27x/scan-signals' && method === 'POST') {
    state27x.verifiedContactsCount += Math.floor(Math.random() * 320 + 80);

    const freshOpportunities = [
      {
        company: 'QuantumScale Networks',
        prospect: 'Derrick Vance (VP Infrastructure)',
        signal: 'Announced $35M Series B expansion + scaling distributed cloud stack',
        urgency: 'High (Within 48h)',
        channel: 'email',
        confidence: 97
      },
      {
        company: 'HyperFlow Health',
        prospect: 'Dr. Aris Thorne (Chief Medical Officer)',
        signal: 'Hiring 5 Enterprise Sales Engineers to scale AI diagnostics',
        urgency: 'Medium',
        channel: 'linkedin',
        confidence: 94
      },
      {
        company: 'Nexora Autonomous Security',
        prospect: 'Maya Lin (Head of SecOps)',
        signal: 'In-market visitor researching sub-minute incident response',
        urgency: 'Critical Speed-to-Lead',
        channel: 'call',
        confidence: 99
      }
    ];

    const newQueueItem = {
      id: `queue-${Date.now()}`,
      leadName: freshOpportunities[0].prospect,
      company: freshOpportunities[0].company,
      channel: freshOpportunities[0].channel,
      trigger: freshOpportunities[0].signal,
      previewTitle: `Series B Infrastructure Growth Benchmark`,
      previewBody: `Hi Derrick, noticed QuantumScale's recent $35M Series B. We benchmarked that infrastructure teams scaling sales see a 27x pipeline lift when automating pre-call research. Free for a brief look?`,
      status: 'pending',
      confidence: 97,
      createdAgo: 'Just now'
    };

    state27x.approvalQueue.unshift(newQueueItem);
    writeJsonFile('state_27x.json', state27x);

    return sendJson(res, 200, {
      success: true,
      opportunities: freshOpportunities,
      newQueueItem,
      verifiedContactsCount: state27x.verifiedContactsCount,
      state: state27x,
      message: `Signal Radar identified 3 high-intent accounts across 380M+ database.`
    });
  }

  if (pathname === '/api/27x/prospects' && method === 'GET') {
    const search = (query.search || '').toLowerCase().trim();
    const signal = (query.signal || 'all').toLowerCase().trim();
    const industry = (query.industry || 'all').toLowerCase().trim();
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));

    let list = [...prospects27x];

    if (search) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.company.toLowerCase().includes(search) ||
        p.title.toLowerCase().includes(search) ||
        (p.techStack && p.techStack.some(t => t.toLowerCase().includes(search))) ||
        (p.intentSignal && p.intentSignal.title.toLowerCase().includes(search))
      );
    }

    if (signal !== 'all') {
      list = list.filter(p => p.intentSignal && p.intentSignal.type.toLowerCase() === signal);
    }

    if (industry !== 'all') {
      list = list.filter(p => p.industry && p.industry.toLowerCase().includes(industry));
    }

    const totalFiltered = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    const signalStats = {
      funding: prospects27x.filter(p => p.intentSignal && p.intentSignal.type === 'funding').length,
      hiring: prospects27x.filter(p => p.intentSignal && p.intentSignal.type === 'hiring').length,
      tech: prospects27x.filter(p => p.intentSignal && p.intentSignal.type === 'tech').length,
      intent: prospects27x.filter(p => p.intentSignal && p.intentSignal.type === 'intent').length
    };

    return sendJson(res, 200, {
      success: true,
      totalLiveContacts: state27x.verifiedContactsCount || 384520242,
      totalFiltered,
      page,
      totalPages: Math.ceil(totalFiltered / limit) || 1,
      prospects: paginated,
      signalStats
    });
  }

  if (pathname === '/api/27x/generate-outreach' && method === 'POST') {
    const body = await parseBody(req);
    const { prospectId, prospectData, channel = 'email', customNote, tone = 'consultative' } = body;

    const prospect = prospectData || prospects27x.find(p => p.id === prospectId) || prospects27x[0];
    if (!prospect) {
      return sendJson(res, 404, { success: false, error: 'Prospect not found' });
    }

    const firstName = (prospect.name || '').split(' ')[0] || 'there';
    const company = prospect.company || 'your team';
    const signalTitle = prospect.intentSignal ? prospect.intentSignal.title : 'recent growth';
    const signalDesc = prospect.intentSignal ? prospect.intentSignal.description : '';
    const signalType = prospect.intentSignal ? prospect.intentSignal.type : 'growth';

    let result = {};

    if (channel === 'email') {
      const subjects = [
        `${company} + 27x: ${signalTitle}`,
        `Quick thought regarding ${company}'s ${signalTitle}`,
        `${firstName} - benchmark for ${company}'s sales pipeline`
      ];

      let hook = '';
      if (signalType === 'funding') {
        hook = `Congratulations on ${company}'s ${signalTitle}! As you scale out GTM headcount and expand across new markets, outbound research often becomes the biggest bottleneck.`;
      } else if (signalType === 'hiring') {
        hook = `Saw your active search for sales and engineering roles at ${company}. Scaling teams usually spend 15+ hours per rep each week manually searching and verifying contact data.`;
      } else if (signalType === 'tech') {
        hook = `Noticed ${company} recently adopted modern tooling (${prospect.techStack ? prospect.techStack.slice(0, 3).join(', ') : 'modern tech stack'}). We built a live integration architecture that fits seamlessly into your stack.`;
      } else {
        hook = `Noticed high intent activity from ${company} exploring pipeline automation and speed-to-lead execution.`;
      }

      if (customNote) {
        hook += ` Note: ${customNote}`;
      }

      const bodyText = `Hi ${firstName},

${hook}

We benchmarked how autonomous AI SDRs eliminate manual list building by connecting directly to 380M+ live verified contacts. Teams in your space typically see a 27.4x increase in qualified outbound pipeline with sub-3-minute speed-to-lead response.

Do you have 8 minutes this Thursday or Friday morning for a brief look?

Best regards,
Alex Carter
27x.ai Autonomous Sales Platform`;

      result = {
        channel: 'email',
        subject: subjects[0],
        subjectAlternatives: subjects,
        body: bodyText,
        hook,
        confidence: prospect.confidence || 96,
        deliverabilityScore: (prospect.verification && prospect.verification.deliverabilityScore) || 99.4
      };
    } else if (channel === 'linkedin') {
      const connectionNote = `${firstName}, noticed ${company}'s ${signalTitle}. We help revenue leaders eliminate manual cold research using autonomous 380M+ contact intelligence. Would love to stay connected.`;
      const inMailBody = `Hi ${firstName},

Saw your recent milestone at ${company} (${signalTitle}). As your team expands, manual prospecting and stale data lists usually drain 15 hrs per rep each week.

We built an autonomous AI SDR with a continuously refreshed data engine that drives a 27.4x pipeline lift.

Worth a brief 5-minute glance this week?`;

      result = {
        channel: 'linkedin',
        connectionNote,
        inMailBody,
        charCount: connectionNote.length,
        confidence: prospect.confidence || 95
      };
    } else if (channel === 'call') {
      const opener = `Hi ${firstName}, this is Alex with 27x.ai. Caught you out of the blue, but saw ${company}'s ${signalTitle} and wanted to share a 30-second benchmark. Do you have a brief moment?`;
      const hookPitch = `We noticed you're scaling in ${prospect.industry || 'your sector'}. Unlike traditional cold calling with 3% pickup rates, our speed-to-lead engine reaches out within 3 minutes of high-intent buying signals, delivering a 27x pipeline boost.`;
      const objections = {
        timing: `Completely understand you're heads-down. I can shoot over our 1-page benchmark so you can review it async. What's the best email?`,
        competitor: `Makes total sense. Most teams keep their existing CRM like Salesforce or HubSpot—we act as the autonomous intelligence layer that triggers the outreach automatically.`,
        noBudget: `Understood. We actually replace 3-4 separate data and dialing subscriptions, reducing overall software cost while doubling qualified meetings.`
      };

      result = {
        channel: 'call',
        opener,
        hookPitch,
        objections,
        confidence: 97
      };
    }

    return sendJson(res, 200, {
      success: true,
      outreach: result,
      prospect: {
        id: prospect.id,
        name: prospect.name,
        company: prospect.company,
        title: prospect.title,
        email: prospect.email,
        phone: prospect.phone
      }
    });
  }

  if (pathname === '/api/27x/campaign/launch' && method === 'POST') {
    const body = await parseBody(req);
    const {
      prospectIds = [],
      prospectData = null,
      mode = state27x.mode || 'autopilot',
      channels = ['email', 'linkedin'],
      customizedCopy = null
    } = body;

    const targets = [];
    if (prospectData) {
      targets.push(prospectData);
    } else if (prospectIds.length > 0) {
      prospectIds.forEach(id => {
        const found = prospects27x.find(p => p.id === id);
        if (found) targets.push(found);
      });
    }

    if (targets.length === 0) {
      targets.push(prospects27x[0]);
    }

    const createdItems = [];

    targets.forEach(prospect => {
      channels.forEach(ch => {
        const queueItem = {
          id: `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          leadId: prospect.id,
          leadName: prospect.name,
          company: prospect.company,
          channel: ch,
          trigger: prospect.intentSignal ? prospect.intentSignal.title : 'Market Intent Signal',
          previewTitle: customizedCopy?.subject || `Tailored 1:1 Outreach (${prospect.company})`,
          previewBody: customizedCopy?.body || prospect.suggestedHook || `Hi ${prospect.name.split(' ')[0]}, saw ${prospect.company}'s recent milestone. We benchmarked a 27x pipeline lift when automating research. Quick 10 mins this week?`,
          status: mode === 'copilot' ? 'pending' : 'dispatched',
          confidence: prospect.confidence || 96,
          createdAgo: 'Just now'
        };

        if (mode === 'copilot') {
          state27x.approvalQueue.unshift(queueItem);
          createdItems.push(queueItem);
        } else {

          createdItems.push(queueItem);

          let existingLead = leads.find(l => l.email === prospect.email || l.name === prospect.name);
          if (!existingLead) {
            existingLead = {
              id: `lead-27x-${Date.now()}`,
              name: prospect.name,
              title: prospect.title,
              company: prospect.company,
              email: prospect.email,
              phone: prospect.phone,
              industry: prospect.industry,
              revenue: prospect.revenue,
              location: prospect.location,
              status: 'Outreach Active',
              score: 95,
              channels: {
                email: { status: ch === 'email' ? 'sent' : 'ready', sentAt: new Date().toLocaleString() },
                linkedin: { status: ch === 'linkedin' ? 'connected' : 'ready' },
                call: { status: ch === 'call' ? 'completed' : 'ready' }
              },
              timeline: []
            };
            leads.unshift(existingLead);
          } else {
            existingLead.status = 'Outreach Active';
            if (existingLead.channels[ch]) existingLead.channels[ch].status = 'sent';
          }

          existingLead.timeline.unshift({
            id: `t-${Date.now()}`,
            type: ch,
            title: `27x Autopilot: Dispatched ${ch.toUpperCase()} Touch`,
            description: `Sent personalized 1:1 message based on ${prospect.intentSignal?.title || 'Live Intent Signal'}. Confidence: ${prospect.confidence || 96}%.`,
            timestamp: new Date().toLocaleString()
          });
        }
      });
    });

    writeJsonFile('state_27x.json', state27x);
    if (mode === 'autopilot') {
      writeJsonFile('leads.json', leads);
    }

    return sendJson(res, 200, {
      success: true,
      mode,
      processedCount: createdItems.length,
      items: createdItems,
      message: mode === 'copilot'
        ? `${createdItems.length} outreach drafts added to Copilot Review Queue for 1-click human approval.`
        : `${createdItems.length} touches autonomously dispatched across Email, LinkedIn, and Phone.`
    });
  }

  if (pathname === '/api/27x/telemetry' && method === 'GET') {
    const telemetryEvents = [
      `[Live Data Engine] Verified 384,520,242 B2B contacts across global registers.`,
      `[Deliverability Guard] Zero bounce rate confirmed: 100% SPF/DKIM/DMARC healthy.`,
      `[Signal Radar] Identified 4 new Series B and hiring surge triggers this hour.`,
      `[AI SDR Engine] Claude 3.5 Sonnet generated 12 hyper-tailored 1:1 drafts.`,
      `[Speed-to-Lead] In-market click logged for DataVanguard. Outbound dial ready (<3 mins).`,
      `[Meeting Scheduler] Confirmed Google Meet invitation for Alex Morgan (4m booking latency).`
    ];

    return sendJson(res, 200, {
      success: true,
      pipelineMultiplier: 27.4,
      verifiedContactsCount: state27x.verifiedContactsCount || 384520242,
      hoursSavedPerRep: 15.2,
      deliverabilityScore: '99.4%',
      speedToLeadWindow: '< 3 mins',
      activeAgentsCount: (state27x.agents || []).filter(a => a.status === 'active').length,
      approvalQueueCount: (state27x.approvalQueue || []).length,
      mode: state27x.mode || 'autopilot',
      recentEvents: telemetryEvents
    });
  }

  if (pathname === '/api/27x/intent-signals/trigger' && method === 'POST') {
    const body = await parseBody(req);
    const signalType = body.type || 'funding';
    const company = body.company || 'NovaCompute AI';
    const title = body.title || `${company} announced $28M Series B expansion`;
    const description = body.description || `Scaling infrastructure and hiring 12 sales engineers`;

    const newSignal = {
      id: `sig-${Date.now()}`,
      type: signalType,
      title,
      company,
      date: 'Just now',
      impact: 'High Growth Opportunity'
    };

    if (!state27x.intentSignals) state27x.intentSignals = [];
    state27x.intentSignals.unshift(newSignal);

    const newProspect = {
      id: `27x-p-${Date.now()}`,
      name: body.prospectName || 'Jordan Hayes',
      title: body.prospectTitle || 'VP of Revenue',
      company,
      industry: body.industry || 'Enterprise Cloud & AI',
      revenue: '$25M ARR',
      headcount: '190 employees',
      location: 'San Francisco, CA',
      phone: '+1 (415) 880-9912',
      email: `jordan@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
      linkedin: 'https://linkedin.com/in/jordanhayes-rev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verification: {
        status: 'verified',
        catchAllSafe: true,
        deliverabilityScore: 99.8,
        spfDkimVerified: true,
        lastChecked: 'Just now'
      },
      techStack: ['AWS', 'Kubernetes', 'Snowflake', 'HubSpot'],
      intentSignal: newSignal,
      confidence: 98,
      suggestedHook: `Saw ${company}'s milestone: "${title}". Autonomous SDRs eliminate 15 hrs/rep/week while driving 27x pipeline lift.`,
      status: 'new'
    };

    prospects27x.unshift(newProspect);
    writeJsonFile('prospects_27x.json', prospects27x);
    writeJsonFile('state_27x.json', state27x);

    return sendJson(res, 200, {
      success: true,
      signal: newSignal,
      prospect: newProspect,
      message: `Live Intent Signal mapped to 380M+ Live Data Engine.`
    });
  }

  if (pathname === '/api/voicetype/config' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      config: voiceTypeConfig,
      stats: calcVoiceTypeStats()
    });
  }

  if (pathname === '/api/voicetype/config' && method === 'POST') {
    const body = await parseBody(req);
    Object.assign(voiceTypeConfig, body);
    writeJsonFile('voicetype_config.json', voiceTypeConfig);
    return sendJson(res, 200, {
      success: true,
      config: voiceTypeConfig,
      stats: calcVoiceTypeStats(),
      message: 'VoiceType configuration successfully updated.'
    });
  }

  if (pathname === '/api/voicetype/history' && method === 'GET') {
    const search = (query.search || '').toLowerCase().trim();
    const limit = parseInt(query.limit, 10) || 100;
    let list = [...voiceTypeHistory];
    if (search) {
      list = list.filter(item =>
        (item.final_text && item.final_text.toLowerCase().includes(search)) ||
        (item.raw_text && item.raw_text.toLowerCase().includes(search)) ||
        (item.app_window && item.app_window.toLowerCase().includes(search))
      );
    }
    return sendJson(res, 200, {
      success: true,
      history: list.slice(0, limit),
      totalCount: voiceTypeHistory.length,
      stats: calcVoiceTypeStats()
    });
  }

  if (pathname === '/api/voicetype/history/clear' && method === 'POST') {
    voiceTypeHistory = [];
    writeJsonFile('voicetype_history.json', voiceTypeHistory);
    return sendJson(res, 200, {
      success: true,
      history: [],
      stats: calcVoiceTypeStats(),
      message: 'VoiceType dictation history cleared.'
    });
  }

  if (pathname.startsWith('/api/voicetype/history/') && method === 'DELETE') {
    const id = pathname.replace('/api/voicetype/history/', '').trim();
    voiceTypeHistory = voiceTypeHistory.filter(h => String(h.id) !== id);
    writeJsonFile('voicetype_history.json', voiceTypeHistory);
    return sendJson(res, 200, {
      success: true,
      deletedId: id,
      stats: calcVoiceTypeStats(),
      message: `History entry ${id} removed.`
    });
  }

  if (pathname === '/api/voicetype/transcribe' && method === 'POST') {
    const body = await parseBody(req);
    const rawText = body.raw_text || body.text || '';
    const duration = parseFloat(body.duration_sec) || (Math.max(1.2, (rawText.split(/\s+/).length * 0.35)));
    const targetApp = body.app_window || 'OmniReach Active Caret';
    const lang = body.language || voiceTypeConfig.language || 'en';

    const t0 = Date.now();
    const cleanedText = cleanVoiceTypeText(rawText, voiceTypeConfig);
    const latency = Math.round((Date.now() - t0 + Math.random() * 200 + 150)) / 1000;
    const numWords = cleanedText.trim() ? cleanedText.trim().split(/\s+/).filter(Boolean).length : 0;

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString().slice(0, 19),
      raw_text: rawText,
      final_text: cleanedText,
      language: lang,
      duration_sec: Math.round(duration * 10) / 10,
      latency_sec: latency,
      num_words: numWords,
      app_window: targetApp
    };

    if (cleanedText.trim()) {
      voiceTypeHistory.unshift(newEntry);

      if (voiceTypeHistory.length > 200) {
        voiceTypeHistory = voiceTypeHistory.slice(0, 200);
      }
      writeJsonFile('voicetype_history.json', voiceTypeHistory);
    }

    return sendJson(res, 200, {
      success: true,
      cleaned_text: cleanedText,
      entry: newEntry,
      stats: calcVoiceTypeStats(),
      message: 'Dictation transcribed & cleaned via VoiceType pipeline.'
    });
  }

  if (pathname === '/api/voicetype/vocabulary/add' && method === 'POST') {
    const body = await parseBody(req);
    const word = (body.word || '').trim();
    if (word && !voiceTypeConfig.vocabulary.includes(word)) {
      voiceTypeConfig.vocabulary.push(word);
      writeJsonFile('voicetype_config.json', voiceTypeConfig);
    }
    return sendJson(res, 200, {
      success: true,
      vocabulary: voiceTypeConfig.vocabulary
    });
  }

  if (pathname === '/api/voicetype/vocabulary/remove' && method === 'POST') {
    const body = await parseBody(req);
    const word = (body.word || '').trim();
    voiceTypeConfig.vocabulary = voiceTypeConfig.vocabulary.filter(w => w !== word);
    writeJsonFile('voicetype_config.json', voiceTypeConfig);
    return sendJson(res, 200, {
      success: true,
      vocabulary: voiceTypeConfig.vocabulary
    });
  }

  if (pathname === '/api/voicetype/replacements/add' && method === 'POST') {
    const body = await parseBody(req);
    const spoken = (body.spoken || '').trim().toLowerCase();
    const written = body.written !== undefined ? String(body.written) : '';
    if (spoken && written) {
      if (!voiceTypeConfig.replacements) voiceTypeConfig.replacements = {};
      voiceTypeConfig.replacements[spoken] = written;
      writeJsonFile('voicetype_config.json', voiceTypeConfig);
    }
    return sendJson(res, 200, {
      success: true,
      replacements: voiceTypeConfig.replacements
    });
  }

  if (pathname === '/api/voicetype/replacements/remove' && method === 'POST') {
    const body = await parseBody(req);
    const spoken = (body.spoken || '').trim().toLowerCase();
    if (voiceTypeConfig.replacements && voiceTypeConfig.replacements[spoken]) {
      delete voiceTypeConfig.replacements[spoken];
      writeJsonFile('voicetype_config.json', voiceTypeConfig);
    }
    return sendJson(res, 200, {
      success: true,
      replacements: voiceTypeConfig.replacements
    });
  }

  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {

        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (spaErr, spaContent) => {
          if (spaErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found - OmniReach AI');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(spaContent);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 OmniReach AI - Autonomous CRM & Outreach Platform`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/leads`);
  console.log(`=======================================================`);
});
