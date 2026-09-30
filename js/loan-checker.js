/**
 * CrediPulse AI — Loan Eligibility Engine
 * Real BFSI Underwriting Algorithm: FOIR, DTI, Multi-Factor Approval Matrix & Recommendations.
 */

// Global state holding the latest evaluated loan diagnostic
let currentLoanEvaluation = null;

// Benchmark interest rates per category
const LOAN_BASE_RATES = {
  home: 8.5,
  personal: 11.5,
  car: 9.25,
  education: 9.75,
  business: 13.0
};

/**
 * Adjust default rates hint in UI when loan type dropdown changes
 */
function adjustDefaultRates() {
  const loanType = document.getElementById('loan-type').value;
  const baseRate = LOAN_BASE_RATES[loanType] || 10.5;
  // Can be used for UI hints
}

/**
 * Toggle co-applicant income inputs
 */
function toggleCoapplicantInput() {
  const toggle = document.getElementById('coapplicant-toggle');
  const group = document.getElementById('coapplicant-input-group');
  if (toggle && group) {
    if (toggle.checked) {
      group.classList.remove('hidden');
    } else {
      group.classList.add('hidden');
      const coIncome = document.getElementById('coapplicant-income');
      if (coIncome) coIncome.value = '0';
    }
  }
}

/**
 * Pre-fill sample data for rapid testing during college viva/demo
 */
function fillLoanSampleData() {
  document.getElementById('applicant-name').value = 'Rahul Sharma';
  document.getElementById('applicant-email').value = 'rahul.sharma@example.com';
  document.getElementById('applicant-age').value = '29';
  document.getElementById('employment-type').value = 'salaried_corporate';
  document.getElementById('monthly-income').value = '85000';
  document.getElementById('existing-emis').value = '12000';
  document.getElementById('loan-type').value = 'personal';
  document.getElementById('loan-amount').value = '600000';
  document.getElementById('loan-tenure-years').value = '4';
  document.getElementById('applicant-cibil').value = '765';

  const coToggle = document.getElementById('coapplicant-toggle');
  if (coToggle) {
    coToggle.checked = false;
    toggleCoapplicantInput();
  }

  showToast('Sample financial profile loaded!', 'info');
}

/**
 * Reset loan application form to clean state
 */
function resetLoanForm() {
  document.getElementById('loan-form').reset();
  const coToggle = document.getElementById('coapplicant-toggle');
  if (coToggle) {
    coToggle.checked = false;
    toggleCoapplicantInput();
  }

  // Clear errors
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

  // Reset results card
  const placeholder = document.getElementById('results-placeholder');
  const content = document.getElementById('results-content');
  const badge = document.getElementById('badge-eval-status');
  if (placeholder) placeholder.classList.remove('hidden');
  if (content) content.classList.add('hidden');
  if (badge) {
    badge.textContent = 'Pending Submission';
    badge.className = 'badge-status';
  }
  currentLoanEvaluation = null;
  showToast('Form reset.', 'info');
}

/**
 * Validate input fields thoroughly using JavaScript form validation
 */
