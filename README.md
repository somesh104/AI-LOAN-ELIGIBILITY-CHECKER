# 🏦 CrediPulse.AI — Intelligent BFSI Loan Eligibility & Financial Platform

> **Academic Project Submission**  
> **Domain:** Banking, Financial Services & Insurance (BFSI) / FinTech  
> **Tech Stack:** HTML5, CSS3 (Dark Glassmorphism), Vanilla JavaScript (ES6+), Anthropic Claude 3.5 AI, Google Sheets API (Google Apps Script), Chart.js.

---

## 📌 Executive Summary / Abstract

In modern retail banking and financial services, personal loan, mortgage, and auto loan underwriting often suffers from opaque approval criteria, slow manual assessment, and fragmented financial tools. 

**CrediPulse.AI** is an AI-powered, single-interface BFSI web platform engineered to streamline consumer financial decision-making. Featuring a **futuristic 3D WebGL holographic cockpit** and **dark glassmorphism aesthetic**, the platform unifies four essential banking modules:
1. **Interactive 3D WebGL Holographic Canvas:** Powered by **Three.js**, rendering a rotating cyan wireframe Torus Knot, floating icosahedron crystals, an 850-particle cyber constellation, and a dynamic 3D camera that tilts smoothly with cursor parallax.
2. **True 3D Interactive Card Parallax Tilt:** Every glassmorphism card physicalizes with gyroscopic 3D perspective (`perspective: 1200px`), multi-layer Z-depth elevation (`transform: translateZ(30px)`), and moving specular light reflections (dynamic glare sheen).
3. **AI Loan Eligibility Checker:** Calculates applicant borrowing capacity using real-world **FOIR (Fixed Obligation to Income Ratio)**, debt-to-income benchmarks, and a multi-factor approval prediction algorithm.
4. **Credit Score & Risk Analyzer:** Features an interactive semi-circular gauge meter with metallic 3D bezel, 5 weighted credit pillar breakdowns, and an interactive **"What-If" credit scenario simulator**.
5. **Advanced EMI & Amortization Calculator:** Delivers real-time monthly EMI computation, a Chart.js donut chart of principal vs. interest, prepayment optimization modeling, and full monthly/yearly amortization tables with CSV export.
6. **Claude AI Financial Intelligence Advisor:** Leverages Anthropic's Claude 3.5 Sonnet generative AI API combined with an autonomous offline BFSI heuristic expert engine to generate tailored loan restructuring advice and 360° financial diagnostics.
7. **Google Sheets Cloud Storage:** Dynamically persists, retrieves, and syncs applicant financial dossiers to any Google Sheet in real time via an asynchronous Google Apps Script Webhook.

---

## 📐 Mathematical Models & BFSI Underwriting Formulas

### 1. Equated Monthly Installment (EMI) Formula
The monthly loan payment is derived from standard compound interest amortization:

$$E = P \times r \times \frac{(1 + r)^n}{(1 + r)^n - 1}$$

Where:
- $E$ = Monthly Loan EMI
- $P$ = Principal Loan Amount
- $r$ = Monthly interest rate ($\frac{\text{Annual Rate}}{12 \times 100}$)
- $n$ = Loan tenure in total months ($\text{Years} \times 12$)

---

### 2. Fixed Obligation to Income Ratio (FOIR)
In commercial banking underwriting, FOIR determines the percentage of an applicant's net income dedicated to servicing debt obligations:

$$\text{FOIR} = \left( \frac{\text{Existing Monthly EMIs} + \text{Proposed New Loan EMI}}{\text{Net Monthly Disposable Income}} \right) \times 100$$

- **Safe Zone (≤ 50%):** Standard automated retail approval threshold.
- **Caution Zone (50% – 60%):** Requires additional collateral, tenure extension, or co-borrower.
- **High Risk (> 60%):** Breaches permissible debt capacity; flagged for conditional review or rejection.

---

### 3. Maximum Eligible Loan Capacity (Reverse EMI)
The maximum loan capital a bank can safely disburse is calculated inversely:

$$\text{Max Available Monthly EMI} = (\text{Total Income} \times \text{Permissible FOIR Cap}) - \text{Existing EMIs}$$

$$\text{Max Eligible Loan} = \text{Max Available Monthly EMI} \times \frac{(1 + r)^n - 1}{r \times (1 + r)^n}$$

---

### 4. Multi-Factor Approval Probability Matrix
Approval probability ($0\% - 100\%$) is calculated across 5 weighted credit risk dimensions:
- **Credit Bureau Score (35% Weight):** Tiered scoring based on CIBIL/FICO rating.
- **FOIR / Debt Burden (30% Weight):** Safety margin below the 50% cap.
- **Employment Stability (15% Weight):** Categorized by PSU/Govt, Corporate MNC, Self-Employed Professional, or Business Owner.
- **Retirement / Age Margin (10% Weight):** Buffer between loan maturity and retirement age (60-65 years).
- **Co-Borrower Presence (10% Weight):** Co-applicant income inclusion increases allowable FOIR cap by +5%.

