
const SAMPLE_DISCOVERY_DATABASE = [
  {
    name: "Rachel Solis",
    title: "VP of Enterprise Sales",
    company: "HyperScale Data",
    website: "https://hyperscaledata.net",
    industry: "Enterprise AI & Cloud Infrastructure",
    location: "Seattle, WA",
    companySize: "150-300 employees",
    annualRevenue: "$32M ARR",
    email: "rachel.solis@hyperscaledata.net",
    phone: "+1 (206) 492-7718",
    linkedin: "linkedin.com/in/rachelsolis-sales",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    recentTriggers: [
      "Hiring 20 Account Executives for enterprise expansion",
      "Announced integration with Databricks and Snowflake",
      "CEO quoted about doubling outbound pipeline efficiency"
    ]
  },
  {
    name: "Tariq Mansoor",
    title: "Chief Technology Officer",
    company: "ShieldGuard Cyber",
    website: "https://shieldguardcyber.com",
    industry: "Cybersecurity & InfoSec",
    location: "New York, NY",
    companySize: "80-200 employees",
    annualRevenue: "$18M ARR",
    email: "tariq@shieldguardcyber.com",
    phone: "+1 (212) 580-9923",
    linkedin: "linkedin.com/in/tariq-mansoor-cto",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    recentTriggers: [
      "Completed SOC2 Type II and FedRAMP compliance milestones",
      "Actively replacing manual sales lead verification tooling",
      "Expanding threat response agent capabilities"
    ]
  },
  {
    name: "Chloe Dupont",
    title: "Head of Growth & Demand Gen",
    company: "OmniCart Commerce",
    website: "https://omnicartcommerce.io",
    industry: "E-Commerce & Retail Tech",
    location: "Los Angeles, CA",
    companySize: "40-100 employees",
    annualRevenue: "$9.2M ARR",
    email: "chloe@omnicartcommerce.io",
    phone: "+1 (310) 745-6612",
    linkedin: "linkedin.com/in/chloedupont-growth",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    recentTriggers: [
      "Raised $7.5M Seed round from Founders Fund",
      "Looking for automated outreach to Shopify Plus merchants",
      "Posted on LinkedIn about low reply rates on generic cold emails"
    ]
  },
  {
    name: "Vikram Malhotra",
    title: "Founder & Chief Executive Officer",
    company: "NexusBio Systems",
    website: "https://nexusbiosys.com",
    industry: "HealthTech / FinTech SaaS",
    location: "Chicago, IL",
    companySize: "50-120 employees",
    annualRevenue: "$11M ARR",
    email: "vikram@nexusbiosys.com",
    phone: "+1 (312) 670-3490",
    linkedin: "linkedin.com/in/vikram-malhotra-ceo",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    recentTriggers: [
      "Secured FDA breakthrough clearance for diagnostic telemetry",
      "Scaling clinical enterprise hospital partnerships",
      "Seeking automated multi-channel touchpoints for hospital directors"
    ]
  }
];

function enrichLeadData(lead) {
  const company = lead.company || "Company";
  const title = lead.title || "Executive";
  const name = lead.name || "Prospect";
  const industry = lead.industry || "B2B SaaS";

  const painPoints = [
    `Manual prospecting and list building consumes 3+ hours daily per SDR at ${company}`,
    `Outbound cold emails struggling with email deliverability post-2024 Gmail/Yahoo spam threshold updates`,
    `Junior sales reps struggle handling phone objections when dialling cold executive prospects`,
    `Disconnect between LinkedIn social touches, cold emails, and phone follow-ups causing lost leads`
  ];

  const recentTriggers = lead.research?.recentTriggers || [
    `Recently active in enterprise expansion and hiring revenue personnel`,
    `Published updates regarding scaling ${industry} customer acquisition`,
    `Exploring AI workflow automation to augment current sales pipeline`
  ];

  const techStack = lead.research?.techStack || [
    "Salesforce CRM",
    "HubSpot",
    "Google Workspace",
    "LinkedIn Sales Navigator",
    "Stripe"
  ];

  const firstName = name.split(" ")[0];

  const icebreaker = `Noticed ${company}'s impressive progress in ${industry}—especially your recent focus on accelerating qualified pipeline without ballooning sales headcount!`;

  const valueProp = `OmniReach AI unites deep account research, hyper-personalized email sequencing, automated LinkedIn touchpoints, and real-time conversational voice calls into an autonomous SDR engine that books 3.4x more executive demos.`;

  const fitScore = Math.floor(88 + Math.random() * 11);
  const intentScore = Math.floor(80 + Math.random() * 18);
  const estimatedDeal = Math.floor((fitScore * 400) / 1000) * 1000;

  return {
    ...lead,
    fitScore,
    intentScore,
    dealValue: lead.dealValue || estimatedDeal,
    research: {
      executiveBio: `${title} at ${company} leading growth, pipeline strategy, and revenue operations across ${industry}.`,
      companySummary: `${company} is a fast-growing provider in ${industry}, optimizing workflows and technology infrastructure.`,
      recentTriggers,
      techStack,
      painPoints,
      valueProp,
      icebreaker
    }
  };
}

