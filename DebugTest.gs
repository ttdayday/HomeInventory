/**
 * Debug and Test Functions
 * Use these for troubleshooting and one-off fixes
 */

/**
 * 🔧 FIX: Removes ALL validation errors in Main Inventory
 * - Column A (Item Name): Removes incorrect validation
 * - Column C (Box): Removes incorrect validation
 * - Column G (Remove?): Inserts proper checkboxes
 *
 * Run this from Script Editor
 */
function fixAllValidationErrors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  if (!inventorySheet) {
    ui.alert('Error', 'Main Inventory sheet not found.', ui.ButtonSet.OK);
    return;
  }

  const lastRow = inventorySheet.getLastRow();

  if (lastRow < 2) {
    ui.alert('Info', 'No data rows to fix.', ui.ButtonSet.OK);
    return;
  }

  const response = ui.alert(
    'Fix All Validation Errors',
    `This will fix validation errors in Main Inventory:\n\n` +
    `• Column A (Item Name): Remove invalid validation\n` +
    `• Column C (Box): Remove invalid validation\n` +
    `• Column G (Remove?): Insert proper checkboxes\n\n` +
    `Rows affected: ${lastRow - 1}\n\n` +
    'Continue?',
    ui.ButtonSet.OK_CANCEL
  );

  if (response !== ui.Button.OK) {
    ui.alert('Cancelled', 'No changes were made.', ui.ButtonSet.OK);
    return;
  }

  // FIX 1: Remove validation from Column A (Item Name) - should NOT have validation
  Logger.log('Removing validation from Column A (Item Name)...');
  inventorySheet.getRange('A2:A1000').clearDataValidations();

  // FIX 2: Remove validation from Column C (Box) - should NOT have validation
  Logger.log('Removing validation from Column C (Box)...');
  inventorySheet.getRange('C2:C1000').clearDataValidations();

  // FIX 3: Fix Column G (Remove?) checkboxes
  Logger.log('Fixing Column G (Remove?) checkboxes...');
  const checkboxRange = inventorySheet.getRange(2, 7, lastRow - 1, 1);

  // First, clear any existing content and validation
  checkboxRange.clearContent();
  checkboxRange.clearDataValidations();

  // Insert actual checkboxes (this creates proper checkbox controls)
  checkboxRange.insertCheckboxes();

  // The insertCheckboxes() method creates checkboxes that are unchecked by default

  ui.alert(
    'Fix Complete!',
    `✅ Fixed validation errors:\n\n` +
    `• Column A: Validation removed\n` +
    `• Column C: Validation removed\n` +
    `• Column G: ${lastRow - 1} checkboxes inserted (unchecked)\n\n` +
    'All red triangle errors should be gone now!',
    ui.ButtonSet.OK
  );

  Logger.log(`Fixed validation errors for ${lastRow - 1} rows`);
}

/**
 * Displays debug info about Main Inventory structure
 */
function debugMainInventoryStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  if (!inventorySheet) {
    Logger.log('ERROR: Main Inventory sheet not found');
    return;
  }

  const lastRow = inventorySheet.getLastRow();
  const lastCol = inventorySheet.getLastColumn();

  Logger.log('=== Main Inventory Debug Info ===');
  Logger.log(`Last Row: ${lastRow}`);
  Logger.log(`Last Column: ${lastCol}`);

  // Check headers
  const headers = inventorySheet.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log(`Headers (${headers.length}): ${headers.join(', ')}`);

  // Check first 3 data rows
  if (lastRow > 1) {
    const sampleRows = Math.min(3, lastRow - 1);
    const sampleData = inventorySheet.getRange(2, 1, sampleRows, lastCol).getValues();

    Logger.log('\n=== Sample Data (first 3 rows) ===');
    sampleData.forEach((row, index) => {
      Logger.log(`Row ${index + 2}: ${JSON.stringify(row)}`);
      Logger.log(`  - Column G (Remove?) type: ${typeof row[6]}, value: "${row[6]}"`);
    });
  }

  // Check validation rules on column G
  Logger.log('\n=== Column G Validation ===');
  const validationRange = inventorySheet.getRange('G2:G10');
  const validationRules = validationRange.getDataValidations();

  validationRules.forEach((ruleRow, index) => {
    ruleRow.forEach((rule, colIndex) => {
      if (rule) {
        Logger.log(`Row ${index + 2}: Has validation rule - ${rule.getCriteriaType()}`);
      } else {
        Logger.log(`Row ${index + 2}: No validation rule`);
      }
    });
  });

  Logger.log('\n=== Debug Complete ===');
  ss.toast('Debug info logged. Check View > Logs (Ctrl+Enter)', 'Debug Complete', 5);
}