---

## 🌟 Core Modules & Architecture

```
ai-loan-eligibility-checker/
│
├── index.html                  # Single-Page Application with responsive dark glassmorphism layout
│
├── css/
│   ├── style.css               # Core styling, ambient radial glow orbs, CSS variables, typography
│   └── components.css          # Glassmorphism cards, sliders, gauges, radial meters, chat & modals
│
├── js/
│   ├── app.js                  # App coordinator, currency engine (INR/USD/EUR/GBP), toast system
│   ├── loan-checker.js         # BFSI underwriting algorithm, FOIR/DTI logic & decision engine
│   ├── credit-analyzer.js      # Speedometer SVG gauge, 5 credit pillars, What-If simulator, quiz
│   ├── emi-calculator.js       # EMI financial math, Chart.js donut chart, amortization table & CSV
│   ├── ai-advisor.js           # Anthropic Claude 3.5 API client + offline BFSI neural heuristic
│   └── storage.js              # Google Sheets Webhook dispatcher, localStorage DB & CSV exporter
│
├── google-sheets/
│   ├── Code.gs                 # Google Apps Script for automated cloud sheet appending & styling
│   └── SETUP_GUIDE.md          # 2-minute step-by-step setup documentation for Google Sheets
│
└── README.md                   # Complete academic documentation and viva preparation guide
```

---

## 💻 Tech Stack & Tools

| Component | Technology | Rationale |
|---|---|---|
| **Frontend Markup** | HTML5 Semantic Elements | High accessibility, zero build step needed |
| **Styling & Theme** | CSS3 (Dark Glassmorphism) | `backdrop-filter: blur(20px)`, glowing neon accents |
| **Business Logic** | Vanilla JavaScript (ES6+) | Native performance, modular code, zero frameworks |
| **Visual Charts** | Chart.js 4.4 + Inline SVG | Responsive principal vs interest donut visualizer |
| **Micro-Animations** | Canvas-Confetti | Joyful visual celebration on prime loan approvals |
| **Generative AI** | Anthropic Claude 3.5 Sonnet | Real-time financial advisory & loan optimization |
| **Cloud Database** | Google Sheets & Apps Script | Transparent, zero-cost, persistent spreadsheet storage |
| **Local Fallback** | HTML5 LocalStorage API | 100% offline functionality during viva presentations |

---

## 🚀 How to Run the Project Locally

No `npm install` or complex build tools are required!

### Option 1: Direct Browser Launch
1. Navigate to the project directory:
   ```
   C:\Users\Shrivardhan\.gemini\antigravity\scratch\ai-loan-eligibility-checker\
   ```
2. Double-click **`index.html`** to launch it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended)
Using Python or PowerShell:
```powershell
# From the project directory:
python -m http.server 8080
# Or using Node.js:
npx serve .
```
Then visit `http://localhost:8080` in your browser.

---

## 🎓 Academic Viva Questions & Answers

**Q1: Why did you choose a Dark Glassmorphism aesthetic?**  
*Answer:* Dark glassmorphism offers a cutting-edge aesthetic suited for FinTech and BFSI platforms. Frosted translucent panels (`backdrop-filter: blur(20px)`) reduce visual clutter, increase contrast for numeric data points, and highlight critical financial indicators through glowing neon accents.

**Q2: How does the application handle Google Sheets integration without a dedicated backend server?**  
*Answer:* The platform leverages **Google Apps Script deployed as a Web App**. The frontend sends an asynchronous `POST` request with JSON payloads. The Google Apps Script receives the submission via its `doPost(e)` hook, formats table headers if blank, applies conditional cell background coloring, and appends the new record.

**Q3: What happens if there is no internet or no Claude API key available during viva?**  
*Answer:* The platform is architected with **graceful offline degradation**. If no Anthropic API key is supplied, the platform triggers its **CrediPulse Autonomous BFSI Heuristic Engine**. This built-in expert system parses user queries and eligibility numbers to produce formatted, contextual financial strategies with zero downtime.

**Q4: What is FOIR and why is it preferred over simple Debt-to-Income (DTI)?**  
*Answer:* In retail banking, DTI often only considers gross obligations against gross income. **FOIR (Fixed Obligation to Income Ratio)** evaluates verified *net in-hand disposable salary* against all confirmed fixed debt obligations (credit cards, existing personal loans, home mortgages). This gives banks a realistic view of cash-flow solvency.