function validateLoanFormInputs(data) {
  let isValid = true;

  // Name validation
  const nameErr = document.getElementById('name-error');
  if (!data.name || data.name.trim().length < 2) {
    nameErr.textContent = 'Please enter a valid applicant name (min 2 chars).';
    isValid = false;
  } else {
    nameErr.textContent = '';
  }

  // Email validation
  const emailErr = document.getElementById('email-error');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    emailErr.textContent = 'Please enter a valid email address.';
    isValid = false;
  } else {
    emailErr.textContent = '';
  }

  // Age validation
  const ageErr = document.getElementById('age-error');
  if (isNaN(data.age) || data.age < 18 || data.age > 75) {
    ageErr.textContent = 'Applicant age must be between 18 and 75 years.';
    isValid = false;
  } else {
    ageErr.textContent = '';
  }

  // Income validation
  const incErr = document.getElementById('income-error');
  if (isNaN(data.monthlyIncome) || data.monthlyIncome < 5000) {
    incErr.textContent = 'Minimum monthly income required is 5,000.';
    isValid = false;
  } else {
    incErr.textContent = '';
  }

  // Loan amount validation
  const amtErr = document.getElementById('amount-error');
  if (isNaN(data.loanAmount) || data.loanAmount < 10000) {
    amtErr.textContent = 'Minimum loan amount is 10,000.';
    isValid = false;
  } else {
    amtErr.textContent = '';
  }

  // Credit score validation
  const cibilErr = document.getElementById('cibil-error');
  if (isNaN(data.creditScore) || data.creditScore < 300 || data.creditScore > 900) {
    cibilErr.textContent = 'Credit score must be between 300 and 900.';
    isValid = false;
  } else {
    cibilErr.textContent = '';
  }

  return isValid;
}

/**
 * Core BFSI Loan Eligibility Calculation Logic
 */
