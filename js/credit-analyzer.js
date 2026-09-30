/**
 * CrediPulse AI — Credit Score & Financial Risk Analyzer
 * Speedometer gauge visualization, 5-pillar breakdown, What-If simulator, and credit score estimator.
 */

// Current score state
let currentCreditScore = 750;

/**
 * Initialize credit analyzer on page load
 */
function initCreditAnalyzer() {
  updateCreditAnalyzerDisplay(currentCreditScore);
}

/**
 * Update the SVG gauge meter and pillar breakdown based on score (300 - 900)
 */
function updateCreditAnalyzerDisplay(score) {
  score = Math.max(300, Math.min(900, parseInt(score, 10) || 750));
  currentCreditScore = score;

  // 1. Update text displays
  const scoreNumDisplay = document.getElementById('analyzer-score-display');
  const slider = document.getElementById('analyzer-score-slider');
  const sliderVal = document.getElementById('slider-score-val');

  if (scoreNumDisplay) scoreNumDisplay.textContent = score;
  if (slider && parseInt(slider.value, 10) !== score) slider.value = score;
  if (sliderVal) sliderVal.textContent = score;

  // 2. Rotate Needle
  // Semicircle: from -90deg (at 300) to +90deg (at 900)
  // Total span = 180deg across 600 points (300 to 900)
  const normalized = (score - 300) / 600; // 0.0 to 1.0
  const needleAngle = -90 + (normalized * 180);

  const needleGroup = document.getElementById('gauge-needle-group');
  if (needleGroup) {
    needleGroup.setAttribute('transform', `rotate(${needleAngle}, 150, 150)`);
  }

  // 3. Update Arc stroke dashoffset
  // Arc length is ~377 for radius 120 (PI * 120 = 376.99)
  const arc = document.getElementById('gauge-active-arc');
  if (arc) {
    const dashoffset = 377 - (normalized * 377);
    arc.style.strokeDashoffset = dashoffset;
  }

  // 4. Update Score Band Badge & Color
  const bandBadge = document.getElementById('score-band-badge');
  let bandName = 'Good';
  let bandColorClass = 'text-blue';

  if (score >= 800) {
    bandName = 'Prime / Excellent';
    bandColorClass = 'text-purple';
  } else if (score >= 740) {
    bandName = 'Very Good';
    bandColorClass = 'text-emerald';
  } else if (score >= 670) {
    bandName = 'Good';
    bandColorClass = 'text-blue';
  } else if (score >= 580) {
    bandName = 'Fair / Moderate';
    bandColorClass = 'text-amber';
  } else {
    bandName = 'Poor / Subprime';
    bandColorClass = 'text-red';
  }

  if (bandBadge) {
    bandBadge.textContent = bandName;
    bandBadge.className = `badge-status ${bandColorClass}`;
  }

  // 5. Update 5 Health Pillars dynamically based on score tier
  updateHealthPillars(score, normalized);
}

/**
 * Dynamic adjustments to 5 Credit Pillars
 */
function updateHealthPillars(score, norm) {
  // Pillar 1: Payment History (35%)
  const payBar = document.getElementById('pillar-payment-bar');
  const payText = document.getElementById('pillar-payment-text');
  const payPct = Math.min(100, Math.max(30, Math.round(norm * 100)));
  if (payBar) payBar.style.width = `${payPct}%`;
  if (payText) {
    if (score >= 750) payText.textContent = '100% On-Time (Excellent)';
    else if (score >= 670) payText.textContent = '96% On-Time (Good)';
    else if (score >= 580) payText.textContent = '88% On-Time (1-2 Delinquencies)';
    else payText.textContent = '< 80% On-Time (Frequent Delays)';
  }

  // Pillar 2: Credit Card Utilization (30%)
  const utilBar = document.getElementById('pillar-util-bar');
  const utilText = document.getElementById('pillar-util-text');
  let utilVal = Math.round(75 - (norm * 60)); // Higher score = lower utilization
  if (utilBar) utilBar.style.width = `${Math.min(100, Math.max(20, Math.round(norm * 95)))}%`;
  if (utilText) {
    if (score >= 750) utilText.textContent = `${utilVal}% Utilized (Optimal < 30%)`;
    else if (score >= 670) utilText.textContent = `${utilVal}% Utilized (Acceptable)`;
    else utilText.textContent = `${utilVal}% Utilized (High Revolving Debt)`;
  }

  // Pillar 3: Length of Credit History (15%)
  const ageBar = document.getElementById('pillar-age-bar');
  const ageText = document.getElementById('pillar-age-text');
  const ageYears = (1 + norm * 7).toFixed(1);
  if (ageBar) ageBar.style.width = `${Math.min(100, Math.max(25, Math.round(norm * 90)))}%`;
  if (ageText) ageText.textContent = `${ageYears} Years Average History`;

  // Pillar 4: Credit Mix (10%)
  const mixBar = document.getElementById('pillar-mix-bar');
  const mixText = document.getElementById('pillar-mix-text');
  if (mixBar) mixBar.style.width = `${Math.min(100, Math.max(35, Math.round(norm * 85)))}%`;
  if (mixText) {
    if (score >= 720) mixText.textContent = 'Balanced (Secured + Unsecured)';
    else mixText.textContent = 'Single Category Dominated';
  }

  // Pillar 5: New Inquiries (10%)
  const inqBar = document.getElementById('pillar-inq-bar');
  const inqText = document.getElementById('pillar-inq-text');
  if (inqBar) inqBar.style.width = `${Math.min(100, Math.max(30, Math.round(norm * 95)))}%`;
  if (inqText) {
    if (score >= 740) inqText.textContent = '0 - 1 Inquiries in 6 months (Low Risk)';
    else if (score >= 650) inqText.textContent = '2 - 3 Inquiries (Moderate)';
    else inqText.textContent = '4+ Hard Inquiries (Credit Hungry)';
  }
}