/**
 * Test function - mimics populatePendingChanges
 */
function testMinimalWrite() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName('Pending Changes');

  Logger.log('Starting test...');
  Logger.log('Sheet name: ' + pendingSheet.getName());
  Logger.log('Last row before: ' + pendingSheet.getLastRow());

  // Create test data EXACTLY like populatePendingChanges does
  const pendingData = [
    [
      false,              // Checkbox
      'ADD',              // Action
      'Test Hammer',      // Item name
      '',                 // Current loc
      '',                 // Current box
      'P',                // New loc
      '5',                // New box
      1,                  // Quantity
      'Test Hammer at P-5', // Notes
      new Date(),         // Timestamp
      'Pending'           // Status
    ],
    [
      false,
      'ADD',
      'Test Screwdriver',
      '',
      '',
      '4',
      '10',
      1,
      'Test Screwdriver at 4-10',
      new Date(),
      'Pending'
    ]
  ];

  Logger.log('Pending data length: ' + pendingData.length);
  Logger.log('Pending data[0]: ' + JSON.stringify(pendingData[0]));

  const startRow = pendingSheet.getLastRow() + 1;
  Logger.log('Will write to row: ' + startRow);

  try {
    pendingSheet.getRange(startRow, 1, pendingData.length, 11).setValues(pendingData);
    Logger.log('setValues() completed successfully');
  } catch (e) {
    Logger.log('ERROR in setValues(): ' + e.toString());
    throw e;
  }

  Logger.log('Last row after: ' + pendingSheet.getLastRow());

  SpreadsheetApp.getUi().alert('Test complete! Check Pending Changes and Logs (View > Logs)');
}

/**
 * Cleanup function - removes all empty rows in Pending Changes that are pushing data down
 * Run this from Script Editor: Extensions > Apps Script > select this function > Run
 */
function cleanupPendingChanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName('Pending Changes');

  Logger.log('Starting cleanup...');
  Logger.log('Last row before cleanup: ' + pendingSheet.getLastRow());

  // Find the actual last row with data by checking column B (Item Name)
  const lastRowData = pendingSheet.getRange('B:B').getValues();
  let actualLastRow = 1; // Start at 1 (header row)

  for (let i = lastRowData.length - 1; i >= 0; i--) {
    if (lastRowData[i][0] && lastRowData[i][0].toString().trim() !== '') {
      actualLastRow = i + 1;
      break;
    }
  }

  Logger.log('Actual last row with data: ' + actualLastRow);

  const totalRows = pendingSheet.getMaxRows();
  const emptyRows = totalRows - actualLastRow;

  if (emptyRows > 0) {
    // Delete all rows after the actual last row
    pendingSheet.deleteRows(actualLastRow + 1, emptyRows);
    Logger.log(`Deleted ${emptyRows} empty rows`);

    SpreadsheetApp.getUi().alert(
      'Cleanup Complete!',
      `Removed ${emptyRows} empty rows.\n\nPending Changes now has ${actualLastRow} rows total (including header).`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      'No Cleanup Needed',
      'Pending Changes sheet has no empty rows to remove.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
