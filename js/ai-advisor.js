/**
 * CrediPulse AI — AI Financial Tips & Claude Advisor
 * Anthropic Claude API integration with an offline BFSI Expert Neural Heuristic Engine.
 */

// BFSI System Persona Prompt for Claude AI
const BFSI_SYSTEM_PROMPT = `You are "CrediPulse AI", a senior BFSI (Banking, Financial Services, and Insurance) Underwriting Specialist and Chartered Financial Advisor.
Your objective is to help personal loan, mortgage, and business loan applicants optimize their borrowing costs, improve credit bureau ratings, and manage their debt-to-income (FOIR) ratios.
Guidelines:
1. Deliver structured, clear, and actionable financial advice.
2. Use bullet points and bold emphasis for key numbers, interest rates, and ratios.
3. Recommend practical strategies like debt consolidation, prepayment compounding, and co-borrower leverage.
4. When relevant, reference standard banking guidelines such as 50% FOIR cap and 30% credit card utilization rule.`;

/**
 * Handle Enter key in chat input textarea
 */
function handleChatKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

/**
 * Send user message to Claude AI or Offline Expert Engine
 */
async function sendChatMessage() {
  const promptInput = document.getElementById('ai-user-prompt');
  const userText = promptInput ? promptInput.value.trim() : '';

  if (!userText) return;

  // Add User bubble
  appendChatBubble('user', userText);
  promptInput.value = '';

  // Show typing loader
  const typingBubbleId = appendTypingIndicator();

  try {
    const aiResponse = await generateAIAdvice(userText);
    removeTypingIndicator(typingBubbleId);
    appendChatBubble('ai', aiResponse);
  } catch (error) {
    console.error('AI Advisor error:', error);
    removeTypingIndicator(typingBubbleId);
    // Fall back to rule engine response
    const fallbackResponse = generateOfflineBFSIResponse(userText);
    appendChatBubble('ai', fallbackResponse);
  }
}

/**
 * Ask preset scenario questions from quick cards
 */
function askAIPreset(scenarioKey) {
  let promptText = '';
  switch (scenarioKey) {
    case 'how_to_reduce_interest':
      promptText = 'What are the most effective strategies to slash total interest payable on a long-term loan?';
      break;
    case 'boost_credit_50_pts':
      promptText = 'What is the fastest 60-day roadmap to increase my credit score by 50+ points for a loan approval?';
      break;
    case 'foir_reduction':
      promptText = 'My debt-to-income FOIR ratio is over 55%. What immediate steps can I take to qualify for a larger loan?';
      break;
    case 'tax_benefits':
      promptText = 'Explain the key tax exemptions and deductions available on home loans and education loans.';
      break;
    default:
      promptText = 'Give me your top recommendations to maximize loan eligibility.';
  }

  const promptInput = document.getElementById('ai-user-prompt');
  if (promptInput) {
    promptInput.value = promptText;
  }
  sendChatMessage();
}

/**
 * Generate 360-degree Financial Diagnostic Audit using applicant's current numbers
 */
function generate360Diagnostic() {
  const symbol = getCurrentCurrencySymbol();
  let contextDetails = '';

  if (currentLoanEvaluation) {
    contextDetails = `
Applicant Name: ${currentLoanEvaluation.name}
Monthly Income: ${symbol}${formatNumber(currentLoanEvaluation.totalIncome)}
Existing EMIs: ${symbol}${formatNumber(currentLoanEvaluation.existingEmis)}
Requested Loan: ${symbol}${formatNumber(currentLoanEvaluation.requestedAmount)} (${currentLoanEvaluation.loanType})
Tenure: ${currentLoanEvaluation.tenureYears} years
Evaluated FOIR: ${currentLoanEvaluation.foirPercentage}%
Calculated Approval Probability: ${currentLoanEvaluation.approvalProbability}%
Current Credit Score: ${currentLoanEvaluation.creditScore}
Status: ${currentLoanEvaluation.status}`;
  } else {
    // Fallback to sample profile
    contextDetails = `
Applicant Profile: Salaried Professional
Monthly Income: ${symbol}85,000
Existing Obligations: ${symbol}12,000
Requested Loan: ${symbol}6,00,000 Personal Loan
Tenure: 4 years
Credit Score: ${currentCreditScore || 750}`;
  }

  const userPrompt = `Generate a Comprehensive 360° BFSI Financial Health & Loan Readiness Diagnostic for this profile:\n${contextDetails}`;
  appendChatBubble('user', '📋 Generate 360° Comprehensive Financial Health & Loan Readiness Audit for my profile.');

  const typingId = appendTypingIndicator();

  setTimeout(async () => {
    try {
      const response = await generateAIAdvice(userPrompt, true);
      removeTypingIndicator(typingId);
      appendChatBubble('ai', response);
    } catch (e) {
      removeTypingIndicator(typingId);
      const fallback = generateStructured360Audit();
      appendChatBubble('ai', fallback);
    }
  }, 600);
}

