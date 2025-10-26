// Decision History - stored in memory (simulating localStorage)
const decisionHistory = {
  decisions: []
};

// Application state - stored in memory
const appState = {
  mode: 'quick', // 'quick' or 'detailed'
  currentStep: 1,
  quickAssessment: {
    decisionWhat: '',
    decisionOutcome: '',
    totalBudget: 0,
    filter3Uses: '',
    filter2Benefits: '',
    filter1Regret: '',
    totalCost: 0,
    monthlyRecurring: 0,
    yearlyMaintenance: 0,
    yearlyUses: 0,
    costPerUse: 0,
    year1Cost: 0,
    year3Cost: 0,
    cpuAcceptable: '',
    goodChance: 0,
    goodValue: 0,
    badChance: 0,
    badCost: 0,
    expectedValue: 0,
    regret10Days: '',
    regret10Months: '',
    regret10Years: '',
    reversibilityOptions: [],
    biases: [],
    opportunityCost: '',
    alternativeBetter: '',
    boughtSimilar: '',
    similarItem: '',
    historicalUsage: 0,
    stillUsing: '',
    buyAgain: '',
    budgetPercent: 0,
    absorbLoss: '',
    resaleValue: 0,
    sunkCostRisk: 0
  },
  detailedAnalysis: {
    benefits: [],
    costs: [],
    costPerUseSnap: {
      realisticUses: 5,
      totalCost: 0,
      costPerUse: 0,
      verdict: ''
    },
    expectedValue: {
      successChance: 30,
      benefitIfSuccess: 0,
      netLossIfFailure: 0,
      calculatedEV: 0,
      verdict: ''
    },
    evThreshold: {
      thresholdPercent: 0,
      meetsThreshold: false,
      verdict: ''
    },
    baseRate: 50,
    motivationAdj: 0,
    overlapAdj: 0,
    timeAdj: 0,
    trackAdj: 0,
    successProbability: 50,
    sensitivityAnalysis: {
      calculated: false,
      breakEvenRate: 0,
      safetyMargin: 0
    },
    riskProfile: null
  },
  comparisonMode: {
    alternatives: []
  },
  results: {
    score: 0,
    recommendation: '',
    breakdown: {},
    insights: {}
  },
  currentDecisionId: null
};

// Load history on startup
function loadHistory() {
  try {
    const stored = window.decisionHistory || { decisions: [] };
    decisionHistory.decisions = stored.decisions || [];
  } catch (e) {
    console.log('History loading skipped (storage not available)');
    decisionHistory.decisions = [];
  }
}

// Save history
function saveHistory() {
  try {
    window.decisionHistory = decisionHistory;
  } catch (e) {
    console.log('History saving skipped (storage not available)');
  }
}

// Save decision to history
function saveDecisionToHistory() {
  const { score, recommendation, breakdown } = appState.results;
  const qa = appState.quickAssessment;
  
  const decision = {
    id: `decision_${Date.now()}`,
    timestamp: new Date().toISOString(),
    title: qa.decisionWhat || 'Unnamed Decision',
    mode: appState.mode,
    score: score,
    recommendation: recommendation.badge,
    inputs: { ...qa },
    breakdown: breakdown,
    alternatives: appState.comparisonMode.alternatives.length > 0 ? appState.comparisonMode.alternatives : null,
    actualOutcome: null,
    outcomeDate: null,
    wasCorrect: null,
    notes: ''
  };
  
  decisionHistory.decisions.unshift(decision);
  appState.currentDecisionId = decision.id;
  saveHistory();
  
  showToast('✅ Decision saved to history');
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--color-primary);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInUp 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Scoring rules
const SCORING = {
  three_two_one_filter_passed: 15,
  cost_per_use_acceptable: 20,
  positive_expected_value: 25,
  low_regret: 15,
  minimal_biases: 15,
  no_better_alternative: 10
};

const THRESHOLDS = {
  STRONG_GO: { min: 80, max: 100, badge: '✅ STRONG GO', text: 'This purchase passes rational analysis with high confidence', class: 'badge-strong-go' },
  GO: { min: 75, max: 79, badge: '✅ GO', text: 'Proceed with purchase', class: 'badge-go' },
  WAIT_48H: { min: 55, max: 74, badge: '⏳ WAIT 48H', text: 'Delay 48-72 hours, test if possible', class: 'badge-wait-48h' },
  WAIT_1WEEK: { min: 40, max: 54, badge: '⏳ WAIT 1 WEEK', text: 'Delay one week before deciding', class: 'badge-wait-1week' },
  NO: { min: 0, max: 39, badge: '❌ NO', text: 'Skip this purchase', class: 'badge-no' }
};

// Tab-based navigation
function startAssessment() {
  resetAppState();
  document.getElementById('tab-bar').style.display = 'block';
  initializeAllTabs();
  goToTab('basic-info');
  showToast('✅ Assessment started! Complete each tab.');
}

function resetAppState() {
  appState.quickAssessment = {
    decisionWhat: '',
    decisionOutcome: '',
    totalBudget: 0,
    filter3Uses: '',
    filter2Benefits: '',
    filter1Regret: '',
    totalCost: 0,
    monthlyRecurring: 0,
    yearlyMaintenance: 0,
    yearlyUses: 0,
    costPerUse: 0,
    year1Cost: 0,
    year3Cost: 0,
    cpuAcceptable: '',
    goodChance: 0,
    goodValue: 0,
    badChance: 0,
    badCost: 0,
    expectedValue: 0,
    regret10Days: '',
    regret10Months: '',
    regret10Years: '',
    reversibilityOptions: [],
    biases: [],
    opportunityCost: '',
    alternativeBetter: '',
    boughtSimilar: '',
    similarItem: '',
    historicalUsage: 0,
    stillUsing: '',
    buyAgain: '',
    budgetPercent: 0,
    absorbLoss: '',
    resaleValue: 0,
    sunkCostRisk: 0
  };
}

// Tabbed navigation system
function goToTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // Update tab bar active state
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveAndNext(currentTab, nextTab) {
  // Validate current tab
  if (!validateTab(currentTab)) {
    return;
  }
  
  // Save data
  saveTabData(currentTab);
  
  // Mark as complete
  markTabComplete(currentTab);
  
  // Go to next
  goToTab(nextTab);
  
  // Initialize next tab if needed
  if (nextTab === 'benefits-costs') {
    initializeBenefitsCostsTab();
  } else if (nextTab === 'sensitivity') {
    // Auto-generate sensitivity when entering tab
    const benefit = parseFloat(document.getElementById('benefit-success-tab')?.value) || 0;
    const purchase = parseFloat(document.getElementById('purchase-cost-tab')?.value) || 0;
    const resale = parseFloat(document.getElementById('resale-value-tab')?.value) || 0;
    const netLoss = purchase - resale;
    if (benefit > 0) {
      generateSensitivityTableTab(benefit, netLoss);
    }
  }
  
  showToast(`✅ ${currentTab.replace('-', ' ')} completed!`);
}

function initializeBenefitsCostsTab() {
  // Add initial benefit and cost if none exist
  if (document.querySelectorAll('#benefits-list-tab .benefit-item').length === 0) {
    addBenefitTab();
  }
  if (document.querySelectorAll('#costs-list-tab .cost-item').length === 0) {
    addCostTab();
  }
}

function markTabComplete(tabName) {
  const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (tabBtn) {
    tabBtn.classList.add('completed');
  }
}

function saveTabData(tabName) {
  const qa = appState.quickAssessment;
  
  switch(tabName) {
    case 'basic-info':
      qa.decisionWhat = document.getElementById('decision-what-tab')?.value || '';
      qa.decisionOutcome = document.getElementById('decision-outcome-tab')?.value || '';
      qa.totalBudget = parseFloat(document.getElementById('total-budget-tab')?.value) || 0;
      break;
    case 'financial':
      qa.totalCost = parseFloat(document.getElementById('purchase-cost-tab')?.value) || 0;
      qa.monthlyRecurring = parseFloat(document.getElementById('monthly-recurring-tab')?.value) || 0;
      qa.yearlyMaintenance = parseFloat(document.getElementById('annual-maintenance-tab')?.value) || 0;
      qa.resaleValue = parseFloat(document.getElementById('resale-value-tab')?.value) || 0;
      qa.yearlyUses = parseInt(document.getElementById('yearly-uses-tab')?.value) || 0;
      qa.year1Cost = qa.totalCost + (qa.monthlyRecurring * 12) + qa.yearlyMaintenance;
      qa.costPerUse = qa.year1Cost / qa.yearlyUses;
      break;
    case 'benefits-costs':
      // Already auto-saved via updateBenefitsScoreTab/updateCostsScoreTab
      break;
    case 'expected-value':
      // Already auto-saved via updateEVTab
      break;
    case 'sensitivity':
      // No user input needed
      break;
    case 'risk':
      qa.riskBest = document.getElementById('risk-best-tab')?.value || '';
      qa.riskBase = document.getElementById('risk-base-tab')?.value || '';
      qa.riskWorst = document.getElementById('risk-worst-tab')?.value || '';
      break;
    case 'biases':
      qa.biases = Array.from(document.querySelectorAll('#biases-list-tab input:checked')).map(cb => cb.value);
      break;
    case 'regret':
      qa.regret10Days = document.getElementById('regret-10d-tab')?.value || '';
      qa.regret10Months = document.getElementById('regret-10m-tab')?.value || '';
      qa.regret10Years = document.getElementById('regret-10y-tab')?.value || '';
      break;
    case 'opportunity':
      qa.opportunityCost = document.getElementById('opportunity-alt-tab')?.value || '';
      qa.alternativeBetter = document.querySelector('input[name="alt-better-tab"]:checked')?.value || '';
      break;
    case 'history-check':
      qa.boughtSimilar = document.getElementById('bought-similar-tab')?.value || '';
      if (qa.boughtSimilar === 'yes') {
        qa.similarItem = document.getElementById('similar-item-tab')?.value || '';
        qa.historicalUsage = parseInt(document.getElementById('usage-scale-tab')?.value) || 0;
        qa.stillUsing = document.querySelector('input[name="still-using-tab"]:checked')?.value || '';
        qa.buyAgain = document.querySelector('input[name="buy-again-tab"]:checked')?.value || '';
      }
      break;
  }
}

function validateTab(tabName) {
  switch(tabName) {
    case 'basic-info':
      const what = document.getElementById('decision-what-tab')?.value;
      const outcome = document.getElementById('decision-outcome-tab')?.value;
      const budget = document.getElementById('total-budget-tab')?.value;
      if (!what || !outcome || !budget) {
        alert('Please fill in all required fields');
        return false;
      }
      return true;
    case 'financial':
      const cost = document.getElementById('purchase-cost-tab')?.value;
      const resale = document.getElementById('resale-value-tab')?.value;
      const uses = document.getElementById('yearly-uses-tab')?.value;
      if (!cost || !resale || !uses) {
        alert('Please fill in all required fields');
        return false;
      }
      return true;
    case 'benefits-costs':
      const benefitsCount = document.querySelectorAll('#benefits-list-tab .benefit-item').length;
      const costsCount = document.querySelectorAll('#costs-list-tab .cost-item').length;
      if (benefitsCount === 0) {
        alert('Please add at least one benefit');
        return false;
      }
      if (costsCount === 0) {
        alert('Please add at least one cost');
        return false;
      }
      return true;
    case 'expected-value':
      const benefit = document.getElementById('benefit-success-tab')?.value;
      if (!benefit || parseFloat(benefit) <= 0) {
        alert('Please enter the benefit if successful');
        return false;
      }
      return true;
    case 'sensitivity':
      // Auto-generated, always valid
      return true;
    case 'risk':
      const best = document.getElementById('risk-best-tab')?.value;
      const base = document.getElementById('risk-base-tab')?.value;
      const worst = document.getElementById('risk-worst-tab')?.value;
      if (!best || !base || !worst) {
        alert('Please describe all three risk scenarios');
        return false;
      }
      return true;
    case 'biases':
      // Optional, always valid
      return true;
    case 'regret':
      const r10d = document.getElementById('regret-10d-tab')?.value;
      const r10m = document.getElementById('regret-10m-tab')?.value;
      const r10y = document.getElementById('regret-10y-tab')?.value;
      if (!r10d || !r10m || !r10y) {
        alert('Please answer all regret questions');
        return false;
      }
      return true;
    case 'opportunity':
      const alt = document.getElementById('opportunity-alt-tab')?.value;
      const altBetter = document.querySelector('input[name="alt-better-tab"]:checked');
      if (!alt || !altBetter) {
        alert('Please complete all fields');
        return false;
      }
      return true;
    case 'history-check':
      const similar = document.getElementById('bought-similar-tab')?.value;
      if (!similar) {
        alert('Please answer if you bought something similar before');
        return false;
      }
      if (similar === 'yes') {
        const item = document.getElementById('similar-item-tab')?.value;
        const usage = document.getElementById('usage-scale-tab')?.value;
        const stillUsing = document.querySelector('input[name="still-using-tab"]:checked');
        const buyAgain = document.querySelector('input[name="buy-again-tab"]:checked');
        if (!item || !usage || !stillUsing || !buyAgain) {
          alert('Please complete all historical pattern fields');
          return false;
        }
      }
      return true;
    default:
      return true;
  }
}

function goToLanding() {
  document.getElementById('tab-bar').style.display = 'none';
  goToTab('start');
}

function goToHistory() {
  goToTab('history-archive');
  renderHistory();
}

function loadSampleData() {
  appState.quickAssessment = {
    decisionWhat: 'Buy GoPro Hero 12',
    decisionOutcome: 'Capture travel content for Instagram and YouTube',
    totalBudget: 200000,
    totalCost: 45000,
    monthlyRecurring: 500,
    yearlyMaintenance: 3000,
    yearlyUses: 12,
    resaleValue: 20000,
    filter3Uses: 'no',
    filter2Benefits: 'yes',
    filter1Regret: 'yes',
    goodChance: 30,
    goodValue: 100000,
    badChance: 70,
    badCost: 45000,
    biases: ['fomo', 'social_proof'],
    regret10Days: 'Low',
    regret10Months: 'Medium',
    regret10Years: 'High',
    reversibilityOptions: ['Resell'],
    opportunityCost: 'Could take a course (₹15K) + fund 3 trips (₹30K)',
    alternativeBetter: 'yes',
    boughtSimilar: 'yes',
    similarItem: 'DSLR camera',
    historicalUsage: 3,
    stillUsing: 'no',
    buyAgain: 'no',
    budgetPercent: 22.5,
    absorbLoss: 'yes',
    resaleValue: 20000,
    sunkCostRisk: 55.6
  };
  
  startAssessment();
  showToast('📄 Sample data loaded!');
}

function nextStep(step) {
  if (!validateStep(step)) {
    return;
  }
  
  saveStepData(step);
  showPage(`quick-step-${step + 1}`);
}

function previousStep(step) {
  showPage(`quick-step-${step - 1}`);
}

