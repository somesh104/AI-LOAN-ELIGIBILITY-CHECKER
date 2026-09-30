/**
 * CrediPulse AI — Advanced EMI Calculator & Amortization Engine
 * Real-time formula computation, Chart.js Donut visualization, prepayment simulator, and amortization export.
 */

let emiDonutChart = null;
let currentTenureUnit = 'years'; // 'years' or 'months'
let currentAmortizationView = 'yearly'; // 'yearly' or 'monthly'
let cachedAmortizationData = [];

/**
 * Initialize EMI Calculator on load
 */
function initEmiCalculator() {
  calculateEMI();
}

/**
 * Switch tenure between Years and Months
 */
function setTenureUnit(unit) {
  currentTenureUnit = unit;
  const btnYears = document.getElementById('unit-years');
  const btnMonths = document.getElementById('unit-months');
  const unitText = document.getElementById('tenure-unit-text');
  const tenureInput = document.getElementById('emi-tenure-input');
  const tenureSlider = document.getElementById('emi-tenure-slider');
  const sliderMarks = document.getElementById('tenure-slider-marks');

  if (unit === 'years') {
    btnYears.classList.add('active');
    btnMonths.classList.remove('active');
    unitText.textContent = 'Yrs';

    tenureSlider.min = '1';
    tenureSlider.max = '30';
    tenureSlider.step = '1';
    
    // Convert current months to years if needed
    let curVal = parseInt(tenureInput.value, 10);
    if (curVal > 30) curVal = Math.max(1, Math.round(curVal / 12));
    tenureInput.value = curVal;
    tenureSlider.value = curVal;

    sliderMarks.innerHTML = '<span>1 Yr</span><span>5 Yrs</span><span>10 Yrs</span><span>20 Yrs</span><span>30 Yrs</span>';
  } else {
    btnMonths.classList.add('active');
    btnYears.classList.remove('active');
    unitText.textContent = 'Mo';

    tenureSlider.min = '12';
    tenureSlider.max = '360';
    tenureSlider.step = '6';

    // Convert current years to months if needed
    let curVal = parseInt(tenureInput.value, 10);
    if (curVal <= 30) curVal = curVal * 12;
    tenureInput.value = curVal;
    tenureSlider.value = curVal;

    sliderMarks.innerHTML = '<span>12 Mo</span><span>60 Mo</span><span>120 Mo</span><span>240 Mo</span><span>360 Mo</span>';
  }

  calculateEMI();
}

/**
 * Sync values from sliders to number inputs
 */
function syncEMIFromSlider(param) {
  if (param === 'principal') {
    document.getElementById('emi-principal-input').value = document.getElementById('emi-principal-slider').value;
  } else if (param === 'rate') {
    document.getElementById('emi-rate-input').value = document.getElementById('emi-rate-slider').value;
  } else if (param === 'tenure') {
    document.getElementById('emi-tenure-input').value = document.getElementById('emi-tenure-slider').value;
  }
  calculateEMI();
}

/**
 * Sync values from number inputs to sliders
 */
function syncEMIFromInput(param) {
  if (param === 'principal') {
    const val = parseFloat(document.getElementById('emi-principal-input').value) || 0;
    document.getElementById('emi-principal-slider').value = Math.min(10000000, Math.max(50000, val));
  } else if (param === 'rate') {
    const val = parseFloat(document.getElementById('emi-rate-input').value) || 0;
    document.getElementById('emi-rate-slider').value = Math.min(25, Math.max(4, val));
  } else if (param === 'tenure') {
    const val = parseFloat(document.getElementById('emi-tenure-input').value) || 1;
    document.getElementById('emi-tenure-slider').value = val;
  }
  calculateEMI();
}

/**
 * Toggle Prepayment Accordion
 */
function togglePrepaymentBox() {
  const content = document.getElementById('prepayment-content');
  const arrow = document.getElementById('prepayment-arrow');
  if (content) {
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
      content.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
      content.classList.add('hidden');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
  }
}

/**
 * Core EMI Calculation Engine
 */
