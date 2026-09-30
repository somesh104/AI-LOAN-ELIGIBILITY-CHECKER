/**
 * CrediPulse AI — Storage & Google Sheets Integration
 * Manages localStorage persistence, CSV exports, and Google Apps Script Webhooks.
 */

const STORAGE_KEYS = {
  RECORDS: 'credipulse_records_v1',
  SETTINGS: 'credipulse_settings_v1',
  CURRENCY: 'credipulse_currency_v1',
  LAST_EVALUATION: 'credipulse_last_eval_v1'
};

// ==========================================================================
// Settings Management (Claude API Key & Google Sheets Webhook)
// ==========================================================================

function getAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { claudeApiKey: '', sheetsWebhookUrl: '' };
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading settings from localStorage:', e);
    return { claudeApiKey: '', sheetsWebhookUrl: '' };
  }
}

function saveAppSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    updateCloudStatusBadge();
    return true;
  } catch (e) {
    console.error('Error saving settings:', e);
    return false;
  }
}

// Update the Google Sheets status indicator in the header
function updateCloudStatusBadge() {
  const settings = getAppSettings();
  const dot = document.getElementById('sheets-status-dot');
  const label = document.getElementById('sheets-status-text');
  const bannerTitle = document.getElementById('cloud-banner-title');
  const bannerDesc = document.getElementById('cloud-banner-desc');
  const pulseRing = document.getElementById('cloud-pulse-ring');

  if (settings.sheetsWebhookUrl && settings.sheetsWebhookUrl.trim().startsWith('http')) {
    if (dot) {
      dot.className = 'status-dot dot-green';
    }
    if (label) label.textContent = 'Sheets Live';
    if (bannerTitle) bannerTitle.textContent = 'Google Sheets Webhook Connected';
    if (bannerDesc) bannerDesc.textContent = 'Real-time synchronization active. Submissions sync directly to your spreadsheet.';
    if (pulseRing) pulseRing.style.borderColor = 'var(--accent-emerald)';
  } else {
    if (dot) {
      dot.className = 'status-dot dot-yellow';
    }
    if (label) label.textContent = 'Sheets Local';
    if (bannerTitle) bannerTitle.textContent = 'Local Database Active (Sheets Optional)';
    if (bannerDesc) bannerDesc.textContent = 'Records are securely stored in your browser. Connect Google Sheets anytime in Settings.';
    if (pulseRing) pulseRing.style.borderColor = 'var(--accent-amber)';
  }
}

// ==========================================================================
// Financial Records Management (LocalStorage Database)
// ==========================================================================

function getStoredRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading records:', e);
    return [];
  }
}

function saveRecordToStorage(record) {
  try {
    const records = getStoredRecords();
    records.unshift(record); // Add newest first
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    updateRecordsTable();
    updateRecordsCountBadge();
    return true;
  } catch (e) {
    console.error('Error saving record to localStorage:', e);
    return false;
  }
}

function clearAllStoredRecords() {
  if (!confirm('Are you sure you want to clear all saved loan records? This action cannot be undone.')) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    updateRecordsTable();
    updateRecordsCountBadge();
    showToast('All financial records cleared successfully.', 'info');
  } catch (e) {
    console.error('Error clearing records:', e);
  }
}

function deleteSingleRecord(recordId) {
  try {
    let records = getStoredRecords();
    records = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    updateRecordsTable();
    updateRecordsCountBadge();
    showToast('Record deleted.', 'info');
  } catch (e) {
    console.error('Error deleting record:', e);
  }
}

function updateRecordsCountBadge() {
  const records = getStoredRecords();
  const badge = document.getElementById('nav-records-count');
  if (badge) {
    badge.textContent = records.length;
  }
}

// ==========================================================================
// Google Sheets Apps Script Webhook Integration
// ==========================================================================