function validateStep(step) {
  // Basic validation for required fields
  switch(step) {
    case 1:
      const decisionWhat = document.getElementById('decision-what').value;
      const decisionOutcome = document.getElementById('decision-outcome').value;
      const totalBudget = document.getElementById('total-budget').value;
      if (!decisionWhat || !decisionOutcome || !totalBudget) {
        alert('Please fill in all fields');
        return false;
      }
      break;
    case 2:
      const filter3 = document.querySelector('input[name="filter-3-uses"]:checked');
      const filter2 = document.querySelector('input[name="filter-2-benefits"]:checked');
      const filter1 = document.querySelector('input[name="filter-1-regret"]:checked');
      if (!filter3 || !filter2 || !filter1) {
        alert('Please answer all three questions');
        return false;
      }
      break;
    case 3:
      const totalCost = document.getElementById('total-cost').value;
      const yearlyUses = document.getElementById('yearly-uses').value;
      const cpuAcceptable = document.querySelector('input[name="cpu-acceptable"]:checked');
      if (!totalCost || !yearlyUses || !cpuAcceptable) {
        alert('Please complete all fields');
        return false;
      }
      break;
    case 4:
      const goodChance = document.getElementById('good-chance').value;
      const goodValue = document.getElementById('good-value').value;
      const badChance = document.getElementById('bad-chance').value;
      const badCost = document.getElementById('bad-cost').value;
      if (!goodChance || !goodValue || !badChance || !badCost) {
        alert('Please fill in all fields');
        return false;
      }
      break;
    case 5:
      const regret10Days = document.getElementById('regret-10-days').value;
      const regret10Months = document.getElementById('regret-10-months').value;
      const regret10Years = document.getElementById('regret-10-years').value;
      if (!regret10Days || !regret10Months || !regret10Years) {
        alert('Please answer all regret questions');
        return false;
      }
      break;
    case 7:
      const opportunityCost = document.getElementById('opportunity-cost').value;
      const alternativeBetter = document.querySelector('input[name="alternative-better"]:checked');
      if (!opportunityCost || !alternativeBetter) {
        alert('Please complete all fields');
        return false;
      }
      break;
    case 8:
      const boughtSimilar = document.getElementById('bought-similar').value;
      if (!boughtSimilar) {
        alert('Please answer if you bought something similar');
        return false;
      }
      if (boughtSimilar === 'yes') {
        const similarItem = document.getElementById('similar-item').value;
        const historicalUsage = document.getElementById('historical-usage').value;
        const stillUsing = document.querySelector('input[name="still-using"]:checked');
        const buyAgain = document.querySelector('input[name="buy-again"]:checked');
        if (!similarItem || !historicalUsage || !stillUsing || !buyAgain) {
          alert('Please complete all historical pattern fields');
          return false;
        }
      }
      break;
    case 9:
      const budgetPercent = document.getElementById('budget-percent').value;
      const absorbLoss = document.querySelector('input[name="absorb-loss"]:checked');
      const resaleValue = document.getElementById('resale-value').value;
      if (!budgetPercent || !absorbLoss || !resaleValue) {
        alert('Please complete all risk assessment fields');
        return false;
      }
      break;
  }
  return true;
}

function saveStepData(step) {
  const qa = appState.quickAssessment;
  
  switch(step) {
    case 1:
      qa.decisionWhat = document.getElementById('decision-what').value;
      qa.decisionOutcome = document.getElementById('decision-outcome').value;
      qa.totalBudget = parseFloat(document.getElementById('total-budget').value);
      break;
    case 2:
      qa.filter3Uses = document.querySelector('input[name="filter-3-uses"]:checked').value;
      qa.filter2Benefits = document.querySelector('input[name="filter-2-benefits"]:checked').value;
      qa.filter1Regret = document.querySelector('input[name="filter-1-regret"]:checked').value;
      break;
    case 3:
      qa.totalCost = parseFloat(document.getElementById('total-cost').value);
      qa.monthlyRecurring = parseFloat(document.getElementById('monthly-recurring').value) || 0;
      qa.yearlyMaintenance = parseFloat(document.getElementById('yearly-maintenance').value) || 0;
      qa.yearlyUses = parseInt(document.getElementById('yearly-uses').value);
      qa.cpuAcceptable = document.querySelector('input[name="cpu-acceptable"]:checked').value;
      break;
    case 4:
      qa.goodChance = parseFloat(document.getElementById('good-chance').value);
      qa.goodValue = parseFloat(document.getElementById('good-value').value);
      qa.badChance = parseFloat(document.getElementById('bad-chance').value);
      qa.badCost = parseFloat(document.getElementById('bad-cost').value);
      break;
    case 5:
      qa.regret10Days = document.getElementById('regret-10-days').value;
      qa.regret10Months = document.getElementById('regret-10-months').value;
      qa.regret10Years = document.getElementById('regret-10-years').value;
      qa.reversibilityOptions = Array.from(document.querySelectorAll('#quick-step-5 input[type="checkbox"]:checked')).map(cb => cb.value);
      break;
    case 6:
      qa.biases = Array.from(document.querySelectorAll('#quick-step-6 input[type="checkbox"]:checked')).map(cb => cb.value);
      break;
    case 7:
      qa.opportunityCost = document.getElementById('opportunity-cost').value;
      qa.alternativeBetter = document.querySelector('input[name="alternative-better"]:checked').value;
      break;
    case 8:
      qa.boughtSimilar = document.getElementById('bought-similar').value;
      if (qa.boughtSimilar === 'yes') {
        qa.similarItem = document.getElementById('similar-item').value;
        qa.historicalUsage = parseInt(document.getElementById('historical-usage').value) || 0;
        const stillUsing = document.querySelector('input[name="still-using"]:checked');
        const buyAgain = document.querySelector('input[name="buy-again"]:checked');
        qa.stillUsing = stillUsing ? stillUsing.value : '';
        qa.buyAgain = buyAgain ? buyAgain.value : '';
      }
      break;
    case 9:
      qa.budgetPercent = parseFloat(document.getElementById('budget-percent').value) || 0;
      const absorbLoss = document.querySelector('input[name="absorb-loss"]:checked');
      qa.absorbLoss = absorbLoss ? absorbLoss.value : '';
      qa.resaleValue = parseFloat(document.getElementById('resale-value').value) || 0;
      break;
  }
}