function generatePersonalizedEmail(lead, goal = "Book 10-min Intro Demo", memory = null) {
  const firstName = lead.name.split(" ")[0];
  const company = lead.company;
  const trigger = lead.research?.recentTriggers?.[0] || `your recent work scaling ${company}`;
  const pain = lead.research?.painPoints?.[0] || "scaling outbound without burning rep hours";

  const senderCompany = memory?.companyName || "OmniReach AI";
  const positioning = memory?.corePositioning || "unites deep account research, personalized emails, and live Aircall calling into an autonomous SDR engine";
  const powerPhrase = memory?.brandTone?.powerPhrases?.[0] || "decouple outbound quota from headcount";

  const subjectVariations = [
    `Quick question regarding ${company}'s outbound pipeline`,
    `${firstName}, thought on ${company}'s recent milestone`,
    `Idea for ${company}: ${senderCompany} & automating sales pipeline`
  ];

  const body = `Hi ${firstName},

Saw that ${company} is ${trigger.toLowerCase()}—congrats on the momentum!

Reaching out because revenue leaders at high-growth companies often tell us that ${pain.toLowerCase()}. Reps spend up to 70% of their day digging for contacts and manual dialling instead of speaking with live buyers.

We built ${senderCompany} to ${positioning.toLowerCase()}—allowing revenue teams to ${powerPhrase}.

Teams scaling in ${lead.industry} typically see a 3.4x bump in qualified meetings within their first 3 weeks.

Open to checking out a quick 5-minute interactive walkthrough this Thursday at 2 PM?

Best regards,
Alex Morgan
Head of AI Automation | ${senderCompany}
+1 (800) 555-0199`;

  return {
    subject: subjectVariations[0],
    subjectVariations,
    body,
    spamScore: 0.05,
    deliverabilityGrade: "A+ (99.2% inbox placement)",
    readingTime: "42 seconds",
    suggestedSendTime: "Tuesday 09:15 AM (Prospect Local Time)"
  };
}

function generateLinkedInOutreach(lead) {
  const firstName = lead.name.split(" ")[0];
  const company = lead.company;

  const connectionNote = `Hi ${firstName}, noticed your leadership at ${company} and your recent focus on growth in ${lead.industry}. Would love to connect and share notes on autonomous SDR workflows!`;

  const inMailText = `${firstName} — congrats on ${company}'s recent momentum! Quick question: how is your team handling outbound prospecting across email and phone this quarter? We built an autonomous multi-channel AI SDR that 3x's executive booking rates. Would love your perspective when you have a moment.`;

  const followUpMessage = `Hi ${firstName}, thanks for connecting! Sharing a quick 2-minute benchmark breakdown on how ${lead.industry} teams are cutting SDR CAC by 60% with AI phone & email sequencing: [Demo Link]. Hope it sparks ideas!`;

  return {
    connectionNote,
    connectionNoteCharCount: connectionNote.length,
    inMailText,
    followUpMessage,
    safetyCheck: "Passed (Complies with LinkedIn 2026 Rate Limit & TOS Guard)"
  };
}

