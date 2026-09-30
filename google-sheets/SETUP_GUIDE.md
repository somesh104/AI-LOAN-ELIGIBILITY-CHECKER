# 📊 Google Sheets Cloud Integration Guide — CrediPulse AI

This guide walks you through connecting your **CrediPulse AI** web platform to a live Google Sheet in under 2 minutes using **Google Apps Script**.

---

## 🚀 Step-by-Step Setup (2 Minutes)

### Step 1: Create a Blank Google Sheet
1. Open your browser and navigate to [https://sheets.new](https://sheets.new) (or open Google Drive and create a New Google Sheet).
2. Name the sheet: **`CrediPulse AI Loan Records`**.

---

### Step 2: Open the Apps Script Editor
1. In the Google Sheets top menu, click **Extensions** > **Apps Script**.
2. A new tab will open with the Apps Script code editor.

---

### Step 3: Paste the Ready-to-Use Webhook Code
1. Delete any sample code inside `Code.gs` (`function myFunction() { ... }`).
2. Open the file [`google-sheets/Code.gs`](./Code.gs) from this project folder.
3. Copy all of its contents and paste it into the Apps Script editor.
4. Click the **Save** icon (diskette icon) or press `Ctrl + S`.

---

### Step 4: Deploy as a Web App
1. At the top right of the Apps Script window, click the blue **Deploy** button > **New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and choose **Web app**.
3. Fill in the fields:
   - **Description:** `CrediPulse AI Webhook`
   - **Execute as:** `Me (your_email@gmail.com)`
   - **Who has access:** Select **`Anyone`** *(⚠️ Critical: Do not select "Only myself", otherwise client requests from the browser will be blocked).*
4. Click **Deploy**.
5. Google will ask for authorization on the first deploy:
   - Click **Authorize access**.
   - Choose your Google account.
   - Click **Advanced** > **Go to Untitled project (unsafe)** (standard for personal Google Scripts).
   - Click **Allow**.

---

### Step 5: Copy the Web App URL & Connect
1. Copy the generated **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycbx.../exec`).
2. Open the **CrediPulse AI** platform in your browser.
3. Click the **Settings (gear icon)** at the top right of the navigation bar.
4. Paste the copied URL into the **Google Apps Script Web App URL** input field.
5. Click **"Test Connection"** to verify the handshake. You will receive an immediate confirmation toast.
6. Click **"Save Settings"**.

---

## 🎯 Verification & Features

- **Live Auto-Styling:** The script automatically generates a dedicated `Loan_Submissions` tab with formatted dark navy headers (`#0f172a`), frozen row 1, and auto-colored status cells (Green for `APPROVED`, Yellow for `CONDITIONAL`, Red for `REJECTED`).
- **One-Click Syncing:** In **Module 5 (Records & Sheets)**, click **"Sync All to Google Sheets"** to bulk-upload all stored submissions at once.
- **Fail-Safe Offline Mode:** If you do not connect a Google Sheet, CrediPulse AI stores all applications in the browser's persistent `localStorage` and allows full CSV exports with zero disruptions!