function evaluateLoanEligibility() {
  const currencySymbol = getCurrentCurrencySymbol();
  const currencyCode = getCurrentCurrencyCode();

  // Extract form values
  const hasCoapplicant = document.getElementById('coapplicant-toggle').checked;
  const coapplicantIncome = hasCoapplicant ? (parseFloat(document.getElementById('coapplicant-income').value) || 0) : 0;

  const data = {
    name: document.getElementById('applicant-name').value.trim(),
    email: document.getElementById('applicant-email').value.trim(),
    age: parseInt(document.getElementById('applicant-age').value, 10),
    employment: document.getElementById('employment-type').value,
    monthlyIncome: parseFloat(document.getElementById('monthly-income').value) || 0,
    coapplicantIncome: coapplicantIncome,
    totalIncome: (parseFloat(document.getElementById('monthly-income').value) || 0) + coapplicantIncome,
    existingEmis: parseFloat(document.getElementById('existing-emis').value) || 0,
    loanType: document.getElementById('loan-type').value,
    loanAmount: parseFloat(document.getElementById('loan-amount').value) || 0,
    tenureYears: parseInt(document.getElementById('loan-tenure-years').value, 10) || 5,
    creditScore: parseInt(document.getElementById('applicant-cibil').value, 10) || 750
  };

  // Run JavaScript validation
  if (!validateLoanFormInputs(data)) {
    showToast('Please fix the highlighted input errors before evaluating.', 'warning');
    return;
  }

  const tenureMonths = data.tenureYears * 12;

  // 1. Determine Interest Rate based on Loan Type + Credit Score Risk Adjustment
  let baseRate = LOAN_BASE_RATES[data.loanType] || 10.5;
  let rateAdjustment = 0;

  if (data.creditScore >= 800) {
    rateAdjustment = -0.5; // Prime concession
  } else if (data.creditScore >= 750) {
    rateAdjustment = 0.0;
  } else if (data.creditScore >= 700) {
    rateAdjustment = 0.85;
  } else if (data.creditScore >= 650) {
    rateAdjustment = 2.0;
  } else {
    rateAdjustment = 4.0; // High risk penalty
  }

  const effectiveAnnualRate = Math.max(5.0, baseRate + rateAdjustment);
  const monthlyRate = (effectiveAnnualRate / 100) / 12;

  // 2. Calculate Proposed Monthly EMI for Requested Loan
  // E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
  const proposedEmi = Math.round((data.loanAmount * monthlyRate * compoundFactor) / (compoundFactor - 1));

  // 3. Compute FOIR (Fixed Obligation to Income Ratio)
  // FOIR = (Existing EMIs + Proposed EMI) / Total Net Monthly Income
  const totalObligations = data.existingEmis + proposedEmi;
  const foirRatio = ((totalObligations / data.totalIncome) * 100);
  const roundedFoir = Math.round(foirRatio * 10) / 10;

  // 4. Maximum Allowable FOIR Benchmark
  let maxAllowableFoir = 0.50; // 50% baseline
  if (data.totalIncome >= 100000) maxAllowableFoir = 0.60;
  else if (data.totalIncome >= 60000) maxAllowableFoir = 0.55;
  if (hasCoapplicant) maxAllowableFoir += 0.05; // Co-borrower enhances risk tolerance

  // 5. Compute Maximum Eligible Loan Amount
  const maxAvailableEmiCapacity = Math.max(0, (data.totalIncome * maxAllowableFoir) - data.existingEmis);
  let maxEligibleLoan = 0;
  if (maxAvailableEmiCapacity > 0) {
    maxEligibleLoan = Math.round((maxAvailableEmiCapacity * (compoundFactor - 1)) / (monthlyRate * compoundFactor));
  }

  // 6. Multi-Factor Approval Probability Matrix (0 - 100%)
  let scorePillars = {
    creditScoreWeight: 0,
    foirWeight: 0,
    employmentWeight: 0,
    ageStabilityWeight: 0,
    coapplicantWeight: 0
  };

  // Credit Score Component (35% weight)
  if (data.creditScore >= 800) scorePillars.creditScoreWeight = 35;
  else if (data.creditScore >= 750) scorePillars.creditScoreWeight = 30;
  else if (data.creditScore >= 700) scorePillars.creditScoreWeight = 23;
  else if (data.creditScore >= 650) scorePillars.creditScoreWeight = 14;
  else scorePillars.creditScoreWeight = 5;

  // FOIR Component (30% weight)
  if (roundedFoir <= 35) scorePillars.foirWeight = 30;
  else if (roundedFoir <= 45) scorePillars.foirWeight = 26;
  else if (roundedFoir <= 55) scorePillars.foirWeight = 18;
  else if (roundedFoir <= 65) scorePillars.foirWeight = 8;
  else scorePillars.foirWeight = 0;

  // Employment Stability (15% weight)
  switch (data.employment) {
    case 'salaried_govt': scorePillars.employmentWeight = 15; break;
    case 'salaried_corporate': scorePillars.employmentWeight = 14; break;
    case 'self_employed_pro': scorePillars.employmentWeight = 12; break;
    case 'business_owner': scorePillars.employmentWeight = 10; break;
    case 'freelancer': scorePillars.employmentWeight = 7; break;
    default: scorePillars.employmentWeight = 10;
  }

  // Age Buffer to Retirement (10% weight)
  const ageAtMaturity = data.age + data.tenureYears;
  if (data.age >= 21 && ageAtMaturity <= 58) scorePillars.ageStabilityWeight = 10;
  else if (data.age >= 21 && ageAtMaturity <= 65) scorePillars.ageStabilityWeight = 8;
  else if (data.age < 21) scorePillars.ageStabilityWeight = 2; // Underwriting alert
  else scorePillars.ageStabilityWeight = 4;

  // Co-Applicant Buffer (10% weight)
  scorePillars.coapplicantWeight = hasCoapplicant ? 10 : 7;

  // Calculate total probability
  let approvalProbability = Math.round(
    scorePillars.creditScoreWeight +
    scorePillars.foirWeight +
    scorePillars.employmentWeight +
    scorePillars.ageStabilityWeight +
    scorePillars.coapplicantWeight
  );

  // Hard underwriting gating rules
  if (data.age < 21 || data.creditScore < 580 || roundedFoir > 75) {
    approvalProbability = Math.min(approvalProbability, 38);
  }

  // 7. Verdict Determination
  let status = 'APPROVED';
  let riskTier = 'Low Risk';
  let verdictClass = 'verdict-approved';
  let verdictTitle = 'LOAN APPROVED';
  let verdictSubtitle = 'Applicant displays high debt-servicing capacity and prime credit credentials.';

  if (approvalProbability >= 75 && roundedFoir <= 55 && data.creditScore >= 680 && data.age >= 21) {
    status = 'APPROVED';
    riskTier = 'Prime (Low Risk)';
    verdictClass = 'verdict-approved';
    verdictTitle = 'LOAN APPROVED';
    verdictSubtitle = 'Applicant qualifies for the requested loan with preferred interest terms!';
  } else if (approvalProbability >= 50 && roundedFoir <= 65 && data.creditScore >= 620) {
    status = 'CONDITIONAL';
    riskTier = 'Moderate Risk';
    verdictClass = 'verdict-conditional';
    verdictTitle = 'CONDITIONALLY APPROVED';
    verdictSubtitle = 'Eligible with terms: Consider reducing requested amount or extending tenure.';
  } else {
    status = 'REJECTED';
    riskTier = 'High Risk';
    verdictClass = 'verdict-rejected';
    verdictTitle = 'APPLICATION REJECTED / HIGH RISK';
    verdictSubtitle = 'High FOIR obligations or credit score thresholds exceeded current underwriting guidelines.';
  }

  // 8. Generate Decision Factors Audit
  const factors = [
    {
      title: 'Credit Score Benchmark',
      detail: `${data.creditScore} (${data.creditScore >= 750 ? 'Prime' : data.creditScore >= 670 ? 'Fair' : 'Subprime'})`,
      pass: data.creditScore >= 700 ? 'pass' : (data.creditScore >= 620 ? 'warning' : 'fail')
    },
    {
      title: 'FOIR / Debt Burden',
      detail: `${roundedFoir}% (Max Allowable: ${Math.round(maxAllowableFoir * 100)}%)`,
      pass: roundedFoir <= 50 ? 'pass' : (roundedFoir <= 60 ? 'warning' : 'fail')
    },
    {
      title: 'Applicant Age & Maturity',
      detail: `${data.age} yrs (Loan ends at ${ageAtMaturity} yrs)`,
      pass: (data.age >= 21 && ageAtMaturity <= 62) ? 'pass' : 'warning'
    },
    {
      title: 'Employment Stability',
      detail: formatEmploymentName(data.employment),
      pass: (data.employment.includes('salaried') || data.employment.includes('pro')) ? 'pass' : 'warning'
    },
    {
      title: 'Eligible Loan Cushion',
      detail: `${currencySymbol}${formatNumber(maxEligibleLoan)} (Req: ${currencySymbol}${formatNumber(data.loanAmount)})`,
      pass: maxEligibleLoan >= data.loanAmount ? 'pass' : 'warning'
    }
  ];

  // 9. Generate Actionable Financial Recommendations
  let recommendations = '';
  if (status === 'APPROVED') {
    recommendations = `Excellent financial profile! You are eligible for up to <strong>${currencySymbol}${formatNumber(maxEligibleLoan)}</strong>. To optimize costs, opt for an annual prepayment of 1 extra EMI each year to save substantial interest and shave up to 14 months off your loan tenure.`;
  } else if (status === 'CONDITIONAL') {
    const suggestedTenure = data.tenureYears + 2;
    recommendations = `To convert this conditional status into an immediate approval: (1) Extend your tenure to <strong>${suggestedTenure} years</strong> to bring your monthly EMI down, or (2) Add a co-borrower to raise your permissible FOIR limit, or (3) Pay off small credit card dues to lower your existing monthly obligations below ${currencySymbol}${formatNumber(data.existingEmis * 0.6)}.`;
  } else {
    recommendations = `Application requires financial repair prior to resubmission: (1) Your current FOIR is at <strong>${roundedFoir}%</strong> against a benchmark limit of 50%. Focus on clearing credit card balances or high-interest personal debts first. (2) If your credit score is below 680, follow our 60-day credit recovery plan in Module 2.`;
  }

  // Package evaluation object
  currentLoanEvaluation = {
    id: 'CP-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString(),
    name: data.name,
    email: data.email,
    age: data.age,
    employment: data.employment,
    monthlyIncome: data.monthlyIncome,
    coapplicantIncome: data.coapplicantIncome,
    totalIncome: data.totalIncome,
    existingEmis: data.existingEmis,
    loanType: data.loanType,
    requestedAmount: data.loanAmount,
    tenureYears: data.tenureYears,
    creditScore: data.creditScore,
    foirPercentage: roundedFoir,
    status: status,
    riskTier: riskTier,
    approvalProbability: approvalProbability,
    maxEligibleLoan: maxEligibleLoan,
    calculatedEmi: proposedEmi,
    effectiveRate: effectiveAnnualRate,
    factors: factors,
    recommendations: recommendations,
    currency: currencyCode,
    currencySymbol: currencySymbol
  };

  // Render to UI
  renderEligibilityResults(currentLoanEvaluation, verdictClass, verdictTitle, verdictSubtitle);

  // Trigger celebration confetti if approved with high score
  if (status === 'APPROVED' && approvalProbability >= 80 && typeof confetti === 'function') {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  }

  showToast(`Evaluation Complete: ${status}`, status === 'APPROVED' ? 'success' : (status === 'CONDITIONAL' ? 'warning' : 'error'));
}