/**
 * Receive evaluation context when coming from Module 1
 */
function loadLoanContextIntoAI(evalData) {
  const symbol = evalData.currencySymbol || '₹';
  const introMsg = `I have received your loan evaluation data for <strong>${evalData.name}</strong> (${evalData.status} — ${evalData.approvalProbability}% approval probability). Would you like me to analyze how to reduce your calculated monthly EMI of <strong>${symbol}${formatNumber(evalData.calculatedEmi)}</strong> or increase your borrowing capacity?`;
  appendChatBubble('ai', introMsg);
}

/**
 * Core AI generation dispatcher: Tries Anthropic Claude API, else falls back to Heuristic Engine
 */
async function generateAIAdvice(prompt, isAudit = false) {
  const settings = getAppSettings();
  const apiKey = settings.claudeApiKey ? settings.claudeApiKey.trim() : '';

  // If Anthropic Claude API Key is provided, call Claude API
  if (apiKey && apiKey.startsWith('sk-ant')) {
    try {
      const claudeResponse = await callClaudeAPI(apiKey, prompt);
      if (claudeResponse) {
        return claudeResponse;
      }
    } catch (err) {
      console.warn('Claude API request failed, falling back to neural heuristic engine:', err);
      // Fall through to heuristic
    }
  }

  // Heuristic engine fallback
  if (isAudit) {
    return generateStructured360Audit();
  } else {
    return generateOfflineBFSIResponse(prompt);
  }
}

/**
 * Direct Anthropic Claude API Fetch Call
 */
async function callClaudeAPI(apiKey, userPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'dangerously-allow-browser': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: BFSI_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  if (json.content && json.content[0] && json.content[0].text) {
    return formatMarkdownForDisplay(json.content[0].text);
  }
  throw new Error('Invalid Claude API response structure');
}

/**
 * CrediPulse Autonomous BFSI Rule-Based Expert Engine
 * Comprehensive financial intelligence knowledge base for viva presentations & offline use.
 */