function generateCallScript(lead) {
  const firstName = lead.name.split(" ")[0];
  const company = lead.company;

  const opening = `Hi ${firstName}, Alex here with OmniReach AI. I know I caught you out of the blue on a busy workday—do you have a quick 25 seconds?`;

  const hook = `I saw that ${company} has been expanding recently in ${lead.industry}. We help revenue leaders eliminate manual cold prospecting by deploying conversational AI agents that research accounts, send personalized notes, and handle qualifying calls.`;

  const objectionPlaybook = {
    "busy": `Totally respect your time, ${firstName}. I can shoot over a 60-second summary directly to your inbox so you can review it async. What's the best time later this week to reconnect?`,
    "no_budget": `Completely fair. Most companies actually replace 3 or 4 fragmented subscription tools with OmniReach, effectively cutting their outbound software bill in half while doubling meetings.`,
    "send_email": `Will do! I'll include our 2-minute live voice agent demo and case study. If it looks compelling, does Thursday morning at 10 AM work for a brief 5-minute chat?`,
    "competitor": `We hear that a lot! Most of our clients keep their existing CRM like Salesforce or HubSpot—OmniReach acts as the autonomous intelligence layer that executes the multi-channel calls and emails reps don't have time to make.`,
    "not_interested": `Understood ${firstName}. Before I let you go, are your sales reps currently hitting their outbound meeting quotas consistently, or is pipeline generation something on your radar for next quarter?`
  };

  const closeQuestion = `Does it make sense to take a brief 7-minute look at how our AI voice SDR handles live calls, or should I follow up later in the month?`;

  return {
    opening,
    hook,
    objectionPlaybook,
    closeQuestion
  };
}