/**
 * Handle slider input from user
 */
function updateCreditAnalyzerFromSlider(val) {
  updateCreditAnalyzerDisplay(val);
}

/**
 * "What-If" Credit Scenario Simulator
 */
function simulateAction(actionType) {
  let delta = 0;
  let explanation = '';

  switch (actionType) {
    case 'pay_debt':
      delta = 28;
      explanation = 'Paying down 40% of revolving credit card debt drops your credit utilization ratio below the critical 30% threshold, generating a swift +28 point boost.';
      break;
    case 'miss_payment':
      delta = -65;
      explanation = 'A 30-day late payment flag severely damages the Payment History pillar (35% weight), triggering an immediate ~65 point drop that remains on record for up to 36 months.';
      break;
    case 'close_old_card':
      delta = -18;
      explanation = 'Closing your oldest active credit card reduces your total available credit limit and shortens your average account age, causing an estimated ~18 point reduction.';
      break;
    case 'add_mix':
      delta = 14;
      explanation = 'Adding a secured asset-backed loan (such as gold or auto loan) balances your portfolio against unsecured credit cards, improving your Credit Mix pillar by ~14 points.';
      break;
    default:
      return;
  }

  const newScore = Math.max(300, Math.min(900, currentCreditScore + delta));
  updateCreditAnalyzerDisplay(newScore);

  const feedback = document.getElementById('sim-feedback-msg');
  if (feedback) {
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    const color = delta > 0 ? 'text-emerald' : 'text-red';
    feedback.innerHTML = `<strong class="${color}">Projected Score Change: ${sign} points (Now ${newScore})</strong><br>${explanation}`;
  }

  showToast(`Simulation Applied: ${delta > 0 ? '+' : ''}${delta} pts`, delta > 0 ? 'success' : 'warning');
}

/**
 * Sync analyzer score to Loan Eligibility Checker input
 */
function syncScoreToLoanChecker() {
  const cibilInput = document.getElementById('applicant-cibil');
  if (cibilInput) {
    cibilInput.value = currentCreditScore;
  }
  showToast(`Score (${currentCreditScore}) synced to Loan Eligibility Checker!`, 'success');
  switchTab('loan-checker');
}

// ==========================================================================
// Score Estimator Quiz Modal Handlers
// ==========================================================================

function openScoreEstimatorModal() {
  const modal = document.getElementById('score-quiz-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeScoreEstimatorModal() {
  const modal = document.getElementById('score-quiz-modal');
  if (modal) modal.classList.add('hidden');
}

function calculateEstimatedScoreFromQuiz() {
  const q1 = document.getElementById('quiz-q1').value;
  const q2 = document.getElementById('quiz-q2').value;
  const q3 = document.getElementById('quiz-q3').value;
  const q4 = document.getElementById('quiz-q4').value;
  const q5 = document.getElementById('quiz-q5').value;

  // Base score 300
  let calculatedScore = 300;

  // Q1: Payment history (Max 210 pts)
  if (q1 === 'none') calculatedScore += 210;
  else if (q1 === 'once_minor') calculatedScore += 130;
  else if (q1 === 'multiple') calculatedScore += 60;
  else calculatedScore += 0;

  // Q2: Utilization (Max 180 pts)
  if (q2 === 'under_20') calculatedScore += 180;
  else if (q2 === '20_to_40') calculatedScore += 130;
  else if (q2 === '40_to_70') calculatedScore += 70;
  else calculatedScore += 10;

  // Q3: Account age (Max 90 pts)
  if (q3 === 'over_5') calculatedScore += 90;
  else if (q3 === '2_to_5') calculatedScore += 65;
  else if (q3 === '1_to_2') calculatedScore += 40;
  else calculatedScore += 15;

  // Q4: Credit mix (Max 60 pts)
  if (q4 === 'both') calculatedScore += 60;
  else if (q4 === 'loans_only') calculatedScore += 40;
  else if (q4 === 'cards_only') calculatedScore += 35;
  else calculatedScore += 10;

  // Q5: Inquiries (Max 60 pts)
  if (q5 === 'zero') calculatedScore += 60;
  else if (q5 === 'one') calculatedScore += 45;
  else if (q5 === 'two_three') calculatedScore += 25;
  else calculatedScore += 5;

  closeScoreEstimatorModal();
  updateCreditAnalyzerDisplay(calculatedScore);

  const feedback = document.getElementById('sim-feedback-msg');
  if (feedback) {
    feedback.innerHTML = `<strong class="text-cyan">Estimated Score from Banking Quiz: ${calculatedScore} / 900</strong><br>Calculated using standard 5-pillar credit bureau weighting models. You can now use this score in the Loan Checker.`;
  }

  showToast(`Estimated Score calculated: ${calculatedScore}`, 'success');
}