function calculateEMI() {
  const currencySymbol = getCurrentCurrencySymbol();

  const principal = parseFloat(document.getElementById('emi-principal-input').value) || 0;
  const annualRate = parseFloat(document.getElementById('emi-rate-input').value) || 0;
  let tenureVal = parseInt(document.getElementById('emi-tenure-input').value, 10) || 1;

  const totalMonths = currentTenureUnit === 'years' ? (tenureVal * 12) : tenureVal;

  if (principal <= 0 || annualRate <= 0 || totalMonths <= 0) {
    return;
  }

  // Monthly rate r = (annualRate / 100) / 12
  const monthlyRate = (annualRate / 100) / 12;

  // Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
  const roundedEmi = Math.round(emi);

  const totalPayable = Math.round(emi * totalMonths);
  const totalInterest = Math.max(0, totalPayable - Math.round(principal));

  const principalPct = ((principal / totalPayable) * 100).toFixed(1);
  const interestPct = ((totalInterest / totalPayable) * 100).toFixed(1);

  // Update UI Displays
  document.getElementById('emi-amount-display').textContent = `${currencySymbol}${formatNumber(roundedEmi)}`;
  document.getElementById('emi-tenure-months-display').textContent = `Payable for ${totalMonths} monthly installments`;
  document.getElementById('emi-principal-display').textContent = `${currencySymbol}${formatNumber(principal)}`;
  document.getElementById('emi-principal-pct').textContent = `${principalPct}% of total`;
  document.getElementById('emi-interest-display').textContent = `${currencySymbol}${formatNumber(totalInterest)}`;
  document.getElementById('emi-interest-pct').textContent = `${interestPct}% of total`;
  document.getElementById('emi-total-display').textContent = `${currencySymbol}${formatNumber(totalPayable)}`;

  // Calculate Payoff Date
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + totalMonths);
  const payoffStr = payoffDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  document.getElementById('emi-payoff-date').textContent = `Estimated Debt-Free: ${payoffStr}`;

  // Update or render Chart.js donut chart
  renderEmiDonutChart(principal, totalInterest);

  // Calculate Prepayment impact if extra payment entered
  const extraEmi = parseFloat(document.getElementById('extra-emi-input').value) || 0;
  computePrepaymentImpact(principal, monthlyRate, roundedEmi, totalMonths, totalInterest, extraEmi, currencySymbol);

  // Generate Amortization Schedule
  generateAmortizationSchedule(principal, monthlyRate, roundedEmi, totalMonths);
}

/**
 * Render Chart.js Donut Chart with Dark Glassmorphism Styling
 */
function renderEmiDonutChart(principal, interest) {
  const canvas = document.getElementById('emi-donut-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const data = {
    labels: ['Principal Loan', 'Total Interest'],
    datasets: [{
      data: [principal, interest],
      backgroundColor: ['#06b6d4', '#f59e0b'],
      borderColor: ['#082f49', '#451a03'],
      borderWidth: 2,
      hoverOffset: 6
    }]
  };

  const config = {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const symbol = getCurrentCurrencySymbol();
              return ` ${context.label}: ${symbol}${formatNumber(context.raw)}`;
            }
          }
        }
      }
    }
  };

  if (emiDonutChart) {
    emiDonutChart.data = data;
    emiDonutChart.update();
  } else {
    emiDonutChart = new Chart(canvas, config);
  }
}

/**
 * Calculate prepayment benefits: months saved & interest saved
 */
function computePrepaymentImpact(principal, monthlyRate, regularEmi, totalMonths, standardTotalInterest, extraEmi, currencySymbol) {
  const summaryBox = document.getElementById('prepayment-benefit-summary');
  if (!summaryBox) return;

  if (extraEmi <= 0) {
    summaryBox.classList.add('hidden');
    return;
  }

  summaryBox.classList.remove('hidden');

  let balance = principal;
  let monthsWithExtra = 0;
  let totalInterestWithExtra = 0;
  const effectiveMonthlyPay = regularEmi + extraEmi;

  while (balance > 0 && monthsWithExtra < 1200) {
    monthsWithExtra++;
    const interestForMonth = balance * monthlyRate;
    totalInterestWithExtra += interestForMonth;
    const principalPaid = effectiveMonthlyPay - interestForMonth;

    if (principalPaid >= balance) {
      balance = 0;
      break;
    } else {
      balance -= principalPaid;
    }
  }

  const monthsSaved = Math.max(0, totalMonths - monthsWithExtra);
  const interestSaved = Math.max(0, Math.round(standardTotalInterest - totalInterestWithExtra));

  document.getElementById('prepay-saved-interest').textContent = `${currencySymbol}${formatNumber(interestSaved)}`;
  document.getElementById('prepay-saved-tenure').textContent = `${monthsSaved} months (${(monthsSaved / 12).toFixed(1)} yrs)`;
}

/**
 * Generate monthly and yearly amortization schedules
 */