function generateOfflineBFSIResponse(query) {
  const q = query.toLowerCase();
  const symbol = getCurrentCurrencySymbol();

  if (q.includes('interest') || q.includes('slash') || q.includes('lower') || q.includes('rate')) {
    return `
<h4><i class="fa-solid fa-percent text-cyan"></i> Top 4 Strategies to Slash Total Loan Interest</h4>
<ul>
  <li><strong>1. The "1 Extra EMI Per Year" Rule:</strong> Making just one additional monthly payment each calendar year cuts a 20-year home loan by over <strong>3.5 years</strong> and saves up to 18% in total interest.</li>
  <li><strong>2. Annual 5% Prepayment:</strong> Prepaying 5% of your outstanding principal once every 12 months reduces overall borrowing costs by nearly <strong>30%</strong> due to reverse compounding.</li>
  <li><strong>3. Benchmark Marginal Spread Negotiation:</strong> If your CIBIL score has improved above 780 since loan inception, request your lender to reset your spread to prevailing prime rates (often saving 0.35% - 0.75% p.a.).</li>
  <li><strong>4. Bi-Weekly Payment Hack:</strong> Split your monthly EMI in half and pay every 2 weeks. This results in 26 half-payments (13 full EMIs) per year without straining monthly budgets.</li>
</ul>`;
  }

  if (q.includes('credit') || q.includes('cibil') || q.includes('score') || q.includes('50')) {
    return `
<h4><i class="fa-solid fa-rocket text-emerald"></i> 60-Day Blueprint to Boost Credit Score by 50+ Points</h4>
<ul>
  <li><strong>Phase 1 (Days 1–15): The 30% Utilization Cap:</strong> Credit card utilization drives 30% of your score. Pay down card balances to keep statement balances strictly below <strong>30%</strong> of credit limits (ideally below 10%).</li>
  <li><strong>Phase 2 (Days 16–30): Pre-Billing Settlement:</strong> Make payments <em>3 days before</em> your billing statement generation date so banks report near-zero balances to credit bureaus.</li>
  <li><strong>Phase 3 (Days 31–45): Bureau Error Dispute:</strong> Download your official CIBIL/Experian credit report and check for misreported late payments, closed accounts still shown as active, or incorrect loan ownership.</li>
  <li><strong>Phase 4 (Days 46–60): Freeze New Applications:</strong> Cease all hard inquiries for 60 days. Each credit card or loan application docks 5 to 10 points temporarily.</li>
</ul>`;
  }

  if (q.includes('foir') || q.includes('dti') || q.includes('debt') || q.includes('ratio')) {
    return `
<h4><i class="fa-solid fa-scale-balanced text-amber"></i> How to Overcome High FOIR / Debt-to-Income Constraints</h4>
<ul>
  <li><strong>Benchmark Constraint:</strong> Most financial institutions cap total monthly obligations (existing EMIs + proposed EMI) at <strong>50% to 55%</strong> of net disposable monthly income.</li>
  <li><strong>Co-Applicant Inclusion:</strong> Adding a spouse or parent as a co-borrower adds their net monthly salary to the denominator, immediately expanding your loan capacity by 40% - 80%.</li>
  <li><strong>Tenure Extension:</strong> Extending your loan tenure (e.g. from 15 to 20 years) spreads principal repayment, dropping your monthly EMI and fitting your FOIR within permissible limits.</li>
  <li><strong>Debt Consolidation:</strong> Consolidate multiple short-term debts (credit card balances, retail EMIs) into a single lower-rate personal loan to eliminate multiple high monthly obligations.</li>
</ul>`;
  }

  if (q.includes('tax') || q.includes('80c') || q.includes('24') || q.includes('deduction')) {
    return `
<h4><i class="fa-solid fa-shield-heart text-purple"></i> Key Tax Deductions Available on Loans</h4>
<ul>
  <li><strong>Home Loan Principal (Section 80C):</strong> Claim up to <strong>₹1,50,000</strong> per financial year on principal repayments (inclusive of PF, ELSS, PPF limits).</li>
  <li><strong>Home Loan Interest (Section 24b):</strong> Claim up to <strong>₹2,00,000</strong> deduction per financial year for self-occupied residential property against taxable income.</li>
  <li><strong>Education Loan Interest (Section 80E):</strong> Deduct 100% of the interest paid on higher education loans with <strong>no upper monetary cap</strong> for up to 8 consecutive assessment years.</li>
  <li><strong>First-Time Home Buyers (Section 80EEA):</strong> Additional ₹1,50,000 interest deduction for affordable housing properties valued under ₹45 Lakhs.</li>
</ul>`;
  }

  // General Financial Advisory Response
  return `
<h4><i class="fa-solid fa-lightbulb text-cyan"></i> CrediPulse AI Financial Advisory</h4>
<p>Based on prudent BFSI underwriting standards, here are 3 key considerations for your financial profile:</p>
<ul>
  <li><strong>Maintain a 6-Month Emergency Liquidity Buffer:</strong> Ensure you retain at least 6 months of total loan EMIs in a high-yield liquid fund before committing to new debt.</li>
  <li><strong>Optimize Debt-to-Asset Ratio:</strong> Unsecured debt (personal loans, credit cards) should never exceed 25% of your total borrowing portfolio.</li>
  <li><strong>Compare APR, Not Just Headline Rates:</strong> Always calculate the Annual Percentage Rate (APR) including processing fees, documentation charges, and mandatory insurance premiums.</li>
</ul>
<p class="text-xs text-muted">💡 Have a specific question? Ask about home loan balance transfers, credit repair, or loan eligibility optimization.</p>`;
}

/**
 * Generate Structured 360-degree Financial Health Audit
 */