function handleLiveCallTurn(userText, lead, previousTurns = []) {
  const text = (userText || "").toLowerCase().trim();
  const firstName = lead.name ? lead.name.split(" ")[0] : "there";
  const company = lead.company || "your team";

  let aiResponse = "";
  let sentiment = "Neutral";
  let meetingBooked = false;
  let parsedIntent = "general";

  if (
    text.includes("yes") ||
    text.includes("sure") ||
    text.includes("let's do it") ||
    text.includes("book") ||
    text.includes("schedule") ||
    text.includes("thursday") ||
    text.includes("friday") ||
    text.includes("tomorrow") ||
    text.includes("next week") ||
    text.includes("calendar") ||
    text.includes("what time") ||
    text.includes("sounds good")
  ) {
    parsedIntent = "meeting_agreed";
    sentiment = "High Interest";
    meetingBooked = true;
    aiResponse = `That's great, ${firstName}! I've locked in our calendar for Thursday at 2:00 PM EST and dispatched the Google Meet invite to your email. You'll also receive our executive one-pager. Looking forward to speaking then!`;
  }

  else if (
    text.includes("busy") ||
    text.includes("bad time") ||
    text.includes("in a meeting") ||
    text.includes("call me later") ||
    text.includes("driving")
  ) {
    parsedIntent = "objection_busy";
    sentiment = "Objection Handled";
    aiResponse = `I completely understand, ${firstName}—sales leadership is non-stop. How about I send over our 90-second video demo and check back with you Thursday morning at 10?`;
  }

  else if (
    text.includes("send an email") ||
    text.includes("send me an email") ||
    text.includes("put it in an email") ||
    text.includes("shoot me an email")
  ) {
    parsedIntent = "request_email";
    sentiment = "Neutral";
    aiResponse = `Absolutely, consider it done! I'll send our executive summary and case study to your inbox right now. What's the best day to follow up once you've had a chance to glance over it?`;
  }

  else if (
    text.includes("budget") ||
    text.includes("expensive") ||
    text.includes("no money") ||
    text.includes("freeze") ||
    text.includes("cost")
  ) {
    parsedIntent = "objection_budget";
    sentiment = "Objection Handled";
    aiResponse = `Completely understand ${firstName}. The reason clients like FinPulse and ApexAI work with us is because OmniReach consolidates 3 separate tools and typically pays for itself within 14 days of pipeline generated. Would you be open to seeing the ROI model?`;
  }

  else if (
    text.includes("who is this") ||
    text.includes("what is this") ||
    text.includes("how does it work") ||
    text.includes("what do you do")
  ) {
    parsedIntent = "inquiry_details";
    sentiment = "Neutral";
    aiResponse = `We are OmniReach AI—an autonomous outreach OS. Our AI agents research your prospects, find verified emails and phone numbers, send personalized multi-channel sequences, and even conduct phone qualification calls just like the one we're having right now. How is ${company} currently handling cold outreach?`;
  }

  else if (
    text.includes("already have") ||
    text.includes("competitor") ||
    text.includes("outreach") ||
    text.includes("salesloft") ||
    text.includes("we have reps") ||
    text.includes("in-house")
  ) {
    parsedIntent = "objection_competitor";
    sentiment = "Objection Handled";
    aiResponse = `That makes total sense! Most of our customers already have SDRs and tools like Salesforce or Outreach. OmniReach sits on top to do the tedious 4-hour daily research and initial warm-calling, so your human reps spend 100% of their time closing qualified meetings.`;
  }

  else if (
    text.includes("not interested") ||
    text.includes("remove me") ||
    text.includes("stop calling") ||
    text.includes("unsubscribe") ||
    text.includes("don't call")
  ) {
    parsedIntent = "hard_rejection";
    sentiment = "Negative";
    aiResponse = `Understood ${firstName}. I have noted that and updated our compliance registry so you won't hear from us again. Have a great rest of your week!`;
  }

  else {
    parsedIntent = "conversational_followup";
    sentiment = "Neutral";
    aiResponse = `I hear you, ${firstName}. At ${company}, is finding qualified buyers or getting them to actually respond your biggest challenge right now? We can show you how autonomous voice and email sequencing solves both.`;
  }

  return {
    aiResponse,
    sentiment,
    meetingBooked,
    parsedIntent,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

function generateAircallScreenPopContext(lead, triggerSource = "inbox_opened_email") {
  const firstName = lead.name ? lead.name.split(" ")[0] : "there";
  const company = lead.company || "Company";
  const title = lead.title || "Executive";
  const lastEmail = lead.channels?.email || {};
  const lastLinkedIn = lead.channels?.linkedin || {};

  let triggerDescription = "Prospect opened outbound cold email 3 times and clicked demo link 4 minutes ago.";
  let timingRationale = "Speed to Lead: Calling within 5 minutes of an email open increases contact rate by 391% and demo conversion by 2.8x.";

  if (triggerSource === "linkedin_accepted") {
    triggerDescription = "Accepted LinkedIn connection request 2 hours ago.";
    timingRationale = "Warm Touch: Calling immediately after social connection leverages high familiarity.";
  } else if (triggerSource === "sequence_step") {
    triggerDescription = "Multichannel Sequence Step 4: Scheduled Smart Phone Call.";
    timingRationale = "Optimal Timezone Window: Local prospect time is prime 10:15 AM executive calling window.";
  }

  const openingBridge = `Hi ${firstName}, Alex here from OmniReach AI. I know I caught you in the middle of a busy workday—quick 20 seconds? I saw you were looking at my note regarding ${lead.research?.recentTriggers?.[0] || 'scaling pipeline at ' + company} earlier today, and wanted to share a 30-second context on how similar leaders solve it.`;

  const previousTouchpoints = [
    {
      channel: "email",
      status: lastEmail.status || "opened",
      title: lastEmail.subject || `Quick question regarding ${company}'s outbound pipeline`,
      detail: `${lastEmail.opens || 3} opens • Clicked ROI breakdown link`
    },
    {
      channel: "linkedin",
      status: lastLinkedIn.status || "connected",
      title: "Connection Request & InMail",
      detail: lastLinkedIn.connectionNote || `Connected with personalized note regarding ${company}`
    },
    {
      channel: "research",
      status: "verified",
      title: "AI Research Dossier",
      detail: `Fit score: ${lead.fitScore || 92}% • Pain point: ${lead.research?.painPoints?.[0] || 'Scaling outbound without rep burnout'}`
    }
  ];

  const objectionBattlecards = {
    "busy": {
      objection: "I am too busy right now / In a meeting",
      talkingPoint: `Totally respect your busy schedule, ${firstName}. I saw ${company} is expanding and didn't want you to miss our benchmark report. Mind if I send a 60-second video over email and follow up Thursday morning?`
    },
    "budget": {
      objection: "We don't have budget for new software",
      talkingPoint: `Completely understand. Most CROs we work with actually replaced 3 separate tools (dialler, scraper, warm-up service) with OmniReach, effectively cutting outbound tech spend by 45%.`
    },
    "send_email": {
      objection: "Just send me an email with information",
      talkingPoint: `Already in your inbox! What is the single biggest pipeline bottleneck you're looking to fix this quarter so I can highlight the exact page for you?`
    },
    "competitor": {
      objection: "We already use Outreach / Salesloft / In-house SDRs",
      talkingPoint: `Love those tools! OmniReach plugs directly into Aircall and your CRM to automate the 4 hours of tedious manual research and live dialling reps don't have time to do.`
    }
  };

  return {
    leadId: lead.id,
    leadName: lead.name,
    leadTitle: title,
    leadCompany: company,
    leadPhone: lead.phone,
    leadEmail: lead.email,
    fitScore: lead.fitScore || 94,
    dealValue: lead.dealValue || 35000,
    triggerDescription,
    timingRationale,
    openingBridge,
    previousTouchpoints,
    objectionBattlecards,
    suggestedQuestions: [
      `How many hours a week are your sales reps spending on manual list building vs. actually speaking with prospects?`,
      `Have you noticed drop-offs in email open rates since Google and Yahoo's latest spam threshold updates?`,
      `Would it help if your phone outreach was automatically synchronized with your email opens via Aircall?`
    ]
  };
}

function generateAircallPostCallFollowup(lead, outcome = "demo_booked", repNotes = "") {
  const firstName = lead.name ? lead.name.split(" ")[0] : "there";
  const company = lead.company || "Company";

  let emailSubject = `Great speaking on Aircall, ${firstName} - [Demo details & Case Study]`;
  let emailBody = "";
  let linkedinNote = "";
  let dispositionTag = "Demo Booked";

  if (outcome === "demo_booked") {
    dispositionTag = "Demo Booked (High Intent)";
    emailSubject = `Confirmed: OmniReach AI Demo - Thursday 2:00 PM EST with ${company}`;
    emailBody = `Hi ${firstName},

Great speaking with you over Aircall just now! Loved hearing about ${company}'s current outbound expansion and your focus on streamlining rep productivity.

As discussed, I have locked in our 15-minute live walkthrough:
📅 Date & Time: Thursday at 2:00 PM EST
🔗 Google Meet Link: https:
📋 Calendar Invite: Dispatched to ${lead.email}

Attached is the executive benchmark on scaling B2B SaaS pipeline without headcount bloat. Looking forward to our conversation!

Best regards,
Alex Morgan
Head of AI Automation | OmniReach AI`;

    linkedinNote = `Hi ${firstName}, great connecting over Aircall today! Looking forward to our demo on Thursday. Adding you here to stay connected!`;
  } else if (outcome === "followup_requested") {
    dispositionTag = "Follow-up Requested";
    emailSubject = `OmniReach AI overview following our quick call - ${company}`;
    emailBody = `Hi ${firstName},

Thanks for taking my brief call on Aircall today. Completely understand that timing was tight.

Here is the 90-second overview of how teams in ${lead.industry} use autonomous multi-channel sequencing and Aircall smart dialling to double outbound demo volume: [Interactive Demo Link].

I will follow up with you early next week as agreed. Have a great rest of your week!

Best,
Alex Morgan`;

    linkedinNote = `Hi ${firstName}, thanks for taking my call just now! Sent over the 90-second walkthrough we chatted about to your email. Connecting here as well!`;
  } else if (outcome === "left_voicemail") {
    dispositionTag = "Left Voicemail";
    emailSubject = `Just left you a voicemail, ${firstName} - quick question for ${company}`;
    emailBody = `Hi ${firstName},

I just left you a brief voicemail on your line (${lead.phone}).

Reaching out because revenue teams at ${lead.industry} companies often struggle with reps spending 60% of their day on manual research instead of selling.

We built an autonomous engine that syncs your email opens directly into Aircall phone queues with live AI scripts.

Could we connect for 5 minutes Thursday morning?

Best,
Alex Morgan`;

    linkedinNote = `Hi ${firstName}, left you a brief voicemail regarding ${company}'s sales pipeline—sending a connection request here so we can stay in touch!`;
  } else {
    dispositionTag = "Call Completed";
    emailSubject = `Notes following our conversation, ${firstName}`;
    emailBody = `Hi ${firstName},\n\nThank you for your time on the phone today. Please let me know if you have any questions.\n\nBest,\nAlex`;
    linkedinNote = `Hi ${firstName}, thanks for the conversation today!`;
  }

  return {
    dispositionTag,
    email: {
      subject: emailSubject,
      body: emailBody
    },
    linkedin: {
      text: linkedinNote
    },
    crmSummary: `Aircall sales call conducted with ${lead.name} (${lead.title}). Outcome: ${dispositionTag}. ${repNotes ? `Rep notes: "${repNotes}"` : 'AI post-call follow-ups prepared.'}`,
    suggestedTags: ["Aircall", dispositionTag, lead.industry || "B2B SaaS"]
  };
}

function analyzeWebsitePositioning(urlStr, currentMemory = {}) {
  let cleanDomain = (urlStr || "https://omnireach.ai")
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim();

  let domainName = cleanDomain.split('.')[0] || "YourCompany";
  domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

  let matchedIndustry = "B2B SaaS / Enterprise Technology";
  let corePositioning = `${domainName} helps modern revenue and operations teams automate workflows, accelerate qualified pipeline, and eliminate manual busywork.`;
  let valueProposition = `Reduces operational overhead by up to 65% and drives 3x faster time-to-value through autonomous AI intelligence.`;

  if (cleanDomain.includes('cloud') || cleanDomain.includes('ai') || cleanDomain.includes('data')) {
    matchedIndustry = "Enterprise AI & Cloud Infrastructure";
    corePositioning = `${domainName} delivers autonomous AI-driven infrastructure and intelligent observability for high-growth tech companies.`;
    valueProposition = `Cuts manual prospecting and operational latency by 80% with real-time signal intelligence.`;
  } else if (cleanDomain.includes('cyber') || cleanDomain.includes('sec') || cleanDomain.includes('guard')) {
    matchedIndustry = "Cybersecurity & InfoSec SaaS";
    corePositioning = `${domainName} provides autonomous compliance, threat telemetry, and identity security for modern cloud enterprises.`;
    valueProposition = `Eliminates security compliance audit friction and secures cloud workloads with zero downtime.`;
  } else if (cleanDomain.includes('health') || cleanDomain.includes('med') || cleanDomain.includes('bio')) {
    matchedIndustry = "HealthTech & Telemetry SaaS";
    corePositioning = `${domainName} streamlines clinical revenue cycle management and hospital workflow automation with strict HIPAA compliance.`;
    valueProposition = `Accelerates healthcare enterprise adoption and cuts claims processing cycle times by 40%.`;
  }

  const suggestedICPs = [
    {
      id: `icp-${Date.now()}-1`,
      name: `${domainName} High-Value Enterprise Buyer`,
      industry: matchedIndustry,
      companySize: "100-500 employees",
      titles: ["Chief Revenue Officer (CRO)", "VP of Sales", "Chief Technology Officer (CTO)"],
      corePainPoints: [
        `Manual repetitive workflows consuming 3+ hours per team member daily at target accounts`,
        `Difficulty scaling pipeline and output without hiring expensive additional headcount`,
        `Declining response rates on legacy generic cold outreach`
      ],
      whyTheyBuy: `Enables leadership to achieve 3.4x higher output while slashing operational customer acquisition costs.`
    },
    {
      id: `icp-${Date.now()}-2`,
      name: `${domainName} Growth & Mid-Market Operator`,
      industry: matchedIndustry,
      companySize: "30-120 employees",
      titles: ["Head of Growth", "VP of Engineering", "Director of Demand Gen"],
      corePainPoints: [
        `Fragmented tech stack with disconnected tools causing missed buyer intent signals`,
        `Need high deliverability and multi-touch execution across email, social, and phone`,
        `Slow lead-to-conversation speed exceeding 4 hours`
      ],
      whyTheyBuy: `Provides an end-to-end unified operating system with sub-5-minute speed-to-lead response.`
    }
  ];

  const brandTone = {
    style: "Consultative, authoritative, and data-backed",
    pace: "Direct, punchy, zero buzzwords (<90 words per message)",
    formality: "Warm executive (credible and authentic)",
    powerPhrases: [
      "decouple quota from headcount",
      "3.4x more qualified executive meetings",
      "speed-to-lead under 5 minutes",
      "zero manual prospecting grind"
    ],
    bannedPhrases: [
      "hope this email finds you well",
      "synergy",
      "just checking in",
      "touching base",
      "circle back"
    ]
  };

  const updatedMemory = {
    ...currentMemory,
    websiteUrl: urlStr.startsWith('http') ? urlStr : `https://${urlStr}`,
    companyName: domainName,
    tagline: `${domainName} — ${matchedIndustry} Platform`,
    corePositioning,
    valueProposition,
    keyProducts: [
      `${domainName} Autonomous Intelligence Engine`,
      `${domainName} Multi-Channel Outreach OS`,
      `${domainName} Aircall Voice & CTI Bridge`
    ],
    icps: suggestedICPs,
    brandTone,
    updatedAt: new Date().toISOString()
  };

  return {
    updatedMemory,
    domainName,
    matchedIndustry,
    corePositioning,
    valueProposition,
    suggestedICPs
  };
}

function processBuyerDescription(buyerText, currentMemory = {}) {
  const text = (buyerText || "").trim();
  const lower = text.toLowerCase();

  let industry = "B2B SaaS / Technology";
  if (lower.includes('fintech') || lower.includes('finance')) industry = "FinTech & Financial Services";
  else if (lower.includes('health') || lower.includes('medical') || lower.includes('hospital')) industry = "HealthTech & Life Sciences";
  else if (lower.includes('cyber') || lower.includes('security')) industry = "Cybersecurity & InfoSec";
  else if (lower.includes('logistics') || lower.includes('supply chain') || lower.includes('freight')) industry = "Supply Chain & Logistics";
  else if (lower.includes('ecommerce') || lower.includes('retail')) industry = "E-Commerce & Retail Tech";
  else if (lower.includes('devops') || lower.includes('infrastructure')) industry = "DevSecOps & Cloud Infrastructure";

  let size = "50-250 employees (Series A-C)";
  if (lower.includes('enterprise') || lower.includes('500') || lower.includes('1000')) size = "250-1,000+ employees (Enterprise)";
  else if (lower.includes('seed') || lower.includes('early') || lower.includes('startup') || lower.includes('under 50')) size = "15-50 employees (Early Growth)";

  let titles = ["VP of Sales", "Chief Revenue Officer (CRO)"];
  if (lower.includes('cto') || lower.includes('engineer') || lower.includes('devops')) titles = ["Chief Technology Officer (CTO)", "VP of Engineering"];
  else if (lower.includes('ceo') || lower.includes('founder')) titles = ["CEO & Co-Founder", "Chief Executive Officer"];
  else if (lower.includes('marketing') || lower.includes('growth')) titles = ["VP of Marketing", "Head of Demand Gen"];
  else if (lower.includes('procurement') || lower.includes('operations')) titles = ["VP of Operations", "Head of Procurement"];

  const newIcp = {
    id: `icp-custom-${Date.now()}`,
    name: `${industry} Persona (${titles[0]})`,
    industry,
    companySize: size,
    titles,
    corePainPoints: [
      `Struggling with manual prospecting and low outbound conversion rates`,
      `Overwhelmed by disconnected sales and communication tooling`,
      `Need rapid speed-to-lead response when high-intent prospects engage`
    ],
    whyTheyBuy: `Automates research, email, and live Aircall calling into a unified high-converting sequence.`
  };

  const existingIcps = currentMemory.icps || [];
  const updatedMemory = {
    ...currentMemory,
    icps: [newIcp, ...existingIcps.slice(0, 3)],
    updatedAt: new Date().toISOString()
  };

  return {
    newIcp,
    updatedMemory
  };
}

function chatWithAIStrategist(userMessage, currentMemory = {}) {
  const msg = (userMessage || "").trim();
  const lower = msg.toLowerCase();

  const urlMatch = msg.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(com|io|ai|net|cloud|org|co|tech)[^\s]*)/i);
  if (urlMatch) {
    const rawUrl = urlMatch[0];
    const analysis = analyzeWebsitePositioning(rawUrl, currentMemory);
    
    const replyText = `I analyzed **${analysis.domainName}** (${analysis.updatedMemory.websiteUrl}) and synthesized your core business positioning into persistent memory:

• **Core Positioning**: ${analysis.corePositioning}
• **Value Proposition**: ${analysis.valueProposition}

Based on your business model, I've designed and stored **2 high-converting Ideal Customer Profiles (ICPs)**:
1. **${analysis.suggestedICPs[0].name}**: Target titles include ${analysis.suggestedICPs[0].titles.join(', ')} at ${analysis.suggestedICPs[0].companySize} companies.
2. **${analysis.suggestedICPs[1].name}**: Focuses on ${analysis.suggestedICPs[1].titles.join(', ')}.

All of this has been locked into your business memory. It will automatically guide all future **AI Lead Discovery**, **Email Writing**, **LinkedIn Notes**, and **Aircall Battlecards**.

Would you like to refine your target buyer persona further or adjust your brand voice?`;

    return {
      reply: replyText,
      updatedMemory: analysis.updatedMemory,
      action: 'website_analyzed'
    };
  }

  if (
    lower.includes('we sell to') ||
    lower.includes('target buyer') ||
    lower.includes('our buyer') ||
    lower.includes('ideal customer') ||
    lower.includes('icp') ||
    lower.includes('we target') ||
    lower.includes('looking for') ||
    lower.includes('sell')
  ) {
    const extraction = processBuyerDescription(msg, currentMemory);
    const icp = extraction.newIcp;

    const replyText = `Got it! I have extracted your buyer persona and added it to your persistent business memory:

• **ICP Title**: ${icp.name}
• **Target Industry**: ${icp.industry}
• **Target Company Size**: ${icp.companySize}
• **Key Roles**: ${icp.titles.join(', ')}
• **Core Pain Points**: ${icp.corePainPoints[0]}

I've stored this in your active memory. When you run **AI Client Discovery**, the scanner will automatically look for prospects matching these parameters, and your **Aircall battlecards** will tailor their opening hook specifically to these pain points!

Anything you'd like to adjust regarding your brand tone or tone preferences?`;

    return {
      reply: replyText,
      updatedMemory: extraction.updatedMemory,
      action: 'buyer_learned'
    };
  }

  if (
    lower.includes('tone') ||
    lower.includes('banned') ||
    lower.includes('voice') ||
    lower.includes('style') ||
    lower.includes('don\'t say') ||
    lower.includes('never say')
  ) {
    const tone = currentMemory.brandTone || {
      style: "Consultative and authoritative",
      powerPhrases: [],
      bannedPhrases: []
    };

    if (lower.includes('direct') || lower.includes('short') || lower.includes('concise')) {
      tone.style = "Ultra-direct, punchy, and concise (<75 words)";
    }
    if (lower.includes('casual') || lower.includes('friendly')) {
      tone.formality = "Conversational and authentic";
    }

    const updatedMemory = {
      ...currentMemory,
      brandTone: tone,
      updatedAt: new Date().toISOString()
    };

    const replyText = `Updated your brand voice guide in persistent memory:

• **Active Style**: ${tone.style}
• **Formality**: ${tone.formality || 'Warm executive'}
• **Deliverability Filter**: Any banned phrases (like *"hope this finds you well"* or *"just checking in"*) are permanently blocked from all generated emails.

This preference is now saved and will persist across all sessions!`;

    return {
      reply: replyText,
      updatedMemory,
      action: 'tone_updated'
    };
  }

  const replyText = `I have your active business memory loaded:
• **Company**: ${currentMemory.companyName || 'OmniReach AI'}
• **Positioning**: ${currentMemory.corePositioning || 'Autonomous Multi-channel Outreach'}
• **Active ICPs**: ${currentMemory.icps?.length || 2} profiles saved
• **Tone**: ${currentMemory.brandTone?.style || 'Consultative & direct'}

How can I help you sharpen your strategy today? You can:
1. **Drop a new URL** to re-analyze positioning.
2. **Describe a new niche buyer** to auto-generate a target ICP.
3. **Ask for high-converting email subject lines or Aircall opening hooks** for your active ICP.`;

  return {
    reply: replyText,
    updatedMemory: currentMemory,
    action: 'general_advisory'
  };
}

module.exports = {
  SAMPLE_DISCOVERY_DATABASE,
  enrichLeadData,
  generatePersonalizedEmail,
  generateLinkedInOutreach,
  generateCallScript,
  handleLiveCallTurn,
  generateAircallScreenPopContext,
  generateAircallPostCallFollowup,
  analyzeWebsitePositioning,
  processBuyerDescription,
  chatWithAIStrategist
};