function generateAmortizationSchedule(principal, monthlyRate, emi, totalMonths) {
  cachedAmortizationData = [];
  let balance = principal;
  const currencySymbol = getCurrentCurrencySymbol();

  for (let month = 1; month <= totalMonths; month++) {
    const openingBalance = balance;
    const interestForMonth = Math.round(balance * monthlyRate);
    let principalForMonth = emi - interestForMonth;

    if (month === totalMonths || principalForMonth > balance) {
      principalForMonth = balance;
      balance = 0;
    } else {
      balance -= principalForMonth;
    }

    cachedAmortizationData.push({
      month: month,
      opening: openingBalance,
      emi: emi,
      principal: principalForMonth,
      interest: interestForMonth,
      closing: Math.max(0, balance)
    });

    if (balance <= 0) break;
  }

  renderAmortizationTable();
}

/**
 * Switch table between Yearly and Monthly views
 */
function toggleAmortizationView(view) {
  currentAmortizationView = view;
  const yearlyBtn = document.getElementById('view-yearly-btn');
  const monthlyBtn = document.getElementById('view-monthly-btn');

  if (view === 'yearly') {
    yearlyBtn.classList.add('active');
    monthlyBtn.classList.remove('active');
  } else {
    monthlyBtn.classList.add('active');
    yearlyBtn.classList.remove('active');
  }

  renderAmortizationTable();
}

/**
 * Render Amortization Table into the DOM
 */
function renderAmortizationTable() {
  const tbody = document.getElementById('amortization-tbody');
  if (!tbody || cachedAmortizationData.length === 0) return;

  const curr = getCurrentCurrencySymbol();

  if (currentAmortizationView === 'monthly') {
    // Render month-by-month rows
    tbody.innerHTML = cachedAmortizationData.map(row => `
      <tr>
        <td>Month ${row.month}</td>
        <td>${curr}${formatNumber(row.opening)}</td>
        <td class="text-cyan font-bold">${curr}${formatNumber(row.emi)}</td>
        <td class="text-emerald">${curr}${formatNumber(row.principal)}</td>
        <td class="text-amber">${curr}${formatNumber(row.interest)}</td>
        <td>${curr}${formatNumber(row.closing)}</td>
      </tr>
    `).join('');
  } else {
    // Render yearly aggregated rows
    const yearlyRows = [];
    let currentYear = 1;
    let yearOpening = cachedAmortizationData[0].opening;
    let yearEmiSum = 0;
    let yearPrincipalSum = 0;
    let yearInterestSum = 0;
    let yearClosing = 0;

    cachedAmortizationData.forEach((row, idx) => {
      yearEmiSum += row.emi;
      yearPrincipalSum += row.principal;
      yearInterestSum += row.interest;
      yearClosing = row.closing;

      const isYearEnd = (row.month % 12 === 0) || (idx === cachedAmortizationData.length - 1);
      if (isYearEnd) {
        yearlyRows.push({
          year: currentYear,
          opening: yearOpening,
          emi: yearEmiSum,
          principal: yearPrincipalSum,
          interest: yearInterestSum,
          closing: yearClosing
        });

        currentYear++;
        if (idx + 1 < cachedAmortizationData.length) {
          yearOpening = cachedAmortizationData[idx + 1].opening;
          yearEmiSum = 0;
          yearPrincipalSum = 0;
          yearInterestSum = 0;
        }
      }
    });

    tbody.innerHTML = yearlyRows.map(row => `
      <tr>
        <td><strong>Year ${row.year}</strong></td>
        <td>${curr}${formatNumber(row.opening)}</td>
        <td class="text-cyan font-bold">${curr}${formatNumber(row.emi)}</td>
        <td class="text-emerald font-semibold">${curr}${formatNumber(row.principal)}</td>
        <td class="text-amber">${curr}${formatNumber(row.interest)}</td>
        <td><strong>${curr}${formatNumber(row.closing)}</strong></td>
      </tr>
    `).join('');
  }
}

/**
 * Export complete amortization schedule as downloadable CSV
 */
function exportAmortizationCSV() {
  if (cachedAmortizationData.length === 0) {
    showToast('Calculate EMI first before exporting schedule.', 'warning');
    return;
  }

  const headers = ['Month', 'Opening Balance', 'Monthly EMI', 'Principal Component', 'Interest Component', 'Closing Balance'];
  const rows = cachedAmortizationData.map(r => [
    r.month,
    r.opening,
    r.emi,
    r.principal,
    r.interest,
    r.closing
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Loan_Amortization_Schedule_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Amortization schedule exported to CSV!', 'success');
}