function generateStructured360Audit() {
  const symbol = getCurrentCurrencySymbol();
  const applicantName = currentLoanEvaluation ? currentLoanEvaluation.name : 'Valued Applicant';
  const score = currentCreditScore || 750;
  const foir = currentLoanEvaluation ? currentLoanEvaluation.foirPercentage : 42;
  const status = currentLoanEvaluation ? currentLoanEvaluation.status : 'APPROVED';

  return `
<h4><i class="fa-solid fa-file-invoice-dollar text-cyan"></i> 360° Financial Health & Loan Readiness Diagnostic</h4>
<p>Executive assessment prepared for <strong>${escapeHtml(applicantName)}</strong>.</p>

<div class="metrics-grid mt-2 mb-2">
  <div class="glass-panel-sm">
    <span class="text-xs text-muted">Overall Risk Classification</span><br>
    <strong class="text-emerald">${status === 'APPROVED' ? 'Prime Underwriting Tier' : (status === 'CONDITIONAL' ? 'Moderate Risk Tier' : 'High Risk Review')}</strong>
  </div>
  <div class="glass-panel-sm">
    <span class="text-xs text-muted">Debt-Service Buffer</span><br>
    <strong class="text-cyan">${foir <= 50 ? 'Strong Headroom (> 50% Safe)' : 'Constrained (< 10% Margin)'}</strong>
  </div>
</div>

<strong>1. Core Financial Strengths:</strong>
<ul>
  <li>Credit Bureau profile (${score}) ranks in the upper quartile of applicant benchmarks.</li>
  <li>Consistent debt servicing track record with healthy historical payment consistency.</li>
</ul>

<strong>2. Strategic Risk Observations:</strong>
<ul>
  <li>Current FOIR obligation stands at <strong>${foir}%</strong>. Banks prefer total obligations below 50% for unencumbered cash flow.</li>
  <li>Prepayment elasticity is high: accelerating principal repayments will generate substantial compound interest savings.</li>
</ul>

<strong>3. 90-Day Priority Optimization Plan:</strong>
<ul>
  <li><strong>Days 1–30:</strong> Liquidate high-interest unsecured revolving credit card dues to widen monthly disposable cash flow.</li>
  <li><strong>Days 31–60:</strong> Avoid new hard inquiries or consumer durables BNPL schemes ahead of formal underwriting.</li>
  <li><strong>Days 61–90:</strong> File the formal loan dossier with verified salary slips and 6 months of audited bank statements for preferential pricing.</li>
</ul>`;
}

/**
 * Append chat bubble to chat window
 */
function appendChatBubble(sender, htmlContent) {
  const stream = document.getElementById('chat-stream');
  if (!stream) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${sender}`;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (sender === 'ai') {
    bubble.innerHTML = `
      <div class="bubble-avatar"><i class="fa-solid fa-robot"></i></div>
      <div class="bubble-content">
        ${htmlContent}
        <span class="chat-time">${now}</span>
      </div>
    `;
  } else {
    bubble.innerHTML = `
      <div class="bubble-avatar"><i class="fa-solid fa-user"></i></div>
      <div class="bubble-content">
        <p>${escapeHtml(htmlContent)}</p>
        <span class="chat-time">${now}</span>
      </div>
    `;
  }

  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;
}

/**
 * Append typing animation indicator
 */
function appendTypingIndicator() {
  const stream = document.getElementById('chat-stream');
  if (!stream) return null;

  const id = 'typing-' + Date.now();
  const indicator = document.createElement('div');
  indicator.id = id;
  indicator.className = 'chat-bubble bubble-ai';
  indicator.innerHTML = `
    <div class="bubble-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="bubble-content" style="padding: 0.6rem 1rem;">
      <i class="fa-solid fa-ellipsis fa-fade text-cyan" style="font-size: 1.2rem;"></i>
    </div>
  `;

  stream.appendChild(indicator);
  stream.scrollTop = stream.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  if (!id) return;
  const elem = document.getElementById(id);
  if (elem && elem.parentNode) {
    elem.parentNode.removeChild(elem);
  }
}

/**
 * Clear chat history
 */
function clearAIChat() {
  const stream = document.getElementById('chat-stream');
  if (stream) {
    stream.innerHTML = '';
    appendChatBubble('ai', 'Chat history cleared. How can I assist you with your loan or financial planning today?');
    showToast('Chat history cleared.', 'info');
  }
}

/**
 * Helper to convert basic markdown from Claude to HTML
 */
function formatMarkdownForDisplay(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h4>$1</h4>')
    .replace(/^# (.*$)/gim, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\s*\n\*/gm, '<ul>\n*')
    .replace(/^(\*|\-)\s+(.*)/gim, '<li>$2</li>')
    .replace(/\n\n/g, '<br><br>');
}
