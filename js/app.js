/**
 * CrediPulse AI — Master Application Controller
 * Handles navigation tabs, currency conversions, settings modal, toast notifications, and event listeners.
 */

// Global Currency Settings & Rates relative to INR base
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1.0, code: 'INR' },
  USD: { symbol: '$', rate: 0.012, code: 'USD' },
  EUR: { symbol: '€', rate: 0.011, code: 'EUR' },
  GBP: { symbol: '£', rate: 0.0095, code: 'GBP' }
};

let currentCurrency = 'INR';

/**
 * Switch Active Application Module Tab
 */
function switchTab(tabId) {
  // Update nav tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update tab content panes
  const contentPanes = document.querySelectorAll('.tab-content');
  contentPanes.forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Close mobile nav menu if open
  const mainNav = document.getElementById('main-nav');
  if (mainNav && mainNav.classList.contains('mobile-open')) {
    mainNav.classList.remove('mobile-open');
  }

  // Refresh tab-specific renderings if needed
  if (tabId === 'credit-analyzer') {
    if (typeof updateCreditAnalyzerDisplay === 'function') {
      updateCreditAnalyzerDisplay(currentCreditScore || 750);
    }
  } else if (tabId === 'emi-calculator') {
    if (typeof calculateEMI === 'function') {
      calculateEMI();
    }
  } else if (tabId === 'records-manager') {
    if (typeof updateRecordsTable === 'function') {
      updateRecordsTable();
    }
  }

  // Refresh 3D Tilt bindings for newly displayed cards
  if (typeof init3DTilt === 'function') {
    setTimeout(init3DTilt, 60);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Toggle Mobile Navigation Menu
 */
function toggleMobileMenu() {
  const mainNav = document.getElementById('main-nav');
  const icon = document.getElementById('menu-icon');
  if (mainNav) {
    mainNav.classList.toggle('mobile-open');
    if (icon) {
      if (mainNav.classList.contains('mobile-open')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    }
  }
}

/**
 * Handle Currency Change
 */
function changeCurrency(newCurrency) {
  if (!CURRENCY_CONFIG[newCurrency]) return;
  currentCurrency = newCurrency;
  localStorage.setItem(STORAGE_KEYS.CURRENCY, newCurrency);

  const symbol = CURRENCY_CONFIG[newCurrency].symbol;

  // Update all currency labels across the app
  document.querySelectorAll('.currency-label').forEach(el => {
    el.textContent = symbol;
  });

  // Re-run calculations if results are currently visible
  if (currentLoanEvaluation && typeof evaluateLoanEligibility === 'function') {
    evaluateLoanEligibility();
  }
  if (typeof calculateEMI === 'function') {
    calculateEMI();
  }

  showToast(`Currency switched to ${newCurrency} (${symbol})`, 'info');
}

function getCurrentCurrencySymbol() {
  return CURRENCY_CONFIG[currentCurrency]?.symbol || '₹';
}

function getCurrentCurrencyCode() {
  return currentCurrency;
}

// ==========================================================================
// Settings Modal Handlers
// ==========================================================================

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;

  const settings = getAppSettings();
  const apiKeyInput = document.getElementById('claude-api-key');
  const webhookInput = document.getElementById('sheets-webhook-url');

  if (apiKeyInput) apiKeyInput.value = settings.claudeApiKey || '';
  if (webhookInput) webhookInput.value = settings.sheetsWebhookUrl || '';

  modal.classList.remove('hidden');
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.add('hidden');
}

function saveSettings() {
  const apiKey = document.getElementById('claude-api-key').value.trim();
  const webhookUrl = document.getElementById('sheets-webhook-url').value.trim();

  const success = saveAppSettings({
    claudeApiKey: apiKey,
    sheetsWebhookUrl: webhookUrl
  });

  if (success) {
    closeSettingsModal();
    showToast('Settings saved successfully!', 'success');
    
    // Update AI engine status label
    const aiStatus = document.getElementById('ai-engine-status');
    if (aiStatus) {
      if (apiKey && apiKey.startsWith('sk-ant')) {
        aiStatus.innerHTML = '<i class="fa-solid fa-bolt text-cyan"></i> Live Claude 3.5 Sonnet Connected';
      } else {
        aiStatus.innerHTML = '<i class="fa-solid fa-circle-check text-emerald"></i> Anthropic Claude & BFSI Heuristic Ready';
      }
    }
  } else {
    showToast('Failed to save settings.', 'error');
  }
}

// ==========================================================================
// Google Sheets Guide Modal Handlers
// ==========================================================================

function openSheetsGuideModal() {
  const guideModal = document.getElementById('sheets-guide-modal');
  if (guideModal) guideModal.classList.remove('hidden');
}

function closeSheetsGuideModal() {
  const guideModal = document.getElementById('sheets-guide-modal');
  if (guideModal) guideModal.classList.add('hidden');
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }
}

// ==========================================================================
// Toast Notifications System
// ==========================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info text-cyan';
  if (type === 'success') icon = 'fa-circle-check text-emerald';
  if (type === 'error') icon = 'fa-circle-xmark text-red';
  if (type === 'warning') icon = 'fa-triangle-exclamation text-amber';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// ==========================================================================
// Application Bootstrap on DOMContentLoaded
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Restore saved currency
  const savedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
  if (savedCurrency && CURRENCY_CONFIG[savedCurrency]) {
    currentCurrency = savedCurrency;
    const picker = document.getElementById('currency-select');
    if (picker) picker.value = savedCurrency;
    document.querySelectorAll('.currency-label').forEach(el => {
      el.textContent = CURRENCY_CONFIG[savedCurrency].symbol;
    });
  }

  // 2. Initialize UI Statuses
  updateCloudStatusBadge();
  updateRecordsCountBadge();
  updateRecordsTable();

  // 3. Initialize Credit Analyzer & EMI Calculator
  if (typeof initCreditAnalyzer === 'function') initCreditAnalyzer();
  if (typeof initEmiCalculator === 'function') initEmiCalculator();

  // 4. Update AI engine status label
  const settings = getAppSettings();
  const aiStatus = document.getElementById('ai-engine-status');
  if (aiStatus && settings.claudeApiKey && settings.claudeApiKey.startsWith('sk-ant')) {
    aiStatus.innerHTML = '<i class="fa-solid fa-bolt text-cyan"></i> Live Claude 3.5 Sonnet Connected';
  }

  // 5. Initialize 3D WebGL Holographic Scene & 3D Tilt Engine
  if (typeof initThreeScene === 'function') initThreeScene();
  if (typeof init3DTilt === 'function') init3DTilt();

  console.log('CrediPulse AI — 3D Holographic Platform successfully initialized.');
});