/**
 * Render calculated outputs into the UI results card
 */
function renderEligibilityResults(evalData, verdictClass, title, subtitle) {
  const placeholder = document.getElementById('results-placeholder');
  const content = document.getElementById('results-content');
  const badge = document.getElementById('badge-eval-status');
  const banner = document.getElementById('verdict-banner');

  if (placeholder) placeholder.classList.add('hidden');
  if (content) content.classList.remove('hidden');

  // Update Status Badge
  if (badge) {
    badge.textContent = evalData.status;
    badge.className = `badge-status ${evalData.status === 'APPROVED' ? 'badge-pass' : (evalData.status === 'CONDITIONAL' ? 'badge-warning' : 'badge-fail')}`;
  }

  // Update Verdict Banner
  if (banner) {
    banner.className = `verdict-banner ${verdictClass}`;
    document.getElementById('verdict-title').textContent = title;
    document.getElementById('verdict-subtitle').textContent = subtitle;
    
    // Icon
    const iconWrap = document.getElementById('verdict-icon');
    if (iconWrap) {
      if (evalData.status === 'APPROVED') {
        iconWrap.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      } else if (evalData.status === 'CONDITIONAL') {
        iconWrap.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
      } else {
        iconWrap.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
      }
    }

    // Radial Progress Indicator
    document.getElementById('approval-percentage').textContent = `${evalData.approvalProbability}%`;
    const radialBar = document.getElementById('approval-radial-bar');
    if (radialBar) {
      // 264 is circumference of r=42 circle (2 * PI * 42 = 263.89)
      const offset = 264 - (264 * (evalData.approvalProbability / 100));
      radialBar.style.strokeDashoffset = offset;
      if (evalData.status === 'APPROVED') {
        radialBar.style.stroke = 'var(--accent-emerald)';
      } else if (evalData.status === 'CONDITIONAL') {
        radialBar.style.stroke = 'var(--accent-amber)';
      } else {
        radialBar.style.stroke = 'var(--accent-rose)';
      }
    }
  }

  // Key Metrics
  const curr = evalData.currencySymbol;
  document.getElementById('res-max-loan').textContent = `${curr}${formatNumber(evalData.maxEligibleLoan)}`;
  
  const diff = evalData.maxEligibleLoan - evalData.requestedAmount;
  const diffElem = document.getElementById('res-requested-diff');
  if (diff >= 0) {
    diffElem.textContent = `+${curr}${formatNumber(diff)} above requested`;
    diffElem.className = 'metric-sub text-emerald';
  } else {
    diffElem.textContent = `${curr}${formatNumber(Math.abs(diff))} below requested`;
    diffElem.className = 'metric-sub text-red';
  }

  document.getElementById('res-monthly-emi').textContent = `${curr}${formatNumber(evalData.calculatedEmi)}`;
  document.getElementById('res-interest-rate').textContent = `@ ${evalData.effectiveRate.toFixed(2)}% p.a.`;

  document.getElementById('res-foir').textContent = `${evalData.foirPercentage}%`;
  const foirStatus = document.getElementById('res-foir-status');
  if (evalData.foirPercentage <= 50) {
    foirStatus.textContent = 'Safe Margin (≤ 50%)';
    foirStatus.className = 'metric-sub text-emerald';
  } else if (evalData.foirPercentage <= 60) {
    foirStatus.textContent = 'Caution Zone (50 - 60%)';
    foirStatus.className = 'metric-sub text-amber';
  } else {
    foirStatus.textContent = 'Exceeds FOIR Cap (> 60%)';
    foirStatus.className = 'metric-sub text-red';
  }

  document.getElementById('res-risk-tier').textContent = evalData.riskTier;
  document.getElementById('res-credit-bracket').textContent = `CIBIL: ${evalData.creditScore}`;

  // Populate Factor Checklist
  const factorsList = document.getElementById('factors-list');
  if (factorsList && evalData.factors) {
    factorsList.innerHTML = evalData.factors.map(f => `
      <li class="factor-item">
        <span class="factor-name">
          <i class="fa-solid ${f.pass === 'pass' ? 'fa-check text-emerald' : (f.pass === 'warning' ? 'fa-triangle-exclamation text-amber' : 'fa-xmark text-red')}"></i>
          <span>${f.title}</span>
        </span>
        <span class="factor-badge ${f.pass === 'pass' ? 'badge-pass' : (f.pass === 'warning' ? 'badge-warning' : 'badge-fail')}">
          ${f.detail}
        </span>
      </li>
    `).join('');
  }

  // Populate Recommendation
  const recContent = document.getElementById('rec-content');
  if (recContent) {
    recContent.innerHTML = evalData.recommendations;
  }

  // Refresh 3D tilt bindings for newly shown result cards
  if (typeof init3DTilt === 'function') {
    setTimeout(init3DTilt, 60);
  }
}