// Real-time calculation functions
function checkFilter() {
  const filter3 = document.querySelector('input[name="filter-3-uses"]:checked');
  const filter2 = document.querySelector('input[name="filter-2-benefits"]:checked');
  const filter1 = document.querySelector('input[name="filter-1-regret"]:checked');
  
  if (!filter3 || !filter2 || !filter1) return;
  
  const noCount = [filter3.value, filter2.value, filter1.value].filter(v => v === 'no').length;
  const warning = document.getElementById('filter-warning');
  
  if (noCount >= 2) {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

function calculateCostPerUse() {
  const totalCost = parseFloat(document.getElementById('total-cost').value) || 0;
  const monthlyRecurring = parseFloat(document.getElementById('monthly-recurring').value) || 0;
  const yearlyMaintenance = parseFloat(document.getElementById('yearly-maintenance').value) || 0;
  const yearlyUses = parseInt(document.getElementById('yearly-uses').value);
  
  if (totalCost && yearlyUses && yearlyUses > 0) {
    // Calculate Year 1 and Year 3 costs
    const year1Cost = totalCost + (monthlyRecurring * 12) + yearlyMaintenance;
    const year3Cost = totalCost + (monthlyRecurring * 36) + (yearlyMaintenance * 3);
    
    const cpu = year1Cost / yearlyUses;
    
    appState.quickAssessment.costPerUse = cpu;
    appState.quickAssessment.year1Cost = year1Cost;
    appState.quickAssessment.year3Cost = year3Cost;
    
    // Show working
    const workingHTML = `
      <div class="calculation-working">
        <strong>Year 1 Total Cost Calculation:</strong><br>
        = Purchase Cost + (Monthly Cost × 12) + Annual Maintenance<br>
        = ₹${totalCost.toFixed(0)} + (₹${monthlyRecurring.toFixed(0)} × 12) + ₹${yearlyMaintenance.toFixed(0)}<br>
        = ₹${totalCost.toFixed(0)} + ₹${(monthlyRecurring * 12).toFixed(0)} + ₹${yearlyMaintenance.toFixed(0)}<br>
        = <strong>₹${year1Cost.toFixed(0)}</strong> ✓
        <br><br>
        <strong>Cost per Use Calculation:</strong><br>
        = Total Cost ÷ Yearly Uses<br>
        = ₹${year1Cost.toFixed(0)} ÷ ${yearlyUses}<br>
        = <strong>₹${cpu.toFixed(2)} per use</strong>
        <br><br>
        <span style="color: var(--color-warning)">⚠️ This means you're paying ₹${cpu.toFixed(2)} each time you use it</span>
      </div>
    `;
    
    document.getElementById('cpu-value').innerHTML = `₹${cpu.toFixed(2)}${workingHTML}`;
    document.getElementById('cpu-amount').textContent = `₹${cpu.toFixed(2)}`;
    document.getElementById('cost-per-use-display').style.display = 'block';
    document.getElementById('cpu-question').style.display = 'block';
    
    // Show TCO
    const tcoDisplay = document.getElementById('tco-display');
    if (tcoDisplay) {
      document.getElementById('y1-cost').textContent = `₹${year1Cost.toFixed(0)}`;
      document.getElementById('y3-cost').textContent = `₹${year3Cost.toFixed(0)}`;
      tcoDisplay.style.display = 'block';
    }
  }
}

function checkCPU() {
  const cpuAcceptable = document.querySelector('input[name="cpu-acceptable"]:checked');
  if (!cpuAcceptable) return;
  
  const warning = document.getElementById('cpu-warning');
  if (cpuAcceptable.value === 'no') {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

function calculateEV() {
  const goodChance = parseFloat(document.getElementById('good-chance').value) || 0;
  const goodValue = parseFloat(document.getElementById('good-value').value) || 0;
  const badChance = parseFloat(document.getElementById('bad-chance').value) || 0;
  const badCost = parseFloat(document.getElementById('bad-cost').value) || 0;
  
  if (goodChance && goodValue && badChance && badCost) {
    const goodEV = (goodChance / 100) * goodValue;
    const badEV = (badChance / 100) * badCost;
    const ev = goodEV - badEV;
    appState.quickAssessment.expectedValue = ev;
    
    // Show working
    const workingHTML = `
      <div class="calculation-working">
        <strong>Expected Value Calculation:</strong><br>
        EV = (Good% × Good₹) - (Bad% × Bad₹)<br>
        = (${goodChance}% × ₹${goodValue.toFixed(0)}) - (${badChance}% × ₹${badCost.toFixed(0)})<br>
        = (${(goodChance/100).toFixed(2)} × ₹${goodValue.toFixed(0)}) - (${(badChance/100).toFixed(2)} × ₹${badCost.toFixed(0)})<br>
        = ₹${goodEV.toFixed(0)} - ₹${badEV.toFixed(0)}<br>
        = <strong>₹${ev.toFixed(0)}</strong>
        <br><br>
        ${ev > 0 ? 
          '<span style="color: var(--color-success)">✅ Positive EV means you expect to GAIN ₹' + Math.abs(ev).toFixed(0) + ' in value</span>' : 
          '<span style="color: var(--color-error)">❌ Negative EV means you expect to LOSE ₹' + Math.abs(ev).toFixed(0) + ' in value</span>'}
      </div>
    `;
    
    const evDisplay = document.getElementById('ev-display');
    const evValue = document.getElementById('ev-value');
    const warning = document.getElementById('ev-warning');
    
    evValue.innerHTML = `₹${ev.toFixed(0)}${workingHTML}`;
    evValue.className = ev > 0 ? 'ev-positive' : 'ev-negative';
    evDisplay.style.display = 'block';
    
    if (ev <= 0) {
      warning.style.display = 'block';
      warning.textContent = '⚠️ Warning: Negative expected value - you expect to lose money on average';
    } else {
      warning.style.display = 'none';
    }
  }
}

function checkRegret() {
  const regret10Days = document.getElementById('regret-10-days').value;
  const regret10Months = document.getElementById('regret-10-months').value;
  const regret10Years = document.getElementById('regret-10-years').value;
  
  if (!regret10Days || !regret10Months || !regret10Years) return;
  
  const hasHighRegret = [regret10Days, regret10Months, regret10Years].some(v => v === 'Medium' || v === 'High');
  const reversibilityOptions = document.querySelectorAll('#quick-step-5 input[type="checkbox"]:checked');
  const hasReversibility = reversibilityOptions.length > 0;
  
  const warning = document.getElementById('regret-warning');
  if (hasHighRegret && !hasReversibility) {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

function checkBiases() {
  const biases = document.querySelectorAll('#quick-step-6 input[type="checkbox"]:checked');
  const biasCount = biases.length;
  const warning = document.getElementById('bias-warning');
  const biasCountDisplay = document.getElementById('bias-count-display');
  
  // Update count display
  if (biasCountDisplay) {
    document.getElementById('bias-count').textContent = biasCount;
    
    let severity, severityClass;
    if (biasCount === 0 || biasCount <= 2) {
      severity = 'Low contamination';
      severityClass = 'success';
    } else if (biasCount <= 5) {
      severity = 'Moderate contamination';
      severityClass = 'warning';
    } else if (biasCount <= 10) {
      severity = 'High contamination';
      severityClass = 'danger';
    } else {
      severity = 'Severe contamination - WAIT mandatory';
      severityClass = 'danger';
    }
    
    const severitySpan = document.getElementById('bias-severity');
    severitySpan.textContent = severity;
    severitySpan.className = severityClass;
    biasCountDisplay.style.display = 'block';
  }
  
  // Update warning
  if (biasCount >= 6) {
    const warningText = document.getElementById('bias-warning-text');
    if (biasCount >= 11) {
      warningText.textContent = `Severe bias contamination (${biasCount}/23) - Wait mandatory before deciding`;
    } else {
      warningText.textContent = `High bias contamination detected (${biasCount}/23) - Consider waiting`;
    }
    warning.style.display = 'block';
  } else if (biasCount >= 3) {
    const warningText = document.getElementById('bias-warning-text');
    warningText.textContent = `Moderate bias contamination (${biasCount}/23) - Review carefully`;
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

function toggleHistoricalFields() {
  const boughtSimilar = document.getElementById('bought-similar').value;
  const historicalFields = document.getElementById('historical-fields');
  
  if (boughtSimilar === 'yes') {
    historicalFields.style.display = 'block';
  } else {
    historicalFields.style.display = 'none';
  }
}

function calculateSunkCostRisk() {
  const totalCost = parseFloat(document.getElementById('total-cost').value) || 0;
  const resaleValue = parseFloat(document.getElementById('resale-value').value) || 0;
  
  if (totalCost > 0) {
    const sunkRisk = ((totalCost - resaleValue) / totalCost) * 100;
    appState.quickAssessment.sunkCostRisk = sunkRisk;
    
    const display = document.getElementById('sunk-cost-risk');
    document.getElementById('sunk-risk-value').textContent = `${sunkRisk.toFixed(1)}%`;
    display.style.display = 'block';
  }
}

function checkOpportunityCost() {
  const alternativeBetter = document.querySelector('input[name="alternative-better"]:checked');
  if (!alternativeBetter) return;
  
  const warning = document.getElementById('opportunity-warning');
  if (alternativeBetter.value === 'yes') {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

// Results calculation
function calculateResults() {
  if (!validateStep(7)) return;
  saveStepData(7);
  
  const qa = appState.quickAssessment;
  let score = 0;
  const breakdown = {};
  
  // 1. 3-2-1 Filter (15 points)
  const filterPassed = qa.filter3Uses === 'yes' && qa.filter2Benefits === 'yes' && qa.filter1Regret === 'yes';
  if (filterPassed) {
    score += SCORING.three_two_one_filter_passed;
  }
  breakdown.filter = {
    passed: filterPassed,
    points: filterPassed ? SCORING.three_two_one_filter_passed : 0,
    detail: `3 uses: ${qa.filter3Uses}, 2 benefits: ${qa.filter2Benefits}, 1 regret: ${qa.filter1Regret}`
  };
  
  // 2. Cost-per-Use (20 points)
  const cpuAcceptable = qa.cpuAcceptable === 'yes';
  if (cpuAcceptable) {
    score += SCORING.cost_per_use_acceptable;
  }
  breakdown.costPerUse = {
    acceptable: cpuAcceptable,
    points: cpuAcceptable ? SCORING.cost_per_use_acceptable : 0,
    value: qa.costPerUse,
    detail: `₹${qa.costPerUse.toFixed(2)} per use`
  };
  
  // 3. Expected Value (25 points)
  const positiveEV = qa.expectedValue > 0;
  if (positiveEV) {
    score += SCORING.positive_expected_value;
  }
  breakdown.expectedValue = {
    positive: positiveEV,
    points: positiveEV ? SCORING.positive_expected_value : 0,
    value: qa.expectedValue,
    detail: `₹${qa.expectedValue.toFixed(2)}`
  };
  
  // 4. Low Regret (15 points)
  const lowRegret = [qa.regret10Days, qa.regret10Months, qa.regret10Years].every(v => v === 'None' || v === 'Low');
  if (lowRegret) {
    score += SCORING.low_regret;
  }
  breakdown.regret = {
    low: lowRegret,
    points: lowRegret ? SCORING.low_regret : 0,
    detail: `10 days: ${qa.regret10Days}, 10 months: ${qa.regret10Months}, 10 years: ${qa.regret10Years}`,
    reversibility: qa.reversibilityOptions.join(', ') || 'None'
  };
  
  // 5. Minimal Biases (variable points based on count)
  let biasPoints = 0;
  if (qa.biases.length <= 2) {
    biasPoints = 15;
  } else if (qa.biases.length <= 5) {
    biasPoints = 10;
  } else if (qa.biases.length <= 10) {
    biasPoints = 5;
  }
  score += biasPoints;
  
  breakdown.biases = {
    minimal: qa.biases.length <= 2,
    points: biasPoints,
    count: qa.biases.length,
    list: qa.biases,
    severity: qa.biases.length <= 2 ? 'Low' : qa.biases.length <= 5 ? 'Moderate' : qa.biases.length <= 10 ? 'High' : 'Severe'
  };
  
  // 6. No Better Alternative (10 points)
  const noBetterAlt = qa.alternativeBetter === 'no';
  if (noBetterAlt) {
    score += SCORING.no_better_alternative;
  }
  breakdown.opportunityCost = {
    noBetterAlt: noBetterAlt,
    points: noBetterAlt ? SCORING.no_better_alternative : 0,
    alternatives: qa.opportunityCost
  };
  
  // Determine recommendation
  let recommendation;
  if (score >= THRESHOLDS.STRONG_GO.min) {
    recommendation = THRESHOLDS.STRONG_GO;
  } else if (score >= THRESHOLDS.GO.min) {
    recommendation = THRESHOLDS.GO;
  } else if (score >= THRESHOLDS.WAIT_48H.min) {
    recommendation = THRESHOLDS.WAIT_48H;
  } else if (score >= THRESHOLDS.WAIT_1WEEK.min) {
    recommendation = THRESHOLDS.WAIT_1WEEK;
  } else {
    recommendation = THRESHOLDS.NO;
  }
  
  appState.results = {
    score: score,
    recommendation: recommendation,
    breakdown: breakdown
  };
  
  displayResults();
  
  // Auto-save to history
  setTimeout(() => {
    saveDecisionToHistory();
  }, 500);
}

// Comparison Mode Functions
function addAlternative() {
  const altIndex = appState.comparisonMode.alternatives.length;
  appState.comparisonMode.alternatives.push({
    type: 'product',
    name: '',
    upfrontCost: 0,
    monthlyCost: 0,
    timePerWeek: 0,
    effort: 3,
    effectiveness: 5,
    lifespan: 1
  });
  
  const altHTML = `
    <div class="alternative-item" id="alt-${altIndex}">
      <h4>Alternative ${altIndex + 1}</h4>
      <div class="form-group">
        <label class="form-label">Type:</label>
        <select class="form-control" data-alt="${altIndex}" data-field="type" onchange="updateAlternativeType(${altIndex})">
          <option value="product">Product Purchase</option>
          <option value="alternative_product">Alternative Product</option>
          <option value="diy">DIY/Manual Method</option>
          <option value="service">Hire Service/Professional</option>
          <option value="existing">Use Existing Solution</option>
          <option value="nothing">Do Nothing</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Name/Description:</label>
        <input type="text" class="form-control" data-alt="${altIndex}" data-field="name" oninput="updateAlternative(${altIndex})">
      </div>
      <div class="form-group">
        <label class="form-label">Upfront Cost (₹):</label>
        <input type="number" class="form-control" data-alt="${altIndex}" data-field="upfrontCost" min="0" oninput="updateAlternative(${altIndex})">
      </div>
      <div class="form-group">
        <label class="form-label">Monthly Recurring Cost (₹):</label>
        <input type="number" class="form-control" data-alt="${altIndex}" data-field="monthlyCost" min="0" oninput="updateAlternative(${altIndex})">
      </div>
      <div class="form-group">
        <label class="form-label">Time Required (hours/week):</label>
        <input type="number" class="form-control" data-alt="${altIndex}" data-field="timePerWeek" min="0" oninput="updateAlternative(${altIndex})">
      </div>
      <div class="form-group">
        <label class="form-label">Effort Level (1-5):</label>
        <input type="number" class="form-control" data-alt="${altIndex}" data-field="effort" min="1" max="5" value="3" oninput="updateAlternative(${altIndex})">
      </div>
      <div class="form-group">
        <label class="form-label">Effectiveness (1-10):</label>
        <input type="number" class="form-control" data-alt="${altIndex}" data-field="effectiveness" min="1" max="10" value="5" oninput="updateAlternative(${altIndex})">
      </div>
      <div class="form-group">
        <label class="form-label">Expected Lifespan (years):</label>
        <input type="number" class="form-control" data-alt="${altIndex}" data-field="lifespan" min="1" value="1" oninput="updateAlternative(${altIndex})">
      </div>
      <button class="remove-btn" onclick="removeAlternative(${altIndex})">Remove</button>
    </div>
  `;
  
  document.getElementById('alternatives-list').insertAdjacentHTML('beforeend', altHTML);
}

function removeAlternative(index) {
  const element = document.getElementById(`alt-${index}`);
  if (element) element.remove();
  appState.comparisonMode.alternatives[index] = null;
}

function updateAlternativeType(index) {
  updateAlternative(index);
}

function updateAlternative(index) {
  const inputs = document.querySelectorAll(`[data-alt="${index}"]`);
  const alt = appState.comparisonMode.alternatives[index];
  
  inputs.forEach(input => {
    const field = input.dataset.field;
    if (['upfrontCost', 'monthlyCost', 'timePerWeek', 'effort', 'effectiveness', 'lifespan'].includes(field)) {
      alt[field] = parseFloat(input.value) || 0;
    } else {
      alt[field] = input.value;
    }
  });
}

function calculateComparison() {
  const alternatives = appState.comparisonMode.alternatives.filter(a => a !== null && a.name);
  
  if (alternatives.length < 2) {
    alert('Please add at least 2 alternatives to compare');
    return;
  }
  
  // Calculate value scores
  const results = alternatives.map(alt => {
    const year1Cost = alt.upfrontCost + (alt.monthlyCost * 12);
    const year3Cost = alt.upfrontCost + (alt.monthlyCost * 36);
    const valueScore = year1Cost > 0 ? (alt.effectiveness / year1Cost) * 10000 : Infinity;
    
    return {
      ...alt,
      year1Cost,
      year3Cost,
      valueScore
    };
  });
  
  // Sort by value score (higher is better)
  results.sort((a, b) => b.valueScore - a.valueScore);
  
  // Assign ranks
  results.forEach((r, i) => r.rank = i + 1);
  
  // Create comparison table
  let tableHTML = `
    <div class="comparison-table">
      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            ${results.map((r, i) => `<th>Option ${i + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Type</strong></td>
            ${results.map(r => `<td>${r.type.replace('_', ' ')}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Name</strong></td>
            ${results.map(r => `<td>${r.name}</td>`).join('')}
          </tr>
          <tr style="background: var(--color-secondary);">
            <td><strong>Year 1 Cost</strong></td>
            ${results.map(r => `<td>₹${r.year1Cost.toFixed(0)}</td>`).join('')}
          </tr>
          <tr style="background: var(--color-secondary);">
            <td><strong>Year 3 Cost</strong></td>
            ${results.map(r => `<td>₹${r.year3Cost.toFixed(0)}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Time/Week</strong></td>
            ${results.map(r => `<td>${r.timePerWeek}h</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Effort Level</strong></td>
            ${results.map(r => `<td>${r.effort}/5</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Effectiveness</strong></td>
            ${results.map(r => `<td>${r.effectiveness}/10</td>`).join('')}
          </tr>
          <tr style="background: var(--color-secondary);">
            <td><strong>Value Score</strong></td>
            ${results.map(r => `<td>${r.valueScore === Infinity ? '∞' : r.valueScore.toFixed(2)}</td>`).join('')}
          </tr>
          <tr class="winner">
            <td><strong>Rank</strong></td>
            ${results.map(r => `<td><strong>${r.rank === 1 ? '🏆 #1' : '#' + r.rank}</strong></td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('comparison-table').innerHTML = tableHTML;
  
  const winner = results[0];
  const recommendation = `
    <strong>🏆 WINNER: ${winner.name}</strong><br>
    Type: ${winner.type.replace('_', ' ')}<br>
    Year 1 Cost: ₹${winner.year1Cost.toFixed(0)}<br>
    Effectiveness: ${winner.effectiveness}/10<br>
    Value Score: ${winner.valueScore === Infinity ? 'Free/Best Value' : winner.valueScore.toFixed(2)}<br><br>
    <em>${winner.year1Cost === 0 ? 'This option is free, making it the best value choice!' : 'This option provides the best balance of cost and effectiveness.'}</em>
  `;
  
  document.getElementById('comparison-recommendation').innerHTML = recommendation;
  document.getElementById('comparison-results').style.display = 'block';
}

// History Functions
function renderHistory() {
  loadHistory();
  
  // Render statistics
  const decisions = decisionHistory.decisions;
  const totalDecisions = decisions.length;
  const withOutcomes = decisions.filter(d => d.actualOutcome !== null).length;
  const correctDecisions = decisions.filter(d => d.wasCorrect === 'yes').length;
  const accuracyRate = withOutcomes > 0 ? ((correctDecisions / withOutcomes) * 100).toFixed(0) : 'N/A';
  const avgScore = totalDecisions > 0 ? (decisions.reduce((sum, d) => sum + d.score, 0) / totalDecisions).toFixed(0) : 0;
  
  document.getElementById('stat-total').textContent = totalDecisions;
  document.getElementById('stat-outcomes').textContent = `${withOutcomes}/${totalDecisions}`;
  document.getElementById('stat-accuracy').textContent = withOutcomes > 0 ? `${accuracyRate}%` : 'N/A';
  document.getElementById('stat-avg-score').textContent = avgScore;
  
  // Render insights
  let insightsHTML = '';
  if (withOutcomes >= 3) {
    const goDecisions = decisions.filter(d => d.recommendation.includes('GO'));
    const goCorrect = goDecisions.filter(d => d.wasCorrect === 'yes').length;
    const goAccuracy = goDecisions.length > 0 ? ((goCorrect / goDecisions.length) * 100).toFixed(0) : 0;
    
    insightsHTML = `
      <div class="insights-box ${accuracyRate >= 70 ? 'success' : 'warning'}">
        <h4>🎯 Your Patterns</h4>
        <ul>
          <li>Overall Accuracy: ${accuracyRate}% ${accuracyRate >= 70 ? '- Excellent!' : '- Room for improvement'}</li>
          <li>GO decisions accuracy: ${goAccuracy}%</li>
          <li>Average decision score: ${avgScore}/100</li>
          ${accuracyRate >= 70 ? '<li><strong>You\'re making rational decisions! Trust the system.</strong></li>' : '<li><strong>Consider taking more time before deciding.</strong></li>'}
        </ul>
      </div>
    `;
  } else if (totalDecisions > 0) {
    insightsHTML = `
      <div class="insights-box">
        <p>Record outcomes for at least 3 decisions to see patterns and improve your decision-making!</p>
      </div>
    `;
  }
  document.getElementById('stats-insights').innerHTML = insightsHTML;
  
  // Render decisions list
  if (totalDecisions === 0) {
    document.getElementById('decisions-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <p>No decisions recorded yet. Complete an assessment to start tracking!</p>
      </div>
    `;
  } else {
    const decisionsHTML = decisions.map(d => {
      const date = new Date(d.timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      const scoreClass = d.score >= 75 ? 'go' : d.score >= 40 ? 'wait' : 'no';
      
      let outcomeHTML = '';
      if (d.actualOutcome) {
        const outcomeIcon = d.wasCorrect === 'yes' ? '✅' : d.wasCorrect === 'no' ? '❌' : '🔶';
        outcomeHTML = `
          <div class="decision-outcome">
            ${outcomeIcon} <strong>Outcome:</strong> ${d.actualOutcome.result} | <strong>Correct:</strong> ${d.wasCorrect}<br>
            ${d.notes ? `<small>${d.notes}</small>` : ''}
          </div>
        `;
      }
      
      return `
        <div class="decision-item">
          <div class="decision-header">
            <div>
              <div class="decision-title">📅 ${d.title}</div>
              <div class="decision-date">${date}</div>
            </div>
            <div class="decision-score ${scoreClass}">${d.score}/100</div>
          </div>
          <div class="decision-meta">
            <span><strong>Recommendation:</strong> ${d.recommendation}</span>
            <span><strong>Mode:</strong> ${d.mode}</span>
            ${d.alternatives ? `<span><strong>Alternatives:</strong> ${d.alternatives.length}</span>` : ''}
          </div>
          ${outcomeHTML}
          <div class="decision-actions">
            ${!d.actualOutcome ? `<button class="btn btn--sm btn--primary" onclick="openOutcomeModal('${d.id}')">Add Outcome</button>` : `<button class="btn btn--sm btn--secondary" onclick="openOutcomeModal('${d.id}')">Edit Outcome</button>`}
            <button class="btn btn--sm btn--outline" onclick="deleteDecision('${d.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('decisions-list').innerHTML = decisionsHTML;
  }
}

function openOutcomeModal(decisionId) {
  const decision = decisionHistory.decisions.find(d => d.id === decisionId);
  if (!decision) return;
  
  document.getElementById('outcome-decision-id').value = decisionId;
  
  // Pre-fill if outcome exists
  if (decision.actualOutcome) {
    const actionRadio = document.querySelector(`input[name="outcome-action"][value="${decision.actualOutcome.action}"]`);
    if (actionRadio) actionRadio.checked = true;
    
    const resultRadio = document.querySelector(`input[name="outcome-result"][value="${decision.actualOutcome.result}"]`);
    if (resultRadio) resultRadio.checked = true;
    
    document.getElementById('outcome-notes').value = decision.notes || '';
    
    const correctRadio = document.querySelector(`input[name="outcome-correct"][value="${decision.wasCorrect}"]`);
    if (correctRadio) correctRadio.checked = true;
  }
  
  document.getElementById('outcome-modal').style.display = 'flex';
}

function closeOutcomeModal() {
  document.getElementById('outcome-modal').style.display = 'none';
  document.querySelectorAll('#outcome-modal input[type="radio"]').forEach(r => r.checked = false);
  document.getElementById('outcome-notes').value = '';
}

function saveOutcome() {
  const decisionId = document.getElementById('outcome-decision-id').value;
  const action = document.querySelector('input[name="outcome-action"]:checked');
  const result = document.querySelector('input[name="outcome-result"]:checked');
  const correct = document.querySelector('input[name="outcome-correct"]:checked');
  const notes = document.getElementById('outcome-notes').value;
  
  if (!action || !result || !correct) {
    alert('Please answer all questions');
    return;
  }
  
  const decision = decisionHistory.decisions.find(d => d.id === decisionId);
  if (decision) {
    decision.actualOutcome = {
      action: action.value,
      result: result.value
    };
    decision.outcomeDate = new Date().toISOString();
    decision.wasCorrect = correct.value;
    decision.notes = notes;
    
    saveHistory();
    closeOutcomeModal();
    renderHistory();
    showToast('✅ Outcome recorded successfully');
  }
}

function deleteDecision(decisionId) {
  if (!confirm('Are you sure you want to delete this decision?')) return;
  
  const index = decisionHistory.decisions.findIndex(d => d.id === decisionId);
  if (index > -1) {
    decisionHistory.decisions.splice(index, 1);
    saveHistory();
    renderHistory();
    showToast('🗑️ Decision deleted');
  }
}

function clearHistory() {
  if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) return;
  
  decisionHistory.decisions = [];
  saveHistory();
  renderHistory();
  showToast('🗑️ History cleared');
}

function exportHistory(format) {
  if (decisionHistory.decisions.length === 0) {
    alert('No decisions to export');
    return;
  }
  
  if (format === 'csv') {
    let csv = 'Date,Decision,Score,Recommendation,Outcome,Correct,Notes\n';
    decisionHistory.decisions.forEach(d => {
      const date = new Date(d.timestamp).toLocaleDateString();
      const outcome = d.actualOutcome ? d.actualOutcome.result : 'Pending';
      const correct = d.wasCorrect || 'N/A';
      const notes = (d.notes || '').replace(/,/g, ';').replace(/\n/g, ' ');
      csv += `${date},"${d.title}",${d.score},"${d.recommendation}",${outcome},${correct},"${notes}"\n`;
    });
    downloadFile(csv, 'decision-history.csv', 'text/csv');
  } else if (format === 'json') {
    const json = JSON.stringify(decisionHistory, null, 2);
    downloadFile(json, 'decision-history.json', 'application/json');
  }
  
  showToast(`💾 Exported as ${format.toUpperCase()}`);
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function displayResults() {
  const { score, recommendation, breakdown } = appState.results;
  const qa = appState.quickAssessment;
  
  showPage('results-page');
  
  // Create score gauge using Chart.js
  createScoreGauge(score);
  
  // Display recommendation badge
  const badge = document.getElementById('recommendation-badge');
  badge.textContent = recommendation.badge;
  badge.className = `recommendation-badge ${recommendation.class}`;
  
  document.getElementById('recommendation-text').textContent = recommendation.text;
  
  // Display decision context
  document.getElementById('results-decision').textContent = 
    `Deciding: ${qa.decisionWhat} | Desired outcome: ${qa.decisionOutcome}`;
  
  // Display new analyses if available
  const hasDetailedAnalysis = appState.detailedAnalysis.costPerUseSnap.costPerUse > 0 || 
                               appState.detailedAnalysis.expectedValue.calculatedEV !== 0;
  
  if (hasDetailedAnalysis) {
    document.getElementById('new-analyses-summary').style.display = 'block';
    
    // Cost-per-Use
    const cpu = appState.detailedAnalysis.costPerUseSnap.costPerUse;
    const cpuVerdict = appState.detailedAnalysis.costPerUseSnap.verdict;
    document.getElementById('result-cpu-value').textContent = `₹${cpu.toFixed(2)}`;
    const cpuStatus = document.getElementById('result-cpu-status');
    if (cpuVerdict === 'good') {
      cpuStatus.textContent = '✅ Good value';
      cpuStatus.className = 'status good';
    } else if (cpuVerdict === 'acceptable') {
      cpuStatus.textContent = '⚠️ Acceptable';
      cpuStatus.className = 'status acceptable';
    } else {
      cpuStatus.textContent = '❌ High cost per use';
      cpuStatus.className = 'status high';
    }
    
    // Expected Value
    const ev = appState.detailedAnalysis.expectedValue.calculatedEV;
    const evVerdict = appState.detailedAnalysis.expectedValue.verdict;
    document.getElementById('result-ev-value').textContent = `₹${ev.toFixed(0)}`;
    document.getElementById('result-ev-value').style.color = ev > 0 ? 'var(--color-success)' : ev < 0 ? 'var(--color-error)' : 'var(--color-text)';
    
    let evSign = '';
    if (evVerdict === 'positive') {
      evSign = '✅ Positive - Creates value';
    } else if (evVerdict === 'zero') {
      evSign = '⚖️ Break-even';
    } else {
      evSign = '❌ Negative - Destroys value';
    }
    document.getElementById('result-ev-sign').textContent = evSign;
    
    const p = appState.detailedAnalysis.expectedValue.successChance / 100;
    const B = appState.detailedAnalysis.expectedValue.benefitIfSuccess;
    const L = appState.detailedAnalysis.expectedValue.netLossIfFailure;
    document.getElementById('result-ev-calc').innerHTML = `
      (${(p * 100).toFixed(0)}% × ₹${B.toFixed(0)}) - (${((1-p) * 100).toFixed(0)}% × ₹${L.toFixed(0)})<br>
      = ₹${(p * B).toFixed(0)} - ₹${((1-p) * L).toFixed(0)} = ₹${ev.toFixed(0)}
    `;
    
    // EV Threshold
    const threshold = appState.detailedAnalysis.evThreshold.thresholdPercent;
    const meetsThreshold = appState.detailedAnalysis.evThreshold.meetsThreshold;
    const successChance = appState.detailedAnalysis.expectedValue.successChance;
    
    document.getElementById('result-threshold-value').textContent = `${threshold}%`;
    document.getElementById('result-threshold-comparison').textContent = `Your estimate: ${successChance}% ${meetsThreshold ? '✓' : '✗'}`;
    
    const thresholdVerdict = document.getElementById('result-threshold-verdict');
    if (meetsThreshold) {
      thresholdVerdict.textContent = '✅ Worth considering';
      thresholdVerdict.style.color = 'var(--color-success)';
    } else {
      thresholdVerdict.textContent = '❌ Drop it';
      thresholdVerdict.style.color = 'var(--color-error)';
    }
    
    // Benefits vs Costs
    let benefitsScore = calculateBenefitsScoreValue();
    let costsScore = calculateCostsScoreValue();
    
    // If no detailed analysis, use default values for display
    if (benefitsScore === 0 && costsScore === 0 && appState.detailedAnalysis.benefits.length === 0) {
      // Estimate from quick assessment data
      benefitsScore = breakdown.filter.passed ? 15 : 0;
      benefitsScore += breakdown.expectedValue.positive ? 15 : 0;
      costsScore = breakdown.costPerUse.acceptable ? 0 : 20;
      costsScore += qa.biases.length * 1.5;
    }
    
    if (benefitsScore > 0 || costsScore > 0) {
      document.getElementById('benefits-vs-costs').style.display = 'block';
      
      const benefitsPercent = (benefitsScore / 50) * 100;
      const costsPercent = (costsScore / 50) * 100;
      
      document.getElementById('benefits-bar').style.width = `${benefitsPercent}%`;
      document.getElementById('costs-bar').style.width = `${costsPercent}%`;
      document.getElementById('benefits-bar-value').textContent = `${benefitsScore} / 50`;
      document.getElementById('costs-bar-value').textContent = `${costsScore} / 50`;
      
      const verdictEl = document.getElementById('comparison-verdict');
      if (benefitsScore > costsScore * 1.2) {
        verdictEl.textContent = '✅ Benefits significantly outweigh costs';
        verdictEl.style.color = 'var(--color-success)';
      } else if (costsScore > benefitsScore * 1.2) {
        verdictEl.textContent = '❌ Costs outweigh benefits';
        verdictEl.style.color = 'var(--color-error)';
      } else {
        verdictEl.textContent = '⚠️ Close call - Benefits and costs are balanced';
        verdictEl.style.color = 'var(--color-warning)';
      }
    }
  }
    
  // Calculate rational confidence
  const biasContamination = (qa.biases.length / 23) * 100;
  const failedCriteria = 6 - [breakdown.filter.passed, breakdown.costPerUse.acceptable, breakdown.expectedValue.positive, breakdown.regret.low, breakdown.biases.minimal, breakdown.opportunityCost.noBetterAlt].filter(v => v).length;
  const rationalConfidence = Math.max(0, 100 - biasContamination - (failedCriteria * 10));
  document.getElementById('confidence-value').textContent = `${rationalConfidence.toFixed(0)}%`;
  
  // Display financial metrics
  const detailedCPU = appState.detailedAnalysis.costPerUseSnap.costPerUse || qa.costPerUse;
  const detailedEV = appState.detailedAnalysis.expectedValue.calculatedEV || qa.expectedValue;
  
  document.getElementById('tco-1y').textContent = `₹${qa.year1Cost.toFixed(0)}`;
  document.getElementById('tco-3y').textContent = `₹${qa.year3Cost.toFixed(0)}`;
  document.getElementById('cpu-metric').textContent = `₹${detailedCPU.toFixed(2)}`;
  document.getElementById('budget-impact').textContent = `${qa.budgetPercent.toFixed(1)}%`;
  document.getElementById('ev-metric').textContent = `₹${detailedEV.toFixed(0)}`;
  document.getElementById('breakeven').textContent = `${qa.yearlyUses} uses`;
  
  // Display psychological metrics
  document.getElementById('bias-contamination').textContent = `${qa.biases.length}/23`;
  document.getElementById('bias-severity-metric').textContent = breakdown.biases.severity;
  document.getElementById('emotional-index').textContent = `${biasContamination.toFixed(0)}%`;
  document.getElementById('quality-score').textContent = `${score}/100`;
  
  // Display usage metrics
  let adjustedUsage = qa.yearlyUses;
  if (qa.boughtSimilar === 'yes' && qa.historicalUsage > 0) {
    adjustedUsage = Math.round(qa.yearlyUses * (qa.historicalUsage / 10));
  }
  document.getElementById('predicted-usage').textContent = `${qa.yearlyUses} times`;
  document.getElementById('realistic-usage').textContent = `${adjustedUsage} times`;
  document.getElementById('utilization-rate').textContent = `${((adjustedUsage / qa.yearlyUses) * 100).toFixed(0)}%`;
  
  // Display risk metrics
  document.getElementById('regret-short').textContent = qa.regret10Days;
  document.getElementById('regret-medium').textContent = qa.regret10Months;
  document.getElementById('regret-long').textContent = qa.regret10Years;
  document.getElementById('reversibility-score').textContent = `${(qa.reversibilityOptions.length / 4 * 100).toFixed(0)}%`;
  document.getElementById('sunk-risk').textContent = `${qa.sunkCostRisk.toFixed(1)}%`;
  document.getElementById('absorb-loss-metric').textContent = qa.absorbLoss || 'N/A';
  
  // Create cost breakdown chart
  createCostBreakdownChart(qa);
  
  // Create bias heatmap
  createBiasHeatmap(qa.biases);
  
  // Create score progression timeline
  createScoreProgression(breakdown);
  
  // Create bias category cards
  createBiasCategoryCards(qa.biases);
  
  // Create budget impact meter
  createBudgetImpactMeter(qa.year1Cost, qa.totalBudget);
  
  // Create cost breakdown bars
  createCostBreakdownBars(qa);
  
  // Create risk matrix
  createRiskMatrix(qa);
  
  // Display breakdown
  const breakdownHTML = `
    <div class="breakdown-item">
      <h3>3-2-1 Filter ${breakdown.filter.passed ? '✓' : '✗'}</h3>
      <p><strong>Points:</strong> ${breakdown.filter.points}/${SCORING.three_two_one_filter_passed}</p>
      <p>${breakdown.filter.detail}</p>
    </div>
    <div class="breakdown-item">
      <h3>Cost-per-Use ${breakdown.costPerUse.acceptable ? '✓' : '✗'}</h3>
      <p><strong>Points:</strong> ${breakdown.costPerUse.points}/${SCORING.cost_per_use_acceptable}</p>
      <p>${breakdown.costPerUse.detail}</p>
    </div>
    <div class="breakdown-item">
      <h3>Expected Value ${breakdown.expectedValue.positive ? '✓' : '✗'}</h3>
      <p><strong>Points:</strong> ${breakdown.expectedValue.points}/${SCORING.positive_expected_value}</p>
      <p>${breakdown.expectedValue.detail}</p>
    </div>
    <div class="breakdown-item">
      <h3>Regret Assessment ${breakdown.regret.low ? '✓' : '✗'}</h3>
      <p><strong>Points:</strong> ${breakdown.regret.points}/${SCORING.low_regret}</p>
      <p>${breakdown.regret.detail}</p>
      <p>Reversibility options: ${breakdown.regret.reversibility}</p>
    </div>
    <div class="breakdown-item">
      <h3>Bias Scan ${breakdown.biases.minimal ? '✓' : '✗'}</h3>
      <p><strong>Points:</strong> ${breakdown.biases.points}/${SCORING.minimal_biases}</p>
      <p>${breakdown.biases.count} biases detected${breakdown.biases.list.length > 0 ? ': ' + breakdown.biases.list.join(', ') : ''}</p>
    </div>
    <div class="breakdown-item">
      <h3>Opportunity Cost ${breakdown.opportunityCost.noBetterAlt ? '✓' : '✗'}</h3>
      <p><strong>Points:</strong> ${breakdown.opportunityCost.points}/${SCORING.no_better_alternative}</p>
      <p>Alternative considered: ${breakdown.opportunityCost.alternatives}</p>
    </div>
  `;
  document.getElementById('breakdown-content').innerHTML = breakdownHTML;
  
  // Update section titles with icons
  document.querySelectorAll('.section-title').forEach(title => {
    if (title.textContent.includes('Financial')) title.classList.add('financial');
    if (title.textContent.includes('Psychological')) title.classList.add('psychological');
    if (title.textContent.includes('Usage')) title.classList.add('usage');
    if (title.textContent.includes('Regret') || title.textContent.includes('Risk')) title.classList.add('risk');
    if (title.textContent.includes('Insights')) title.classList.add('insights');
    if (title.textContent.includes('Breakdown')) title.classList.add('breakdown');
    if (title.textContent.includes('Executive')) title.classList.add('executive');
  });
  
  // Display Sensitivity Analysis if available
  if (appState.detailedAnalysis.evThreshold.thresholdPercent > 0) {
    const sensitivityHTML = `
      <div class="card">
        <h2 class="section-title">🔍 Sensitivity Analysis</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Break-even Success Rate</div>
            <div class="metric-value">${appState.detailedAnalysis.evThreshold.thresholdPercent.toFixed(0)}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Your Estimate</div>
            <div class="metric-value">${appState.detailedAnalysis.expectedValue.successChance}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Safety Margin</div>
            <div class="metric-value" style="color: ${appState.detailedAnalysis.evThreshold.meetsThreshold ? 'var(--color-success)' : 'var(--color-error)'}">
              ${appState.detailedAnalysis.evThreshold.meetsThreshold ? '+' : ''}${(appState.detailedAnalysis.expectedValue.successChance - appState.detailedAnalysis.evThreshold.thresholdPercent).toFixed(0)}%
            </div>
          </div>
        </div>
        <div class="insights-box" style="margin-top: 16px;">
          ${appState.detailedAnalysis.evThreshold.meetsThreshold ? 
            '✅ Your success estimate exceeds the break-even threshold, providing a safety margin.' :
            '❌ Your success estimate is below the break-even threshold. Small decreases in success rate lead to negative expected value.'}
        </div>
      </div>
    `;
    // Insert before insights section
    const insightsCard = document.querySelector('#insights-content').closest('.card');
    if (insightsCard) {
      insightsCard.insertAdjacentHTML('beforebegin', sensitivityHTML);
    }
  }
  
  // Display Risk Profile if available
  if (appState.detailedAnalysis.riskProfile) {
    const rp = appState.detailedAnalysis.riskProfile;
    const riskHTML = `
      <div class="card">
        <h2 class="section-title">⚠️ Detailed Risk Profile</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Worst Case (${rp.worstCase.prob}% prob)</div>
            <div class="metric-value" style="color: var(--color-error)">-₹${rp.worstCase.loss.toFixed(0)}</div>
            <div style="font-size: 11px; margin-top: 8px; color: var(--color-text-secondary);">${rp.worstCase.desc}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Base Case (${rp.baseCase.prob}% prob)</div>
            <div class="metric-value">${rp.baseCase.value >= 0 ? '+' : ''}₹${rp.baseCase.value.toFixed(0)}</div>
            <div style="font-size: 11px; margin-top: 8px; color: var(--color-text-secondary);">${rp.baseCase.desc}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Best Case (${rp.bestCase.prob}% prob)</div>
            <div class="metric-value" style="color: var(--color-success)">+₹${rp.bestCase.value.toFixed(0)}</div>
            <div style="font-size: 11px; margin-top: 8px; color: var(--color-text-secondary);">${rp.bestCase.desc}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Expected Outcome</div>
            <div class="metric-value" style="color: ${rp.expectedOutcome >= 0 ? 'var(--color-success)' : 'var(--color-error)'}">
              ${rp.expectedOutcome >= 0 ? '+' : ''}₹${rp.expectedOutcome.toFixed(0)}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Maximum Downside</div>
            <div class="metric-value" style="color: var(--color-error)">-₹${rp.maxDownside.toFixed(0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Risk/Reward Ratio</div>
            <div class="metric-value" style="color: var(--color-primary)">1:${rp.riskRewardRatio}</div>
          </div>
        </div>
        <div class="insights-box" style="margin-top: 16px;">
          <strong>📊 Risk Assessment:</strong><br>
          ${rp.expectedOutcome >= 0 ? 
            `✅ The probability-weighted expected outcome is positive (+₹${rp.expectedOutcome.toFixed(0)}), suggesting favorable odds.` :
            `❌ The probability-weighted expected outcome is negative (₹${rp.expectedOutcome.toFixed(0)}), suggesting unfavorable odds.`}
          ${parseFloat(rp.riskRewardRatio) >= 2 ? 
            ` The risk/reward ratio of 1:${rp.riskRewardRatio} is favorable (upside is ${rp.riskRewardRatio}x the downside).` :
            ` The risk/reward ratio of 1:${rp.riskRewardRatio} is ${parseFloat(rp.riskRewardRatio) < 1 ? 'unfavorable' : 'moderate'}.`}
        </div>
      </div>
    `;
    // Insert before insights section
    const insightsCard = document.querySelector('#insights-content').closest('.card');
    if (insightsCard) {
      insightsCard.insertAdjacentHTML('beforebegin', riskHTML);
    }
  }
  
  // Generate insights
  const supportingReasons = [];
  const concerns = [];
  
  if (breakdown.filter.passed) supportingReasons.push('Passes the 3-2-1 practical usage test');
  if (breakdown.costPerUse.acceptable) supportingReasons.push('Cost per use is acceptable');
  if (breakdown.expectedValue.positive) supportingReasons.push('Positive expected value');
  if (breakdown.regret.low) supportingReasons.push('Low predicted regret');
  if (breakdown.biases.minimal) supportingReasons.push('Minimal cognitive biases detected');
  if (breakdown.opportunityCost.noBetterAlt) supportingReasons.push('No clearly better alternative');
  
  if (!breakdown.filter.passed) concerns.push('Does not pass the 3-2-1 filter');
  if (!breakdown.costPerUse.acceptable) concerns.push('Cost per use is too high');
  if (!breakdown.expectedValue.positive) concerns.push('Negative or neutral expected value');
  if (!breakdown.regret.low) concerns.push('Potential for future regret');
  if (!breakdown.biases.minimal) concerns.push(`${breakdown.biases.count} cognitive biases detected`);
  if (!breakdown.opportunityCost.noBetterAlt) concerns.push('A better alternative may exist');
  
  const nextActions = [];
  // Additional context for recommendation
  let additionalContext = '';
  if (score >= 75) {
    additionalContext = 'This is a well-reasoned decision with strong fundamentals.';
  } else if (score >= 55) {
    additionalContext = 'This decision has merit but requires a cooling-off period to verify your motivation.';
  } else if (score >= 40) {
    additionalContext = 'Significant concerns exist. A longer delay will help you gain clarity.';
  } else {
    additionalContext = 'The evidence strongly suggests this purchase would be a mistake.';
  }
  
  document.getElementById('recommendation-text').innerHTML = `
    ${recommendation.text}<br>
    <small style="margin-top: 12px; display: block; color: var(--color-text-secondary);">${additionalContext}</small>
  `;
  
  if (recommendation === THRESHOLDS.GO) {
    nextActions.push('Proceed with the purchase confidently');
    nextActions.push('Set calendar reminder to evaluate actual usage after 3 months');
    nextActions.push('Document your decision rationale for future reference');
    nextActions.push('Track actual costs vs. predicted costs');
  } else if (recommendation === THRESHOLDS.WAIT) {
    nextActions.push('Wait at least 48-72 hours before making final decision');
    nextActions.push('Test or trial the product/service if possible (free trials, demos)');
    nextActions.push('Research alternatives more thoroughly - create comparison spreadsheet');
    nextActions.push('Review identified biases and counter them with objective data');
    nextActions.push('Discuss with someone who won\'t benefit from your purchase');
  } else {
    nextActions.push('Skip this purchase - the numbers don\'t support it');
    nextActions.push('Explore the identified alternatives that may serve you better');
    nextActions.push('Save the money or redirect to higher-ROI investments');
    nextActions.push('Revisit this decision in 3-6 months with fresh perspective');
    nextActions.push('Journal why you wanted this - address the underlying need differently');
  }
  
  // Add detailed analysis insights if available
  if (appState.detailedAnalysis.costPerUseSnap.costPerUse > 0) {
    const cpuVerdict = appState.detailedAnalysis.costPerUseSnap.verdict;
    if (cpuVerdict === 'good') {
      supportingReasons.push(`Excellent cost-per-use: ₹${appState.detailedAnalysis.costPerUseSnap.costPerUse.toFixed(2)}`);
    } else if (cpuVerdict === 'high') {
      concerns.push(`High cost-per-use: ₹${appState.detailedAnalysis.costPerUseSnap.costPerUse.toFixed(2)}`);
    }
  }
  
  if (appState.detailedAnalysis.expectedValue.calculatedEV !== 0) {
    const evVerdict = appState.detailedAnalysis.expectedValue.verdict;
    if (evVerdict === 'positive') {
      supportingReasons.push(`Positive expected value: +₹${appState.detailedAnalysis.expectedValue.calculatedEV.toFixed(0)}`);
    } else if (evVerdict === 'negative') {
      concerns.push(`Negative expected value: ₹${appState.detailedAnalysis.expectedValue.calculatedEV.toFixed(0)}`);
    }
  }
  
  if (appState.detailedAnalysis.evThreshold.thresholdPercent > 0) {
    if (appState.detailedAnalysis.evThreshold.meetsThreshold) {
      supportingReasons.push(`Success chance (${appState.detailedAnalysis.expectedValue.successChance}%) exceeds threshold (${appState.detailedAnalysis.evThreshold.thresholdPercent}%)`);
    } else {
      concerns.push(`Success chance (${appState.detailedAnalysis.expectedValue.successChance}%) below threshold (${appState.detailedAnalysis.evThreshold.thresholdPercent}%)`);
    }
  }
  
  const insightsHTML = `
    <div class="insights-section strengths">
      <h3>✅ Supporting Reasons (${supportingReasons.length})</h3>
      <ul>
        ${supportingReasons.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
    <div class="insights-section concerns">
      <h3>⚠️ Key Concerns (${concerns.length})</h3>
      <ul>
        ${concerns.map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
    <div class="insights-section actions">
      <h3>🎯 Recommended Next Actions</h3>
      <ul>
        ${nextActions.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>
    <div class="insights-section" style="margin-top: 24px; padding: 16px; background: var(--color-secondary); border-radius: var(--radius-base); border-left: 4px solid var(--color-primary);">
      <h3 style="margin-bottom: 12px;">📊 Decision Quality Breakdown</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
        <div>
          <strong>Financial Rationality:</strong><br>
          <span style="color: ${breakdown.costPerUse.acceptable && breakdown.expectedValue.positive ? 'var(--color-success)' : 'var(--color-warning)'}">
            ${breakdown.costPerUse.acceptable && breakdown.expectedValue.positive ? 'Strong' : breakdown.costPerUse.acceptable || breakdown.expectedValue.positive ? 'Moderate' : 'Weak'}
          </span>
        </div>
        <div>
          <strong>Psychological Clarity:</strong><br>
          <span style="color: ${qa.biases.length <= 2 ? 'var(--color-success)' : qa.biases.length <= 5 ? 'var(--color-warning)' : 'var(--color-error)'}">
            ${qa.biases.length <= 2 ? 'Excellent' : qa.biases.length <= 5 ? 'Fair' : 'Poor'} (${qa.biases.length} biases)
          </span>
        </div>
        <div>
          <strong>Long-term Outlook:</strong><br>
          <span style="color: ${breakdown.regret.low ? 'var(--color-success)' : 'var(--color-warning)'}">
            ${breakdown.regret.low ? 'Positive' : 'Uncertain'}
          </span>
        </div>
        <div>
          <strong>Overall Confidence:</strong><br>
          <span style="color: ${rationalConfidence >= 70 ? 'var(--color-success)' : rationalConfidence >= 40 ? 'var(--color-warning)' : 'var(--color-error)'}">
            ${rationalConfidence.toFixed(0)}% Rational
          </span>
        </div>
      </div>
    </div>
  `;
  document.getElementById('insights-content').innerHTML = insightsHTML;
}

// Chart.js visualizations
function createScoreGauge(score) {
  const canvas = document.getElementById('score-gauge');
  const ctx = canvas.getContext('2d');
  
  // Clear any existing chart
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [
          score >= 80 ? '#059669' : score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : score >= 40 ? '#d97706' : '#ef4444',
          'rgba(200, 200, 200, 0.2)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      circumference: 180,
      rotation: 270,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    },
    plugins: [{
      id: 'gaugeText',
      afterDraw: (chart) => {
        const { ctx, chartArea: { width, height } } = chart;
        ctx.save();
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(score, width / 2, height / 2 + 20);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('out of 100', width / 2, height / 2 + 50);
        ctx.restore();
      }
    }]
  });
}

function createCostBreakdownChart(qa) {
  const canvas = document.getElementById('cost-breakdown-chart');
  const ctx = canvas.getContext('2d');
  
  // Clear any existing chart
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  const purchaseCost = qa.totalCost;
  const recurringCost = qa.monthlyRecurring * 12;
  const maintenanceCost = qa.yearlyMaintenance;
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Purchase Cost', 'Recurring (Yearly)', 'Maintenance'],
      datasets: [{
        data: [purchaseCost, recurringCost, maintenanceCost],
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Year 1 Cost Breakdown'
        }
      }
    }
  });
}

function createBiasHeatmap(detectedBiases) {
  const allBiases = [
    'FOMO', 'Social Proof', 'Authority', 'Reciprocity',
    'Anchoring', 'Scarcity', 'Cashless', 'Denomination',
    'Projection', 'Hyperbolic', 'Present Bias',
    'Loss Aversion', 'Optimism', 'Normalcy', 'Sunk Cost',
    'Overconfidence', 'Confirmation', 'Framing', 'Decision Fatigue', 'Mere Exposure',
    'Status Quo', 'Endowment', 'Decoy'
  ];
  
  const heatmapHTML = allBiases.map((bias, index) => {
    const biasId = detectedBiases[index] || '';
    const isDetected = detectedBiases.some(b => {
      const biasMap = {
        'fomo': 'FOMO',
        'social_proof': 'Social Proof',
        'authority': 'Authority',
        'reciprocity': 'Reciprocity',
        'anchoring': 'Anchoring',
        'scarcity': 'Scarcity',
        'cashless': 'Cashless',
        'denomination': 'Denomination',
        'projection': 'Projection',
        'hyperbolic_discount': 'Hyperbolic',
        'present_bias': 'Present Bias',
        'loss_aversion': 'Loss Aversion',
        'optimism': 'Optimism',
        'normalcy': 'Normalcy',
        'sunk_cost': 'Sunk Cost',
        'overconfidence': 'Overconfidence',
        'confirmation': 'Confirmation',
        'framing': 'Framing',
        'choice_overload': 'Decision Fatigue',
        'mere_exposure': 'Mere Exposure',
        'status_quo': 'Status Quo',
        'endowment': 'Endowment',
        'decoy': 'Decoy'
      };
      return biasMap[b] === bias;
    });
    
    return `<div class="bias-item ${isDetected ? 'detected' : 'not-detected'}">${bias}</div>`;
  }).join('');
  
  document.getElementById('bias-heatmap').innerHTML = heatmapHTML;
}

function startOver() {
  // Clear all charts
  const scoreGaugeCanvas = document.getElementById('score-gauge');
  if (scoreGaugeCanvas) {
    const chart = Chart.getChart(scoreGaugeCanvas);
    if (chart) chart.destroy();
  }
  
  const costChartCanvas = document.getElementById('cost-breakdown-chart');
  if (costChartCanvas) {
    const chart = Chart.getChart(costChartCanvas);
    if (chart) chart.destroy();
  }
  
  // Reset state
  appState.quickAssessment = {
    decisionWhat: '',
    decisionOutcome: '',
    totalBudget: 0,
    filter3Uses: '',
    filter2Benefits: '',
    filter1Regret: '',
    totalCost: 0,
    monthlyRecurring: 0,
    yearlyMaintenance: 0,
    yearlyUses: 0,
    costPerUse: 0,
    year1Cost: 0,
    year3Cost: 0,
    cpuAcceptable: '',
    goodChance: 0,
    goodValue: 0,
    badChance: 0,
    badCost: 0,
    expectedValue: 0,
    regret10Days: '',
    regret10Months: '',
    regret10Years: '',
    reversibilityOptions: [],
    biases: [],
    opportunityCost: '',
    alternativeBetter: '',
    boughtSimilar: '',
    similarItem: '',
    historicalUsage: 0,
    stillUsing: '',
    buyAgain: '',
    budgetPercent: 0,
    absorbLoss: '',
    resaleValue: 0,
    sunkCostRisk: 0
  };
  
  // Clear all form inputs
  document.querySelectorAll('input, textarea, select').forEach(input => {
    if (input.type === 'radio' || input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
  
  // Hide warnings
  document.querySelectorAll('.alert').forEach(alert => {
    alert.style.display = 'none';
  });
  
  goToLanding();
}

// Detailed analysis functions
function nextDetailedStep(step) {
  if (step === 1) {
    showPage('detailed-step-2');
    initializeCostsList();
  } else if (step === 2) {
    showPage('detailed-step-3');
    calculateDetailedCPU();
  } else if (step === 3) {
    showPage('detailed-step-4');
    // Auto-populate net loss
    const purchaseCost = appState.detailedAnalysis.purchaseCost || 0;
    const resaleValue = appState.detailedAnalysis.resaleValue || 0;
    const netLoss = purchaseCost - resaleValue;
    document.getElementById('detailed-net-loss').value = netLoss;
    document.getElementById('net-loss-calculation').textContent = 
      `Calculated: ₹${purchaseCost.toFixed(0)} - ₹${resaleValue.toFixed(0)} = ₹${netLoss.toFixed(0)}`;
    calculateDetailedEV();
  } else if (step === 4) {
    showPage('detailed-step-5');
    calculateDetailedThreshold();
  } else if (step === 5) {
    showPage('detailed-step-6');
    calculateSensitivityAnalysis();
  } else if (step === 6) {
    showPage('detailed-step-7');
    calculateRiskProfile();
  } else if (step === 7) {
    showPage('detailed-step-8');
  } else if (step === 8) {
    // Continue to quick assessment steps
    showPage('quick-step-2');
  }
}

function previousDetailedStep(step) {
  if (step === 2) {
    showPage('detailed-step-1');
  } else if (step === 3) {
    showPage('detailed-step-2');
  } else if (step === 4) {
    showPage('detailed-step-3');
  } else if (step === 5) {
    showPage('detailed-step-4');
  } else if (step === 6) {
    showPage('detailed-step-5');
  } else if (step === 7) {
    showPage('detailed-step-6');
  } else if (step === 8) {
    showPage('detailed-step-7');
  }
}

function initializeBenefitsList() {
  appState.detailedAnalysis.benefits = [];
  addBenefit();
}

function addBenefit() {
  const benefitIndex = appState.detailedAnalysis.benefits.length;
  appState.detailedAnalysis.benefits.push({
    description: '',
    frequency: 'Daily',
    importance: 3
  });
  
  const benefitHTML = `
    <div class="benefit-item" id="benefit-${benefitIndex}">
      <div class="form-group">
        <label class="form-label">Benefit Description <span class="helper-text">(What specific advantage do you gain?)</span></label>
        <input type="text" class="form-control" data-benefit="${benefitIndex}" data-field="description" placeholder="e.g., Portable for biking/travel" oninput="updateBenefit(${benefitIndex})">
        <div class="example-text">💡 <em>Example: "Portable for biking/travel" or "Action-friendly for hands-free shots"</em></div>
      </div>
      <div class="form-group">
        <label class="form-label">Frequency of Use <span class="helper-text">(How often will this benefit apply?)</span></label>
        <select class="form-control" data-benefit="${benefitIndex}" data-field="frequency" onchange="updateBenefit(${benefitIndex})">
          <option value="Daily">Daily - Every day</option>
          <option value="Weekly">Weekly - 1-2 times per week</option>
          <option value="Monthly" selected>Monthly - Few times per month</option>
          <option value="Rarely">Rarely - Special occasions only</option>
        </select>
        <div class="explanation-text">Higher frequency = more valuable benefit</div>
      </div>
      <div class="form-group">
        <label class="form-label">Importance (1-5) <span class="helper-text">(How valuable is this benefit?)</span></label>
        <input type="number" class="form-control" min="1" max="5" value="3" data-benefit="${benefitIndex}" data-field="importance" oninput="updateBenefit(${benefitIndex})">
        <div class="explanation-text">5 = critical/life-changing, 3 = nice to have, 1 = barely matters</div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <input type="text" class="form-control" data-benefit="${benefitIndex}" data-field="notes" placeholder="Any additional context..." oninput="updateBenefit(${benefitIndex})">
      </div>
      <button class="remove-btn" onclick="removeBenefit(${benefitIndex})">Remove</button>
    </div>
  `;
  
  document.getElementById('benefits-list').insertAdjacentHTML('beforeend', benefitHTML);
  calculateBenefitsScore();
}

function removeBenefit(index) {
  const element = document.getElementById(`benefit-${index}`);
  if (element) {
    element.remove();
  }
  appState.detailedAnalysis.benefits[index] = null;
  calculateBenefitsScore();
}

function updateBenefit(index) {
  const inputs = document.querySelectorAll(`[data-benefit="${index}"]`);
  const benefit = appState.detailedAnalysis.benefits[index];
  if (!benefit) return;
  
  inputs.forEach(input => {
    const field = input.dataset.field;
    if (field === 'importance') {
      benefit[field] = parseInt(input.value) || 3;
    } else {
      benefit[field] = input.value;
    }
  });
  
  calculateBenefitsScore();
}

function calculateBenefitsScore() {
  const score = calculateBenefitsScoreValue();
  document.getElementById('benefits-score').textContent = Math.round(score);
}

function calculateBenefitsScoreValue() {
  const benefits = appState.detailedAnalysis.benefits.filter(b => b !== null);
  let score = 0;
  
  benefits.forEach(benefit => {
    let frequencyMultiplier = 1;
    switch(benefit.frequency) {
      case 'Daily': frequencyMultiplier = 1.5; break;
      case 'Weekly': frequencyMultiplier = 1.2; break;
      case 'Monthly': frequencyMultiplier = 1; break;
      case 'Rarely': frequencyMultiplier = 0.5; break;
    }
    score += benefit.importance * frequencyMultiplier;
  });
  
  // Normalize to 50
  score = Math.min(50, score * 2);
  return score;
}

function initializeCostsList() {
  appState.detailedAnalysis.costs = [];
  addCost();
}

function addCost() {
  const costIndex = appState.detailedAnalysis.costs.length;
  appState.detailedAnalysis.costs.push({
    item: '',
    type: 'Money',
    value: '',
    weight: 3
  });
  
  const costHTML = `
    <div class="cost-item" id="cost-${costIndex}">
      <div class="form-group">
        <label class="form-label">Cost Item <span class="helper-text">(What specific cost are you incurring?)</span></label>
        <input type="text" class="form-control" data-cost="${costIndex}" data-field="item" placeholder="e.g., Learning curve / setup time" oninput="updateCost(${costIndex})">
        <div class="example-text">💡 <em>Example: "GoPro Hero 12" or "Learning curve / setup time"</em></div>
      </div>
      <div class="form-group">
        <label class="form-label">Type <span class="helper-text">(What kind of cost is this?)</span></label>
        <select class="form-control" data-cost="${costIndex}" data-field="type" onchange="updateCost(${costIndex})">
          <option value="Money">Money - ₹ spent</option>
          <option value="Time">Time - Hours invested</option>
          <option value="Energy">Energy - Mental/physical effort</option>
          <option value="Clutter">Clutter - Space/management burden</option>
        </select>
        <div class="explanation-text">Consider all types of costs, not just money</div>
      </div>
      <div class="form-group">
        <label class="form-label">Estimated Value <span class="helper-text">(Quantify the cost)</span></label>
        <input type="text" class="form-control" data-cost="${costIndex}" data-field="value" placeholder="e.g., '5-6 hours' or '₹5,000' or 'Moderate'" oninput="updateCost(${costIndex})">
        <div class="example-text">💡 <em>Example: "5-6 hours" or "₹5,000" or "Moderate burden"</em></div>
      </div>
      <div class="form-group">
        <label class="form-label">Pain/Weight (1-5) <span class="helper-text">(How painful is this cost?)</span></label>
        <input type="number" class="form-control" min="1" max="5" value="3" data-cost="${costIndex}" data-field="weight" oninput="updateCost(${costIndex})">
        <div class="explanation-text">5 = very painful/major burden, 3 = moderate impact, 1 = barely noticeable</div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (optional)</label>
        <input type="text" class="form-control" data-cost="${costIndex}" data-field="notes" placeholder="Any additional context..." oninput="updateCost(${costIndex})">
      </div>
      <button class="remove-btn" onclick="removeCost(${costIndex})">Remove</button>
    </div>
  `;
  
  document.getElementById('costs-list').insertAdjacentHTML('beforeend', costHTML);
  calculateCostsScore();
}

function removeCost(index) {
  const element = document.getElementById(`cost-${index}`);
  if (element) {
    element.remove();
  }
  appState.detailedAnalysis.costs[index] = null;
  calculateCostsScore();
}

function updateCost(index) {
  const inputs = document.querySelectorAll(`[data-cost="${index}"]`);
  const cost = appState.detailedAnalysis.costs[index];
  if (!cost) return;
  
  inputs.forEach(input => {
    const field = input.dataset.field;
    if (field === 'weight') {
      cost[field] = parseInt(input.value) || 3;
    } else {
      cost[field] = input.value;
    }
  });
  
  calculateCostsScore();
}

function calculateCostsScore() {
  const score = calculateCostsScoreValue();
  document.getElementById('costs-score').textContent = Math.round(score);
}

function calculateCostsScoreValue() {
  const costs = appState.detailedAnalysis.costs.filter(c => c !== null);
  let score = 0;
  
  costs.forEach(cost => {
    score += cost.weight;
  });
  
  // Normalize to 50
  score = Math.min(50, score * 2.5);
  return score;
}

function calculateProbability() {
  const baseRate = parseInt(document.getElementById('base-rate').value) || 50;
  const motivationAdj = parseInt(document.getElementById('motivation-adj').value) || 0;
  const overlapAdj = parseInt(document.getElementById('overlap-adj').value) || 0;
  const timeAdj = parseInt(document.getElementById('time-adj').value) || 0;
  const trackAdj = parseInt(document.getElementById('track-adj').value) || 0;
  
  let probability = baseRate + motivationAdj + overlapAdj + timeAdj + trackAdj;
  probability = Math.max(0, Math.min(100, probability));
  
  appState.detailedAnalysis.successProbability = probability;
  document.getElementById('probability-value').textContent = probability;
}

// Calculate Cost-per-Use for detailed analysis
function calculateDetailedCPU() {
  const yearlyUses = parseInt(document.getElementById('detailed-yearly-uses').value) || 5;
  const totalCost = parseFloat(document.getElementById('detailed-total-cost').value) || 0;
  const resaleValue = parseFloat(document.getElementById('detailed-resale-value').value) || 0;
  
  // Store resale value for later use
  appState.detailedAnalysis.resaleValue = resaleValue;
  appState.detailedAnalysis.purchaseCost = totalCost;
  
  if (yearlyUses > 0 && totalCost > 0) {
    const cpu = totalCost / yearlyUses;
    
    appState.detailedAnalysis.costPerUseSnap.realisticUses = yearlyUses;
    appState.detailedAnalysis.costPerUseSnap.totalCost = totalCost;
    appState.detailedAnalysis.costPerUseSnap.costPerUse = cpu;
    
    // Determine verdict
    let verdict = '';
    if (cpu < 500) {
      verdict = '✅ Good value';
      appState.detailedAnalysis.costPerUseSnap.verdict = 'good';
    } else if (cpu < 2000) {
      verdict = '⚠️ Acceptable';
      appState.detailedAnalysis.costPerUseSnap.verdict = 'acceptable';
    } else {
      verdict = '❌ High cost per use';
      appState.detailedAnalysis.costPerUseSnap.verdict = 'high';
    }
    
    document.getElementById('detailed-cpu-value').innerHTML = `
      <span style="font-size: 32px; color: ${cpu < 500 ? 'var(--color-success)' : cpu < 2000 ? 'var(--color-warning)' : 'var(--color-error)'}">₹${cpu.toFixed(2)}</span>
      <div style="margin-top: 8px; font-size: 18px;">${verdict}</div>
      <div style="margin-top: 12px; font-size: 14px; color: var(--color-text-secondary);">
        = ₹${totalCost.toFixed(0)} ÷ ${yearlyUses} uses<br>
        <strong>That means you're paying ₹${cpu.toFixed(2)} every time you use it</strong>
      </div>
    `;
    document.getElementById('detailed-cpu-display').style.display = 'block';
  }
}

// Calculate Expected Value for detailed analysis
function calculateDetailedEV() {
  const successChance = parseFloat(document.getElementById('detailed-success-chance').value) || 30;
  const benefitIfSuccess = parseFloat(document.getElementById('detailed-benefit-success').value) || 0;
  const netLoss = parseFloat(document.getElementById('detailed-net-loss').value) || 0;
  
  const p = successChance / 100;
  const goodOutcome = p * benefitIfSuccess;
  const badOutcome = (1 - p) * netLoss;
  const ev = goodOutcome - badOutcome;
  
  appState.detailedAnalysis.expectedValue.successChance = successChance;
  appState.detailedAnalysis.expectedValue.benefitIfSuccess = benefitIfSuccess;
  appState.detailedAnalysis.expectedValue.netLossIfFailure = netLoss;
  appState.detailedAnalysis.expectedValue.calculatedEV = ev;
  
  // Determine verdict
  let verdict = '';
  let verdictClass = '';
  if (ev > 0) {
    verdict = '✅ Positive EV - Creates value on average';
    verdictClass = 'ev-positive';
    appState.detailedAnalysis.expectedValue.verdict = 'positive';
  } else if (ev === 0) {
    verdict = '⚖️ Break-even - No value created or destroyed';
    verdictClass = '';
    appState.detailedAnalysis.expectedValue.verdict = 'zero';
  } else {
    verdict = '❌ Negative EV - Destroys value on average';
    verdictClass = 'ev-negative';
    appState.detailedAnalysis.expectedValue.verdict = 'negative';
  }
  
  const workingHTML = `
    <strong>Calculation:</strong><br>
    EV = (p × B) - ((1-p) × Loss)<br>
    = (${p.toFixed(2)} × ₹${benefitIfSuccess.toFixed(0)}) - (${(1-p).toFixed(2)} × ₹${netLoss.toFixed(0)})<br>
    = ₹${goodOutcome.toFixed(0)} - ₹${badOutcome.toFixed(0)}<br>
    = <strong>₹${ev.toFixed(0)}</strong><br><br>
    <div style="font-size: 16px; margin-top: 12px;">${verdict}</div>
  `;
  
  document.getElementById('detailed-ev-value').textContent = `₹${ev.toFixed(0)}`;
  document.getElementById('detailed-ev-value').className = verdictClass;
  document.getElementById('detailed-ev-working').innerHTML = workingHTML;
  document.getElementById('detailed-ev-display').style.display = 'block';
  
  // Trigger threshold calculation
  calculateDetailedThreshold();
}

// Calculate EV Threshold for detailed analysis
function calculateDetailedThreshold() {
  const successChance = parseFloat(document.getElementById('detailed-success-chance').value) || 30;
  const benefitIfSuccess = parseFloat(document.getElementById('detailed-benefit-success').value) || 0;
  const totalCost = parseFloat(document.getElementById('detailed-total-cost').value) || 0;
  const netLoss = parseFloat(document.getElementById('detailed-net-loss').value) || 0;
  
  // Estimate resale value as totalCost - netLoss
  const resaleValue = totalCost - netLoss;
  
  if (benefitIfSuccess > 0 && netLoss > 0) {
    const pStar = netLoss / (benefitIfSuccess + netLoss);
    const pStarPercent = (pStar * 100).toFixed(0);
    
    appState.detailedAnalysis.evThreshold.thresholdPercent = parseFloat(pStarPercent);
    appState.detailedAnalysis.evThreshold.meetsThreshold = successChance >= parseFloat(pStarPercent);
    
    const calcHTML = `
      = (${totalCost.toFixed(0)} - ${resaleValue.toFixed(0)}) / [${benefitIfSuccess.toFixed(0)} + ${netLoss.toFixed(0)}]<br>
      = ${netLoss.toFixed(0)} / ${(benefitIfSuccess + netLoss).toFixed(0)}<br>
      = <strong>${pStarPercent}%</strong><br><br>
      <div style="font-size: 16px;">👉 You need at least <strong style="color: var(--color-primary);">${pStarPercent}%</strong> success chance to break even</div>
    `;
    
    let verdictHTML = '';
    if (successChance >= parseFloat(pStarPercent)) {
      verdictHTML = `<div style="color: var(--color-success);">✅ Your estimate (${successChance}%) exceeds threshold (${pStarPercent}%) - Worth considering</div>`;
      appState.detailedAnalysis.evThreshold.verdict = 'worth';
    } else {
      verdictHTML = `<div style="color: var(--color-error);">❌ Your estimate (${successChance}%) below threshold (${pStarPercent}%) - Drop it</div>`;
      appState.detailedAnalysis.evThreshold.verdict = 'drop';
    }
    
    document.getElementById('detailed-threshold-calc').innerHTML = calcHTML;
    document.getElementById('detailed-threshold-verdict').innerHTML = verdictHTML;
  }
}

// Helper functions for visualizations
function createScoreProgression(breakdown) {
  const timelineHTML = `
    <div class="score-timeline">
      <h3>Score Progression</h3>
      <div class="timeline-item">
        <div class="timeline-dot ${breakdown.filter.passed ? 'pass' : 'fail'}">${breakdown.filter.passed ? '✓' : '✗'}</div>
        <div class="timeline-content">
          <div class="timeline-title">3-2-1 Filter</div>
          <div class="timeline-points">
            ${breakdown.filter.passed ? '+' : '+'}${breakdown.filter.points} points
            <span class="timeline-running-total">Running Total: ${breakdown.filter.points}</span>
          </div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot ${breakdown.costPerUse.acceptable ? 'pass' : 'fail'}">${breakdown.costPerUse.acceptable ? '✓' : '✗'}</div>
        <div class="timeline-content">
          <div class="timeline-title">Cost-per-Use</div>
          <div class="timeline-points">
            ${breakdown.costPerUse.acceptable ? '+' : '+'}${breakdown.costPerUse.points} points
            <span class="timeline-running-total">Running Total: ${breakdown.filter.points + breakdown.costPerUse.points}</span>
          </div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot ${breakdown.expectedValue.positive ? 'pass' : 'fail'}">${breakdown.expectedValue.positive ? '✓' : '✗'}</div>
        <div class="timeline-content">
          <div class="timeline-title">Expected Value</div>
          <div class="timeline-points">
            ${breakdown.expectedValue.positive ? '+' : '+'}${breakdown.expectedValue.points} points
            <span class="timeline-running-total">Running Total: ${breakdown.filter.points + breakdown.costPerUse.points + breakdown.expectedValue.points}</span>
          </div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot ${breakdown.regret.low ? 'pass' : 'fail'}">${breakdown.regret.low ? '✓' : '✗'}</div>
        <div class="timeline-content">
          <div class="timeline-title">Regret Test</div>
          <div class="timeline-points">
            ${breakdown.regret.low ? '+' : '+'}${breakdown.regret.points} points
            <span class="timeline-running-total">Running Total: ${breakdown.filter.points + breakdown.costPerUse.points + breakdown.expectedValue.points + breakdown.regret.points}</span>
          </div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot ${breakdown.biases.minimal ? 'pass' : 'fail'}">${breakdown.biases.minimal ? '✓' : '✗'}</div>
        <div class="timeline-content">
          <div class="timeline-title">Bias Scan (${breakdown.biases.count}/23)</div>
          <div class="timeline-points">
            +${breakdown.biases.points} points
            <span class="timeline-running-total">Running Total: ${breakdown.filter.points + breakdown.costPerUse.points + breakdown.expectedValue.points + breakdown.regret.points + breakdown.biases.points}</span>
          </div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot ${breakdown.opportunityCost.noBetterAlt ? 'pass' : 'fail'}">${breakdown.opportunityCost.noBetterAlt ? '✓' : '✗'}</div>
        <div class="timeline-content">
          <div class="timeline-title">Opportunity Cost</div>
          <div class="timeline-points">
            +${breakdown.opportunityCost.points} points
            <span class="timeline-running-total">FINAL SCORE: ${appState.results.score}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Insert after breakdown section
  const breakdownCard = document.querySelector('#breakdown-content').closest('.card');
  if (breakdownCard) {
    breakdownCard.insertAdjacentHTML('beforebegin', `<div class="card">${timelineHTML}</div>`);
  }
}

function createBiasCategoryCards(detectedBiases) {
  const categories = {
    'Social': ['fomo', 'social_proof', 'authority', 'reciprocity'],
    'Pricing': ['anchoring', 'scarcity', 'cashless', 'denomination'],
    'Temporal': ['projection', 'hyperbolic_discount', 'present_bias'],
    'Emotional': ['loss_aversion', 'optimism', 'normalcy', 'sunk_cost'],
    'Cognitive': ['overconfidence', 'confirmation', 'framing', 'choice_overload', 'mere_exposure'],
    'Behavioral': ['status_quo', 'endowment', 'decoy']
  };
  
  let cardsHTML = '<div class="bias-categories-grid">';
  
  Object.entries(categories).forEach(([name, biases]) => {
    const detected = biases.filter(b => detectedBiases.includes(b)).length;
    const total = biases.length;
    const percentage = (detected / total) * 100;
    
    let severity = 'low';
    if (percentage > 66) severity = 'severe';
    else if (percentage > 33) severity = 'high';
    else if (percentage > 0) severity = 'moderate';
    
    const icon = severity === 'severe' ? '🔴' : severity === 'high' ? '🟠' : severity === 'moderate' ? '🟡' : '🟢';
    
    cardsHTML += `
      <div class="bias-category-card ${severity}">
        <div class="bias-category-name">${name}</div>
        <div class="bias-category-count">${detected}/${total} ${icon}</div>
        <div class="bias-category-label">Detected</div>
      </div>
    `;
  });
  
  cardsHTML += '</div>';
  
  // Insert into bias heatmap section
  const heatmapSection = document.getElementById('bias-heatmap');
  if (heatmapSection) {
    heatmapSection.insertAdjacentHTML('beforebegin', cardsHTML);
  }
}

function createBudgetImpactMeter(cost, budget) {
  if (!budget || budget === 0) return;
  
  const impact = (cost / budget) * 100;
  let severity = 'low';
  let label = '🟢 Low impact - Safe';
  
  if (impact > 60) {
    severity = 'very-high';
    label = '🔴 Very high - Risky';
  } else if (impact > 40) {
    severity = 'high';
    label = '🟠 High - Caution needed';
  } else if (impact > 20) {
    severity = 'moderate';
    label = '🟡 Moderate - Acceptable';
  }
  
  const meterHTML = `
    <div class="budget-meter">
      <h3>Budget Impact: ${impact.toFixed(1)}%</h3>
      <div class="budget-meter-bar">
        <div class="budget-meter-fill ${severity}" style="width: ${Math.min(impact, 100)}%">
          ${impact.toFixed(1)}%
        </div>
      </div>
      <div class="budget-meter-status">${label}</div>
    </div>
  `;
  
  // Insert after budget impact metric
  const budgetMetric = document.getElementById('budget-impact');
  if (budgetMetric) {
    budgetMetric.closest('.card').insertAdjacentHTML('beforeend', meterHTML);
  }
}

function createCostBreakdownBars(qa) {
  const purchaseCost = qa.totalCost;
  const recurringCost = qa.monthlyRecurring * 12;
  const maintenanceCost = qa.yearlyMaintenance;
  const total = purchaseCost + recurringCost + maintenanceCost;
  
  if (total === 0) return;
  
  const barsHTML = `
    <div class="cost-breakdown-bars">
      <h3>Year 1 Cost Breakdown (₹${total.toFixed(0)})</h3>
      <div class="cost-bar-item">
        <div class="cost-bar-header">
          <span class="cost-bar-name">Purchase Cost</span>
          <span class="cost-bar-value">₹${purchaseCost.toFixed(0)} (${((purchaseCost/total)*100).toFixed(0)}%)</span>
        </div>
        <div class="cost-bar">
          <div class="cost-bar-fill purchase" style="width: ${(purchaseCost/total)*100}%">
            ${((purchaseCost/total)*100).toFixed(0)}%
          </div>
        </div>
      </div>
      <div class="cost-bar-item">
        <div class="cost-bar-header">
          <span class="cost-bar-name">Recurring (Yearly)</span>
          <span class="cost-bar-value">₹${recurringCost.toFixed(0)} (${((recurringCost/total)*100).toFixed(0)}%)</span>
        </div>
        <div class="cost-bar">
          <div class="cost-bar-fill recurring" style="width: ${(recurringCost/total)*100}%">
            ${((recurringCost/total)*100).toFixed(0)}%
          </div>
        </div>
      </div>
      <div class="cost-bar-item">
        <div class="cost-bar-header">
          <span class="cost-bar-name">Maintenance</span>
          <span class="cost-bar-value">₹${maintenanceCost.toFixed(0)} (${((maintenanceCost/total)*100).toFixed(0)}%)</span>
        </div>
        <div class="cost-bar">
          <div class="cost-bar-fill maintenance" style="width: ${(maintenanceCost/total)*100}%">
            ${((maintenanceCost/total)*100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Insert before chart
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.insertAdjacentHTML('beforebegin', barsHTML);
  }
}

function createRiskMatrix(qa) {
  // Determine probability (high if good chance > 50%)
  const highProb = qa.goodChance > 50;
  // Determine impact (high if total cost > 30% of budget or EV negative)
  const budgetImpact = qa.totalBudget > 0 ? (qa.year1Cost / qa.totalBudget) * 100 : 50;
  const highImpact = budgetImpact > 30 || qa.expectedValue < 0;
  
  let quadrantPosition = '';
  if (highImpact && highProb) quadrantPosition = 'danger';
  else if (highImpact && !highProb) quadrantPosition = 'caution';
  else if (!highImpact && highProb) quadrantPosition = 'monitor';
  else quadrantPosition = 'safe';
  
  const matrixHTML = `
    <div class="risk-matrix">
      <div class="risk-axis-label"></div>
      <div class="risk-axis-label">Low Probability</div>
      <div class="risk-axis-label">High Probability</div>
      
      <div class="risk-axis-label">High Impact</div>
      <div class="risk-quadrant caution">
        ⚠️ Caution
        ${quadrantPosition === 'caution' ? '<div class="risk-marker">📍</div>' : ''}
      </div>
      <div class="risk-quadrant danger">
        🚨 Danger
        ${quadrantPosition === 'danger' ? '<div class="risk-marker">📍</div>' : ''}
      </div>
      
      <div class="risk-axis-label">Low Impact</div>
      <div class="risk-quadrant safe">
        ✅ Safe
        ${quadrantPosition === 'safe' ? '<div class="risk-marker">📍</div>' : ''}
      </div>
      <div class="risk-quadrant monitor">
        ⚠️ Monitor
        ${quadrantPosition === 'monitor' ? '<div class="risk-marker">📍</div>' : ''}
      </div>
    </div>
  `;
  
  // Insert in risk section
  const riskCard = document.querySelectorAll('.card')[4]; // 5th card is risk
  if (riskCard) {
    riskCard.insertAdjacentHTML('beforeend', matrixHTML);
  }
}

// Warn before leaving if data entered
window.addEventListener('beforeunload', (e) => {
  const hasData = appState.quickAssessment.decisionWhat || 
                  appState.detailedAnalysis.benefits.length > 0;
  
  if (hasData && !document.getElementById('results-page').classList.contains('active')) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Initialize all tabs dynamically
function initializeAllTabs() {
  const container = document.getElementById('remaining-tabs');
  if (container.children.length > 0) return; // Already initialized
  
  const tabsHTML = generateAllTabsHTML();
  container.innerHTML = tabsHTML;
}

function generateAllTabsHTML() {
  return `
    <!-- Tab 2: Basic Info -->
    <div id="tab-basic-info" class="tab-content">
      <div class="container">
        <div class="tab-header">
          <h2>📊 Basic Information</h2>
          <p class="helper">Let's start with the fundamentals</p>
        </div>
        <div class="form-section">
          <div class="input-group">
            <label>What are you deciding on? <span class="required">*</span></label>
            <input type="text" id="decision-what-tab" class="form-control" placeholder="Example: Buy GoPro Hero 12">
            <div class="helper-text">💡 Be specific - include model/variant if applicable</div>
          </div>
          <div class="input-group">
            <label>What's your goal with this purchase? <span class="required">*</span></label>
            <textarea id="decision-outcome-tab" class="form-control" rows="3" placeholder="Example: Capture travel content"></textarea>
            <div class="helper-text">💡 Describe what you want to achieve</div>
          </div>
          <div class="input-group">
            <label>Total Available Budget (₹) <span class="required">*</span></label>
            <input type="number" id="total-budget-tab" class="form-control" min="0" placeholder="200000">
            <div class="helper-text">💡 How much can you afford to spend?</div>
          </div>
        </div>
        <div class="tab-navigation">
          <button class="btn btn--secondary" onclick="goToTab('start')“>← Back</button>
          <button class="btn btn--primary" onclick="saveAndNext('basic-info', 'financial')">Continue →</button>
        </div>
      </div>
    </div>

    <!-- Tab 3: Financial -->
    <div id="tab-financial" class="tab-content">
      <div class="container">
        <div class="tab-header">
          <h2>💰 Financial Details</h2>
          <p class="helper">All costs associated with this purchase</p>
        </div>
        <div class="form-section">
          <div class="input-group">
            <label>Purchase Cost (₹) <span class="required">*</span></label>
            <input type="number" id="purchase-cost-tab" class="form-control" min="0" placeholder="45000" oninput="updateFinancialCalculations()">
          </div>
          <div class="input-group">
            <label>Monthly Recurring Costs (₹)</label>
            <input type="number" id="monthly-recurring-tab" class="form-control" min="0" value="0" placeholder="500" oninput="updateFinancialCalculations()">
          </div>
          <div class="input-group">
            <label>Annual Maintenance (₹)</label>
            <input type="number" id="annual-maintenance-tab" class="form-control" min="0" value="0" placeholder="3000" oninput="updateFinancialCalculations()">
          </div>
          <div class="input-group highlight">
            <label>Expected Resale Value (₹) <span class="required">*</span></label>
            <input type="number" id="resale-value-tab" class="form-control" min="0" placeholder="20000" oninput="updateFinancialCalculations()">
          </div>
          <div class="input-group">
            <label>Realistic Yearly Uses <span class="required">*</span></label>
            <input type="number" id="yearly-uses-tab" class="form-control" min="1" placeholder="12" oninput="updateFinancialCalculations()">
          </div>
          <div class="calculation-display" id="financial-calcs" style="display: none;">
            <strong>Auto-Calculated:</strong><br>
            Year 1 Cost: <span id="y1-total">₹0</span><br>
            Cost per Use: <span id="cpu-display">₹0</span><br>
            Net Loss if Unused: <span id="netloss-display">₹0</span>
          </div>
        </div>
        <div class="tab-navigation">
          <button class="btn btn--secondary" onclick="goToTab('basic-info')“>← Back</button>
          <button class="btn btn--primary" onclick="saveAndNext('financial', 'benefits-costs')">Continue →</button>
        </div>
      </div>
    </div>

    <!-- Tab 4-12: Simplified for now -->
    <div id="tab-benefits-costs" class="tab-content"><div class="container"><h2>Benefits & Costs (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('financial')“>← Back</button><button class="btn btn--primary" onclick="goToTab('expected-value')">Continue →</button></div></div></div>
    <div id="tab-expected-value" class="tab-content"><div class="container"><h2>Expected Value (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('benefits-costs')“>← Back</button><button class="btn btn--primary" onclick="goToTab('sensitivity')">Continue →</button></div></div></div>
    <div id="tab-sensitivity" class="tab-content"><div class="container"><h2>Sensitivity Analysis (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('expected-value')“>← Back</button><button class="btn btn--primary" onclick="goToTab('risk')">Continue →</button></div></div></div>
    <div id="tab-risk" class="tab-content"><div class="container"><h2>Risk Analysis (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('sensitivity')“>← Back</button><button class="btn btn--primary" onclick="goToTab('biases')">Continue →</button></div></div></div>
    <div id="tab-biases" class="tab-content"><div class="container"><h2>Cognitive Biases (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('risk')“>← Back</button><button class="btn btn--primary" onclick="goToTab('regret')">Continue →</button></div></div></div>
    <div id="tab-regret" class="tab-content"><div class="container"><h2>Regret Assessment (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('biases')“>← Back</button><button class="btn btn--primary" onclick="goToTab('opportunity')">Continue →</button></div></div></div>
    <div id="tab-opportunity" class="tab-content"><div class="container"><h2>Opportunity Cost (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('regret')“>← Back</button><button class="btn btn--primary" onclick="goToTab('history-check')">Continue →</button></div></div></div>
    <div id="tab-history-check" class="tab-content"><div class="container"><h2>Historical Pattern Check (Coming Soon)</h2><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('opportunity')“>← Back</button><button class="btn btn--primary" onclick="goToTab('insights')">Generate Insights →</button></div></div></div>
    <div id="tab-insights" class="tab-content"><div class="container"><h2>💡 Complete Decision Insights</h2><p>Final dashboard with all analyses will be displayed here.</p><div class="tab-navigation"><button class="btn btn--secondary" onclick="goToTab('history-check')“>← Back</button><button class="btn btn--primary" onclick="goToLanding()">New Assessment</button></div></div></div>
    <div id="tab-history-archive" class="tab-content"><div class="container"><h2>📚 Decision History</h2><div id="history-content">No decisions yet</div><button class="btn btn--primary" onclick="goToLanding()">Back to Home</button></div></div>
  `;
}

function updateFinancialCalculations() {
  const purchase = parseFloat(document.getElementById('purchase-cost-tab')?.value) || 0;
  const monthly = parseFloat(document.getElementById('monthly-recurring-tab')?.value) || 0;
  const annual = parseFloat(document.getElementById('annual-maintenance-tab')?.value) || 0;
  const resale = parseFloat(document.getElementById('resale-value-tab')?.value) || 0;
  const uses = parseInt(document.getElementById('yearly-uses-tab')?.value) || 1;
  
  const y1Total = purchase + (monthly * 12) + annual;
  const cpu = y1Total / uses;
  const netLoss = purchase - resale;
  
  document.getElementById('y1-total').textContent = `₹${y1Total.toFixed(0)}`;
  document.getElementById('cpu-display').textContent = `₹${cpu.toFixed(2)}`;
  document.getElementById('netloss-display').textContent = `₹${netLoss.toFixed(0)}`;
  document.getElementById('financial-calcs').style.display = 'block';
}

// Tab-specific functions
let benefitCounterTab = 0;
let costCounterTab = 0;

function addBenefitTab() {
  benefitCounterTab++;
  const html = `
    <div class="benefit-item" id="benefit-tab-${benefitCounterTab}" style="margin-bottom: 16px; padding: 16px; background: var(--color-secondary); border-radius: var(--radius-base);">
      <input type="text" class="form-control" placeholder="Benefit description" style="margin-bottom: 8px;" data-benefit-tab="desc">
      <select class="form-control" style="margin-bottom: 8px;" data-benefit-tab="freq">
        <option value="4">Daily</option>
        <option value="3">Weekly</option>
        <option value="2" selected>Monthly</option>
        <option value="1">Rarely</option>
      </select>
      <input type="number" min="1" max="5" value="3" class="form-control" placeholder="Importance (1-5)" style="margin-bottom: 8px;" data-benefit-tab="importance">
      <button class="btn btn--outline" onclick="removeBenefitTab(${benefitCounterTab})" style="font-size: 12px; padding: 6px 12px;">× Remove</button>
    </div>
  `;
  document.getElementById('benefits-list-tab').insertAdjacentHTML('beforeend', html);
  updateBenefitsScoreTab();
}

function removeBenefitTab(id) {
  const el = document.getElementById(`benefit-tab-${id}`);
  if (el) el.remove();
  updateBenefitsScoreTab();
}

function updateBenefitsScoreTab() {
  let total = 0;
  document.querySelectorAll('#benefits-list-tab .benefit-item').forEach(item => {
    const freq = parseInt(item.querySelector('[data-benefit-tab="freq"]')?.value) || 2;
    const importance = parseInt(item.querySelector('[data-benefit-tab="importance"]')?.value) || 3;
    total += freq * importance;
  });
  document.getElementById('benefits-score-tab').textContent = Math.min(total, 50);
}

function addCostTab() {
  costCounterTab++;
  const html = `
    <div class="cost-item" id="cost-tab-${costCounterTab}" style="margin-bottom: 16px; padding: 16px; background: var(--color-secondary); border-radius: var(--radius-base);">
      <input type="text" class="form-control" placeholder="Cost description" style="margin-bottom: 8px;" data-cost-tab="desc">
      <select class="form-control" style="margin-bottom: 8px;" data-cost-tab="type">
        <option value="money">Money</option>
        <option value="time">Time</option>
        <option value="energy">Energy</option>
        <option value="clutter">Clutter</option>
      </select>
      <input type="number" min="1" max="5" value="3" class="form-control" placeholder="Pain level (1-5)" style="margin-bottom: 8px;" data-cost-tab="pain">
      <button class="btn btn--outline" onclick="removeCostTab(${costCounterTab})" style="font-size: 12px; padding: 6px 12px;">× Remove</button>
    </div>
  `;
  document.getElementById('costs-list-tab').insertAdjacentHTML('beforeend', html);
  updateCostsScoreTab();
}

function removeCostTab(id) {
  const el = document.getElementById(`cost-tab-${id}`);
  if (el) el.remove();
  updateCostsScoreTab();
}

function updateCostsScoreTab() {
  let total = 0;
  document.querySelectorAll('#costs-list-tab .cost-item').forEach(item => {
    const pain = parseInt(item.querySelector('[data-cost-tab="pain"]')?.value) || 3;
    total += pain;
  });
  document.getElementById('costs-score-tab').textContent = Math.min(total, 50);
}

function updateEVTab() {
  const baseRate = parseFloat(document.getElementById('base-rate-tab')?.value) || 50;
  const motivation = parseFloat(document.getElementById('motivation-adj-tab')?.value) || 0;
  const overlap = parseFloat(document.getElementById('overlap-adj-tab')?.value) || 0;
  const time = parseFloat(document.getElementById('time-adj-tab')?.value) || 0;
  const track = parseFloat(document.getElementById('track-adj-tab')?.value) || 0;
  
  let successProb = baseRate + motivation + overlap + time + track;
  successProb = Math.max(0, Math.min(100, successProb));
  
  document.getElementById('success-prob-tab').textContent = successProb.toFixed(0) + '%';
  
  const benefit = parseFloat(document.getElementById('benefit-success-tab')?.value) || 0;
  const purchase = parseFloat(document.getElementById('purchase-cost-tab')?.value) || 0;
  const resale = parseFloat(document.getElementById('resale-value-tab')?.value) || 0;
  const netLoss = purchase - resale;
  
  if (benefit > 0) {
    const p = successProb / 100;
    const goodOutcome = p * benefit;
    const badOutcome = (1 - p) * netLoss;
    const ev = goodOutcome - badOutcome;
    
    document.getElementById('ev-calculation-tab').innerHTML = `
      = (${successProb}% × ₹${benefit.toLocaleString()}) - (${(100-successProb)}% × ₹${netLoss.toLocaleString()})<br>
      = ₹${Math.round(goodOutcome).toLocaleString()} - ₹${Math.round(badOutcome).toLocaleString()}
    `;
    
    document.getElementById('ev-value-tab').textContent = (ev >= 0 ? '+' : '') + '₹' + Math.round(ev).toLocaleString();
    document.getElementById('ev-value-tab').style.color = ev > 0 ? 'var(--color-success)' : ev < 0 ? 'var(--color-error)' : 'var(--color-text)';
    
    let verdict = '';
    if (ev > 0) verdict = '✅ Positive EV - Creates value';
    else if (ev === 0) verdict = '⚖️ Break-even';
    else verdict = '❌ Negative EV - Destroys value';
    document.getElementById('ev-verdict-tab').textContent = verdict;
    
    document.getElementById('ev-result-tab').style.display = 'block';
    
    // Generate sensitivity table
    generateSensitivityTableTab(benefit, netLoss);
  }
}

function generateSensitivityTableTab(benefit, netLoss) {
  const probabilities = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  let tableHTML = `
    <h3>Expected Value at Different Success Rates</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr style="background: var(--color-secondary);">
          <th style="padding: 12px; border: 1px solid var(--color-border);">Success %</th>
          <th style="padding: 12px; border: 1px solid var(--color-border);">Expected Value</th>
          <th style="padding: 12px; border: 1px solid var(--color-border);">Verdict</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  probabilities.forEach(prob => {
    const p = prob / 100;
    const ev = (p * benefit) - ((1 - p) * netLoss);
    const verdict = ev > 0 ? '✅ Positive' : ev < 0 ? '❌ Negative' : '⚖️ Break-even';
    const color = ev > 0 ? 'var(--color-success)' : ev < 0 ? 'var(--color-error)' : 'var(--color-text)';
    
    tableHTML += `
      <tr>
        <td style="padding: 12px; border: 1px solid var(--color-border); text-align: center;">${prob}%</td>
        <td style="padding: 12px; border: 1px solid var(--color-border); text-align: right; color: ${color}; font-weight: bold;">₹${Math.round(ev).toLocaleString()}</td>
        <td style="padding: 12px; border: 1px solid var(--color-border);">${verdict}</td>
      </tr>
    `;
  });
  
  // Calculate threshold
  const threshold = (netLoss / (benefit + netLoss)) * 100;
  tableHTML += `
      </tbody>
    </table>
    <div style="margin-top: 16px; padding: 12px; background: var(--color-secondary); border-radius: var(--radius-base); border-left: 4px solid var(--color-primary);">
      <strong>Break-even Threshold:</strong> ${threshold.toFixed(1)}%<br>
      <small>You need at least ${threshold.toFixed(1)}% success rate for positive expected value</small>
    </div>
  `;
  
  document.getElementById('sensitivity-table-tab').innerHTML = tableHTML;
}

function updateBiasCountTab() {
  const checked = document.querySelectorAll('#biases-list-tab input[type="checkbox"]:checked').length;
  document.getElementById('bias-count-tab').textContent = checked;
  
  let severity = '';
  let color = '';
  if (checked <= 2) {
    severity = '🟢 Low contamination - Good decision clarity';
    color = 'var(--color-success)';
  } else if (checked <= 5) {
    severity = '🟡 Moderate contamination - Review carefully';
    color = 'var(--color-warning)';
  } else if (checked <= 10) {
    severity = '🟠 High contamination - Consider waiting';
    color = 'var(--color-error)';
  } else {
    severity = '🔴 Severe contamination - WAIT mandatory';
    color = 'var(--color-error)';
  }
  
  const severityEl = document.getElementById('bias-severity-tab');
  severityEl.textContent = severity;
  severityEl.style.color = color;
  severityEl.style.fontWeight = 'bold';
}

function toggleHistoryFieldsTab() {
  const value = document.getElementById('bought-similar-tab')?.value;
  const fields = document.getElementById('history-fields-tab');
  if (fields) {
    fields.style.display = value === 'yes' ? 'block' : 'none';
  }
}

function generateInsightsTab() {
  // Collect all data
  const data = {
    decision: document.getElementById('decision-what-tab')?.value || '',
    goal: document.getElementById('decision-outcome-tab')?.value || '',
    budget: parseFloat(document.getElementById('total-budget-tab')?.value) || 0,
    purchase: parseFloat(document.getElementById('purchase-cost-tab')?.value) || 0,
    resale: parseFloat(document.getElementById('resale-value-tab')?.value) || 0,
    uses: parseInt(document.getElementById('yearly-uses-tab')?.value) || 1,
    successProb: parseFloat(document.getElementById('success-prob-tab')?.textContent) || 50,
    benefit: parseFloat(document.getElementById('benefit-success-tab')?.value) || 0,
    biasCount: document.querySelectorAll('#biases-list-tab input:checked').length,
    benefitsScore: parseInt(document.getElementById('benefits-score-tab')?.textContent) || 0,
    costsScore: parseInt(document.getElementById('costs-score-tab')?.textContent) || 0
  };
  
  // Calculate metrics
  const netLoss = data.purchase - data.resale;
  const cpu = data.purchase / data.uses;
  const p = data.successProb / 100;
  const ev = (p * data.benefit) - ((1 - p) * netLoss);
  const budgetImpact = (data.purchase / data.budget) * 100;
  
  // Calculate score
  let score = 0;
  if (data.benefitsScore > data.costsScore) score += 20;
  if (cpu < 1000) score += 20;
  if (ev > 0) score += 25;
  if (data.biasCount <= 2) score += 15;
  else if (data.biasCount <= 5) score += 10;
  else if (data.biasCount <= 10) score += 5;
  if (budgetImpact < 30) score += 20;
  
  // Determine recommendation
  let recommendation = '';
  let recClass = '';
  if (score >= 80) {
    recommendation = '✅ STRONG GO';
    recClass = 'badge-strong-go';
  } else if (score >= 70) {
    recommendation = '✅ GO';
    recClass = 'badge-go';
  } else if (score >= 55) {
    recommendation = '⏳ WAIT 48H';
    recClass = 'badge-wait-48h';
  } else if (score >= 40) {
    recommendation = '⏳ WAIT 1 WEEK';
    recClass = 'badge-wait-1week';
  } else {
    recommendation = '❌ NO';
    recClass = 'badge-no';
  }
  
  // Generate dashboard HTML
  const dashboardHTML = `
    <div class="card" style="text-align: center; padding: 32px; background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-secondary) 100%);">
      <div style="font-size: 64px; font-weight: bold; color: var(--color-primary); margin-bottom: 16px;">${score}</div>
      <div style="font-size: 14px; color: var(--color-text-secondary); margin-bottom: 24px;">out of 100</div>
      <div class="recommendation-badge ${recClass}" style="display: inline-block; padding: 16px 32px; border-radius: 50px; font-size: 24px; font-weight: bold; margin-bottom: 12px;">${recommendation}</div>
      <div style="font-size: 16px; color: var(--color-text-secondary); margin-top: 12px;">
        ${score >= 70 ? 'This is a well-reasoned decision with strong fundamentals.' : score >= 55 ? 'This decision has merit but requires a cooling-off period.' : score >= 40 ? 'Significant concerns exist. A longer delay will help.' : 'The evidence suggests this purchase would be a mistake.'}
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title financial">💰 Financial Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Purchase Cost</div>
          <div class="metric-value">₹${data.purchase.toLocaleString()}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cost per Use</div>
          <div class="metric-value" style="color: ${cpu < 500 ? 'var(--color-success)' : cpu < 1000 ? 'var(--color-warning)' : 'var(--color-error)'}">₹${cpu.toFixed(0)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Expected Value</div>
          <div class="metric-value" style="color: ${ev > 0 ? 'var(--color-success)' : 'var(--color-error)'}">${ev >= 0 ? '+' : ''}₹${Math.round(ev).toLocaleString()}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Budget Impact</div>
          <div class="metric-value" style="color: ${budgetImpact < 20 ? 'var(--color-success)' : budgetImpact < 40 ? 'var(--color-warning)' : 'var(--color-error)'}">${budgetImpact.toFixed(1)}%</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title psychological">🧠 Psychological Analysis</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Cognitive Biases</div>
          <div class="metric-value" style="color: ${data.biasCount <= 2 ? 'var(--color-success)' : data.biasCount <= 5 ? 'var(--color-warning)' : 'var(--color-error)'}">${data.biasCount}/23</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Success Probability</div>
          <div class="metric-value">${data.successProb.toFixed(0)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Benefits Score</div>
          <div class="metric-value" style="color: var(--color-success)">${data.benefitsScore}/50</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Costs Score</div>
          <div class="metric-value" style="color: var(--color-error)">${data.costsScore}/50</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title insights">💡 Key Insights</h2>
      <div class="insights-section strengths">
        <h3>✅ Supporting Reasons</h3>
        <ul>
          ${ev > 0 ? '<li>Positive expected value of +₹' + Math.round(ev).toLocaleString() + '</li>' : ''}
          ${cpu < 1000 ? '<li>Acceptable cost per use of ₹' + cpu.toFixed(0) + '</li>' : ''}
          ${data.benefitsScore > data.costsScore ? '<li>Benefits outweigh costs (' + data.benefitsScore + ' vs ' + data.costsScore + ')</li>' : ''}
          ${data.biasCount <= 2 ? '<li>Minimal cognitive biases detected</li>' : ''}
          ${budgetImpact < 30 ? '<li>Low budget impact (' + budgetImpact.toFixed(1) + '%)</li>' : ''}
        </ul>
      </div>
      <div class="insights-section concerns">
        <h3>⚠️ Key Concerns</h3>
        <ul>
          ${ev <= 0 ? '<li>Negative or zero expected value</li>' : ''}
          ${cpu >= 1000 ? '<li>High cost per use (₹' + cpu.toFixed(0) + ')</li>' : ''}
          ${data.costsScore >= data.benefitsScore ? '<li>Costs equal or exceed benefits</li>' : ''}
          ${data.biasCount > 5 ? '<li>High bias contamination (' + data.biasCount + ' biases)</li>' : ''}
          ${budgetImpact >= 40 ? '<li>High budget impact (' + budgetImpact.toFixed(1) + '%)</li>' : ''}
        </ul>
      </div>
      <div class="insights-section actions">
        <h3>🎯 Recommended Actions</h3>
        <ul>
          ${score >= 70 ? '<li>Proceed with the purchase confidently</li><li>Set calendar reminder to evaluate usage after 3 months</li><li>Track actual costs vs predicted costs</li>' : ''}
          ${score >= 40 && score < 70 ? '<li>Wait 48-72 hours before making final decision</li><li>Test or trial the product if possible</li><li>Review identified biases with objective data</li>' : ''}
          ${score < 40 ? '<li>Skip this purchase - the numbers don\'t support it</li><li>Explore alternatives that may serve you better</li><li>Save the money or redirect to higher-ROI investments</li>' : ''}
        </ul>
      </div>
    </div>
  `;
  
  document.getElementById('insights-dashboard-tab').innerHTML = dashboardHTML;
  goToTab('insights');
  showToast('✅ Complete analysis generated!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  goToTab('start');
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInUp {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});