/**
 * ============================================================================
 * CrediPulse AI — Google Apps Script for Google Sheets Cloud Integration
 * ============================================================================
 * Instructions:
 * 1. Open your Google Sheet (e.g. at https://sheets.new).
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this entire file.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select type 'Web app'.
 * 6. Set Description: "CrediPulse AI Webhook".
 * 7. Set 'Execute as': "Me" (your Google account).
 * 8. Set 'Who has access': "Anyone" (crucial for client-side API requests).
 * 9. Click 'Deploy' and copy the generated Web App URL.
 * 10. Paste the URL into the CrediPulse AI Settings modal in the web app!
 * ============================================================================
 */

// Handle incoming HTTP POST requests from CrediPulse AI
function doPost(e) {
  try {
    var sheet = getOrCreateTargetSheet();
    var data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = { raw: e.postData.contents };
      }
    }

    // Ping / Test connection handshake
    if (data.action === 'test_ping') {
      return createJsonResponse({
        status: 'success',
        message: 'CrediPulse AI Handshake Successful! Google Sheet is connected and active.',
        timestamp: new Date().toISOString()
      });
    }

    // Append standard financial assessment record
    var newRow = [
      data.timestamp || new Date().toISOString(),
      data.name || 'Anonymous',
      data.email || 'N/A',
      data.age || '',
      data.employment || 'N/A',
      data.monthlyIncome || 0,
      data.existingEmis || 0,
      data.loanType || 'Personal',
      data.requestedAmount || 0,
      data.tenureYears || 0,
      data.creditScore || 0,
      data.foirPercentage ? data.foirPercentage + '%' : '0%',
      data.status || 'PENDING',
      data.approvalProbability ? data.approvalProbability + '%' : '0%',
      data.maxEligibleLoan || 0,
      data.calculatedEmi || 0,
      data.currency || 'INR'
    ];

    sheet.appendRow(newRow);

    // Apply color formatting to status column
    var lastRowIndex = sheet.getLastRow();
    var statusCell = sheet.getRange(lastRowIndex, 13);
    var statusVal = String(data.status || '').toUpperCase();

    if (statusVal === 'APPROVED') {
      statusCell.setBackground('#d1fae5'); // Light emerald
      statusCell.setFontColor('#065f46');
    } else if (statusVal === 'CONDITIONAL') {
      statusCell.setBackground('#fef3c7'); // Light amber
      statusCell.setFontColor('#92400e');
    } else if (statusVal === 'REJECTED') {
      statusCell.setBackground('#fee2e2'); // Light rose
      statusCell.setFontColor('#991b1b');
    }

    return createJsonResponse({
      status: 'success',
      message: 'Loan record appended successfully to Google Sheets.',
      rowNumber: lastRowIndex,
      applicant: data.name
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

// Handle GET requests (e.g. browser verification)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      service: 'CrediPulse AI Google Sheets Webhook Gateway',
      status: 'ONLINE',
      instructions: 'Send HTTP POST requests with JSON payload to record submissions.'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Helper: Get or initialize sheet with headers
function getOrCreateTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = 'Loan_Submissions';
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // If first row is blank, setup professional table headers
  if (sheet.getLastRow() === 0) {
    var headers = [
      'Timestamp (ISO)',
      'Applicant Name',
      'Email Address',
      'Age',
      'Employment Type',
      'Monthly Income',
      'Existing EMIs',
      'Loan Category',
      'Requested Amount',
      'Tenure (Years)',
      'Credit Score',
      'FOIR (%)',
      'Underwriting Status',
      'Approval Chance (%)',
      'Max Eligible Loan',
      'Calculated Monthly EMI',
      'Currency'
    ];

    sheet.appendRow(headers);

    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (var col = 1; col <= headers.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }

  return sheet;
}

// Helper to return standardized JSON output with CORS compatibility
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