/**
 * Save currently evaluated diagnostic to storage and sync to Google Sheets
 */
async function saveCurrentEvaluationToStorage() {
  if (!currentLoanEvaluation) {
    showToast('Run an eligibility check first before saving.', 'warning');
    return;
  }

  const saveBtn = document.getElementById('btn-save-sheets');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  }

  // 1. Save to local storage
  saveRecordToStorage(currentLoanEvaluation);

  // 2. Dispatch to Google Sheets
  const syncResult = await sendRecordToGoogleSheets(currentLoanEvaluation);

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Saved to Sheets & Cloud';
  }

  if (syncResult && syncResult.reason === 'NO_WEBHOOK') {
    showToast('Saved to local records! Connect your Google Sheet in Settings to auto-sync.', 'info');
  } else {
    showToast('Saved to local records and synced to Google Sheets!', 'success');
  }
}

/**
 * Send evaluated data over to Claude AI Advisor tab
 */
function sendToClaudeAdvisor() {
  if (!currentLoanEvaluation) {
    showToast('Run an eligibility check first.', 'warning');
    return;
  }
  switchTab('ai-advisor');
  // Pass to AI advisor prompt
  if (typeof loadLoanContextIntoAI === 'function') {
    loadLoanContextIntoAI(currentLoanEvaluation);
  }
}

/**
 * Print official loan diagnostic report
 */
function printEligibilityReport() {
  if (!currentLoanEvaluation) {
    showToast('No active evaluation to print.', 'warning');
    return;
  }
  window.print();
}

function formatEmploymentName(val) {
  switch (val) {
    case 'salaried_corporate': return 'Salaried (Corporate)';
    case 'salaried_govt': return 'Govt / PSU Employee';
    case 'self_employed_pro': return 'Self-Employed Pro';
    case 'business_owner': return 'Business Owner';
    case 'freelancer': return 'Freelancer';
    default: return 'Salaried';
  }
}