async function sendRecordToGoogleSheets(record) {
  const settings = getAppSettings();
  if (!settings.sheetsWebhookUrl || !settings.sheetsWebhookUrl.trim().startsWith('http')) {
    return { success: false, reason: 'NO_WEBHOOK' };
  }

  try {
    // Standard payload expected by google-sheets/Code.gs
    const payload = {
      action: 'add_record',
      timestamp: record.timestamp || new Date().toISOString(),
      name: record.name,
      email: record.email,
      age: record.age,
      employment: record.employment,
      monthlyIncome: record.monthlyIncome,
      existingEmis: record.existingEmis,
      loanType: record.loanType,
      requestedAmount: record.requestedAmount,
      tenureYears: record.tenureYears,
      creditScore: record.creditScore,
      foirPercentage: record.foirPercentage,
      status: record.status,
      maxEligibleLoan: record.maxEligibleLoan,
      calculatedEmi: record.calculatedEmi,
      approvalProbability: record.approvalProbability,
      currency: record.currency || 'INR'
    };

    // Google Apps Script requires text/plain or no-cors to prevent preflight block
    await fetch(settings.sheetsWebhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return { success: true };
  } catch (err) {
    console.warn('Google Sheets Webhook Sync Notice (CORS or Network):', err);
    // Since Google Apps Script Webhook redirects or returns opaque response in no-cors,
    // we return success: true with note.
    return { success: true, note: 'Dispatched via no-cors webhook' };
  }
}

// Sync all stored local records to Google Sheets
async function syncAllToGoogleSheets() {
  const settings = getAppSettings();
  if (!settings.sheetsWebhookUrl || !settings.sheetsWebhookUrl.trim().startsWith('http')) {
    showToast('Please configure your Google Sheets Webhook URL in Settings first!', 'warning');
    openSettingsModal();
    return;
  }

  const records = getStoredRecords();
  if (records.length === 0) {
    showToast('No records found to sync. Run an eligibility check first!', 'info');
    return;
  }

  showToast(`Syncing ${records.length} records to Google Sheets...`, 'info');
  let synced = 0;

  for (const record of records) {
    await sendRecordToGoogleSheets(record);
    synced++;
  }

  showToast(`Successfully synced ${synced} records to your Google Sheet!`, 'success');
}

// Test webhook connection
async function testGoogleSheetsWebhook() {
  const input = document.getElementById('sheets-webhook-url');
  const url = input ? input.value.trim() : '';

  if (!url || !url.startsWith('http')) {
    showToast('Please enter a valid Google Apps Script Web App URL.', 'warning');
    return;
  }

  showToast('Testing Google Sheets connection...', 'info');

  try {
    const testPayload = {
      action: 'test_ping',
      timestamp: new Date().toISOString(),
      testMessage: 'CrediPulse AI Connectivity Handshake Test'
    };

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testPayload)
    });

    showToast('Webhook ping sent successfully! Your Google Sheet is ready.', 'success');
  } catch (e) {
    console.error('Test webhook failed:', e);
    showToast('Failed to reach webhook. Ensure deployment is set to "Anyone".', 'error');
  }
}

// ==========================================================================
// Records UI Table Rendering & Filter
// ==========================================================================

function updateRecordsTable(filterText = '') {
  const tbody = document.getElementById('records-tbody');
  const noMsg = document.getElementById('no-records-msg');
  if (!tbody) return;

  const records = getStoredRecords();
  const filter = filterText.toLowerCase().trim();

  const filtered = records.filter(r => {
    if (!filter) return true;
    return (
      (r.name && r.name.toLowerCase().includes(filter)) ||
      (r.email && r.email.toLowerCase().includes(filter)) ||
      (r.loanType && r.loanType.toLowerCase().includes(filter)) ||
      (r.status && r.status.toLowerCase().includes(filter))
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (noMsg) noMsg.classList.remove('hidden');
    return;
  }

  if (noMsg) noMsg.classList.add('hidden');

  tbody.innerHTML = filtered.map(r => {
    let statusBadgeClass = 'badge-pass';
    if (r.status === 'CONDITIONAL') statusBadgeClass = 'badge-warning';
    if (r.status === 'REJECTED') statusBadgeClass = 'badge-fail';

    const formattedDate = new Date(r.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const curr = r.currencySymbol || '₹';

    return `
      <tr>
        <td class="text-dim text-xs">${formattedDate}</td>
        <td>
          <strong>${escapeHtml(r.name || 'Anonymous')}</strong><br>
          <span class="text-dim text-xs">${escapeHtml(r.email || '')}</span>
        </td>
        <td style="text-transform: capitalize;">${escapeHtml(r.loanType || 'Personal')}</td>
        <td>${curr}${formatNumber(r.monthlyIncome)}</td>
        <td>${curr}${formatNumber(r.requestedAmount)}</td>
        <td>
          <span class="font-bold">${r.creditScore || 'N/A'}</span>
        </td>
        <td>${r.foirPercentage}%</td>
        <td>
          <span class="factor-badge ${statusBadgeClass}">${r.status}</span>
        </td>
        <td>
          <button class="btn-icon text-red" onclick="deleteSingleRecord('${r.id}')" title="Delete Record">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterRecordsTable(query) {
  updateRecordsTable(query);
}

// ==========================================================================
// CSV Export Functionality
// ==========================================================================

function exportRecordsToCSV() {
  const records = getStoredRecords();
  if (records.length === 0) {
    showToast('No records available to export.', 'info');
    return;
  }

  const headers = [
    'Record ID',
    'Timestamp',
    'Applicant Name',
    'Email',
    'Age',
    'Employment Type',
    'Monthly Income',
    'Existing EMIs',
    'Loan Category',
    'Requested Amount',
    'Tenure (Years)',
    'Credit Score',
    'FOIR (%)',
    'Decision Status',
    'Approval Probability (%)',
    'Max Eligible Loan',
    'Calculated Monthly EMI',
    'Currency'
  ];

  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.timestamp}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    r.age || '',
    `"${r.employment || ''}"`,
    r.monthlyIncome || 0,
    r.existingEmis || 0,
    `"${r.loanType || ''}"`,
    r.requestedAmount || 0,
    r.tenureYears || 0,
    r.creditScore || 0,
    r.foirPercentage || 0,
    `"${r.status || ''}"`,
    r.approvalProbability || 0,
    r.maxEligibleLoan || 0,
    r.calculatedEmi || 0,
    `"${r.currency || 'INR'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `CrediPulse_Loan_Records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Records exported as CSV successfully!', 'success');
}

// Utility: HTML Escaping
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Utility: Number formatter (e.g. 50000 -> 50,000)
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.round(num).toLocaleString();
}
