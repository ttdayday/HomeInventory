/**
 * Home Inventory Management System - Sheet Setup
 *
 * This script creates and configures all necessary sheets for the inventory system.
 * Run setupSheets() once after creating a new Google Sheet.
 */

/**
 * Main setup function - creates all sheets with proper structure and formatting
 * ⚠️ WARNING: This function DELETES all existing sheets and creates new ones!
 * ⚠️ ALL DATA WILL BE LOST!
 *
 * ONLY run this when:
 * - Setting up a brand new inventory system
 * - You have backed up your data
 * - You understand all data will be deleted
 *
 * For updating existing sheets without losing data, use updateSheetStructure() instead.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Check if sheets already exist with data
  const inventorySheet = ss.getSheetByName('Main Inventory');
  const pendingSheet = ss.getSheetByName('Pending Changes');

  let hasData = false;
  if (inventorySheet && inventorySheet.getLastRow() > 1) {
    hasData = true;
  }
  if (pendingSheet && pendingSheet.getLastRow() > 1) {
    hasData = true;
  }

  // If data exists, show strong warning
  if (hasData) {
    const response = ui.alert(
      '⚠️ DATA LOSS WARNING ⚠️',
      'Existing sheets with DATA were detected!\n\n' +
      '❌ Running this will DELETE ALL YOUR DATA!\n' +
      '❌ Main Inventory, Pending Changes, and Transaction History will be ERASED!\n\n' +
      'Do you want to continue?\n\n' +
      'If you just want to update sheet formatting without losing data, click CANCEL and use "Update Sheet Structure" instead.',
      ui.ButtonSet.OK_CANCEL
    );

    if (response !== ui.Button.OK) {
      ui.alert('Setup Cancelled', 'No changes were made. Your data is safe.', ui.ButtonSet.OK);
      return;
    }

    // Second confirmation
    const finalConfirm = ui.alert(
      'FINAL CONFIRMATION',
      'Are you ABSOLUTELY SURE?\n\n' +
      'This is your last chance to cancel.\n' +
      'All data will be permanently deleted.',
      ui.ButtonSet.YES_NO
    );

    if (finalConfirm !== ui.Button.YES) {
      ui.alert('Setup Cancelled', 'No changes were made. Your data is safe.', ui.ButtonSet.OK);
      return;
    }
  }

  // Delete default "Sheet1" if it exists
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // Create all sheets
  createMainInventorySheet(ss);
  createPendingChangesSheet(ss);
  createTransactionHistorySheet(ss);
  createParserInputSheet(ss);
  createSettingsSheet(ss);

  // Show success message
  ui.alert(
    'Setup Complete!',
    'All sheets have been created successfully.\n\n' +
    'Next steps:\n' +
    '1. Set your user name in the Settings tab\n' +
    '2. If you have existing data, update Migration.gs and run migrateExistingData()\n' +
    '3. Start using the Parser Input tab to add items!\n\n' +
    'The Inventory Manager menu will appear when you reopen the sheet.',
    ui.ButtonSet.OK
  );
}

/**
 * Creates the Main Inventory sheet - source of truth for all items
 */
function createMainInventorySheet(ss) {
  let sheet = ss.getSheetByName('Main Inventory');

  // Delete existing sheet if present (for re-setup)
  if (sheet) {
    ss.deleteSheet(sheet);
  }

  // Create new sheet
  sheet = ss.insertSheet('Main Inventory', 0);

  // Set up headers - 7 COLUMNS (Remove? moved to column A)
  const headers = ['📋 Remove?', 'Item Name', 'Location', 'Box', 'Quantity', 'Last Updated', 'Full Location'];
  sheet.getRange('A1:G1').setValues([headers]);

  // Format header row
  sheet.getRange('A1:G1')
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 70);   // Remove? checkbox
  sheet.setColumnWidth(2, 250);  // Item Name
  sheet.setColumnWidth(3, 100);  // Location
  sheet.setColumnWidth(4, 80);   // Box
  sheet.setColumnWidth(5, 100);  // Quantity
  sheet.setColumnWidth(6, 150);  // Last Updated
  sheet.setColumnWidth(7, 120);  // Full Location

  // Add checkbox validation for Remove column (A2:A1000)
  const checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange('A2:A1000').setDataValidation(checkboxRule);

  // Add data validation for Location column (C2:C1000)
  const locationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['home', '4', 'P'], true)
    .setAllowInvalid(false)
    .setHelpText('Valid locations: home, 4 (storage unit), P (parking garage)')
    .build();
  sheet.getRange('C2:C1000').setDataValidation(locationRule);

  // Add formula for Full Location column (G2:G1000)
  // Formula combines Location and Box with a dash
  sheet.getRange('G2').setFormula('=IF(B2<>"", C2&"-"&D2, "")');
  sheet.getRange('G2:G1000').setNumberFormat('@'); // Text format

  // Auto-fill formula down
  sheet.getRange('G2').copyTo(sheet.getRange('G2:G1000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Add conditional formatting for zero quantity (highlight in light red)
  const zeroQtyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$E2=0')
    .setBackground('#f4c7c3')
    .setRanges([sheet.getRange('A2:G1000')])
    .build();

  const rules = sheet.getConditionalFormatRules();
  rules.push(zeroQtyRule);
  sheet.setConditionalFormatRules(rules);

  // Add instructions note
  sheet.getRange('B2').setNote(
    'Add items via Parser Input tab.\n\n' +
    'To remove items:\n' +
    '1. Check boxes in "Remove?" column (column A)\n' +
    '2. Menu: Inventory Manager → Remove Checked Items'
  );

  Logger.log('Main Inventory sheet created');
}

/**
 * Creates the Pending Changes sheet - staging area for reviewing transactions
 */
function createPendingChangesSheet(ss) {
  let sheet = ss.getSheetByName('Pending Changes');

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('Pending Changes', 1);

  // Set up headers - simplified to match input format
  const headers = ['☑', 'Item Name', 'Location', 'Box', 'Quantity', 'Notes', 'Timestamp', 'Status'];
  sheet.getRange('A1:H1').setValues([headers]);

  // Format header row
  sheet.getRange('A1:H1')
    .setFontWeight('bold')
    .setBackground('#fbbc04')
    .setFontColor('#000000')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 50);   // Checkbox
  sheet.setColumnWidth(2, 250);  // Item Name
  sheet.setColumnWidth(3, 100);  // Location
  sheet.setColumnWidth(4, 80);   // Box
  sheet.setColumnWidth(5, 100);  // Quantity
  sheet.setColumnWidth(6, 300);  // Notes
  sheet.setColumnWidth(7, 150);  // Timestamp
  sheet.setColumnWidth(8, 100);  // Status

  // Add checkbox column (A2:A1000)
  const checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange('A2:A1000').setDataValidation(checkboxRule);

  // Add data validation for Status column (H2:H1000)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Confirmed', 'Rejected'], true)
    .build();
  sheet.getRange('H2:H1000').setDataValidation(statusRule);

  // Add instructions note
  sheet.getRange('A2').setNote(
    'Check the boxes next to changes you want to apply, then click:\n' +
    'Inventory Manager > Commit Checked Changes\n\n' +
    'Pending changes are shown in YELLOW.\n' +
    'Confirmed changes turn GREEN.\n' +
    'You can manually edit any field before committing.'
  );

  Logger.log('Pending Changes sheet created');
}

/**
 * Creates the Transaction History sheet - audit log
 */
function createTransactionHistorySheet(ss) {
  let sheet = ss.getSheetByName('Transaction History');

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('Transaction History', 2);

  // Set up headers
  const headers = ['Timestamp', 'User', 'Action', 'Item Name', 'From Location', 'To Location', 'Quantity', 'Notes'];
  sheet.getRange('A1:H1').setValues([headers]);

  // Format header row
  sheet.getRange('A1:H1')
    .setFontWeight('bold')
    .setBackground('#34a853')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Set column widths
  sheet.setColumnWidth(1, 150);  // Timestamp
  sheet.setColumnWidth(2, 100);  // User
  sheet.setColumnWidth(3, 100);  // Action
  sheet.setColumnWidth(4, 200);  // Item Name
  sheet.setColumnWidth(5, 120);  // From Location
  sheet.setColumnWidth(6, 120);  // To Location
  sheet.setColumnWidth(7, 100);  // Quantity
  sheet.setColumnWidth(8, 250);  // Notes

  // Protect this sheet (users shouldn't manually edit history)
  const protection = sheet.protect().setDescription('Transaction History - Auto-generated log');
  protection.setWarningOnly(true); // Allow edits but show warning

  Logger.log('Transaction History sheet created');
}

/**
 * Creates the Parser Input sheet - structured table for pasting ChatGPT output
 */
function createParserInputSheet(ss) {
  let sheet = ss.getSheetByName('Parser Input');

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('Parser Input', 3);

  // Title row
  sheet.getRange('A1:E1').merge();
  sheet.getRange('A1').setValue('📋 Paste ChatGPT Table Below (starting at row 3)')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#e8f0fe')
    .setHorizontalAlignment('center');

  // Column headers (row 2)
  const headers = ['Item Name', 'Location', 'Box', 'Quantity', 'Notes'];
  sheet.getRange('A2:E2').setValues([headers]);

  // Format header row
  sheet.getRange('A2:E2')
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Freeze header rows
  sheet.setFrozenRows(2);

  // Set column widths
  sheet.setColumnWidth(1, 250);  // Item Name
  sheet.setColumnWidth(2, 100);  // Location
  sheet.setColumnWidth(3, 80);   // Box
  sheet.setColumnWidth(4, 100);  // Quantity
  sheet.setColumnWidth(5, 300);  // Notes

  // Add data validation for Location column (B3:B502) - supports up to 500 items
  const locationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['home', '4', 'P'], true)
    .setAllowInvalid(true)
    .setHelpText('Valid locations: home, 4, P')
    .build();
  sheet.getRange('B3:B502').setDataValidation(locationRule);

  // Instructions in sidebar (column G onwards)
  sheet.getRange('G1').setValue('📝 Instructions:')
    .setFontWeight('bold')
    .setFontSize(12)
    .setBackground('#fff3cd');

  sheet.getRange('G2:H15').merge();
  sheet.getRange('G2').setValue(
    '1. Dictate items to ChatGPT:\n' +
    '   "I\'m putting WD-40 in storage 4 box 23,\n' +
    '    hammer in parking box 5"\n\n' +
    '2. Ask ChatGPT:\n' +
    '   "Format this as a table with columns:\n' +
    '    Item Name, Location, Box, Quantity, Notes"\n\n' +
    '3. Copy ChatGPT\'s table output\n\n' +
    '4. Paste starting at row 3 (cell A3)\n\n' +
    '5. Click: Inventory Manager → Parse Transactions\n\n' +
    '6. Go to Pending Changes tab to review\n\n' +
    '7. Check boxes next to items to commit\n\n' +
    '8. Click: Inventory Manager → Commit Checked Changes'
  ).setWrap(true)
    .setVerticalAlignment('top')
    .setBackground('#fffef0');

  // Examples section
  sheet.getRange('G17').setValue('✅ Example ChatGPT Table:')
    .setFontWeight('bold')
    .setFontSize(12)
    .setBackground('#d9ead3');

  sheet.getRange('G18:H28').merge();
  sheet.getRange('G18').setValue(
    'Item Name          Location    Box    Quantity    Notes\n' +
    'WD-40             4           23     1           \n' +
    'Hammer            P           5      1           Claw hammer\n' +
    'Screwdriver set   P           8      3           Phillips\n' +
    'Drill             home               1           Cordless\n\n' +
    'Location codes:\n' +
    '• home = Items at home\n' +
    '• 4 = Storage unit (4th floor)\n' +
    '• P = Parking garage'
  ).setWrap(true)
    .setVerticalAlignment('top')
    .setFontFamily('Courier New')
    .setFontSize(9)
    .setBackground('#f0f8e8');

  // Set column widths for instruction columns
  sheet.setColumnWidth(7, 200);
  sheet.setColumnWidth(8, 200);

  // Add note to first data cell
  sheet.getRange('A3').setNote(
    'Paste ChatGPT table here starting at row 3.\n' +
    'Table should have columns: Item Name, Location, Box, Quantity, Notes'
  );

  Logger.log('Parser Input sheet created');
}

/**
 * Creates the Settings sheet - user preferences and search interface
 */
function createSettingsSheet(ss) {
  let sheet = ss.getSheetByName('Settings');

  if (sheet) {
    ss.deleteSheet(sheet);
  }

  sheet = ss.insertSheet('Settings', 4);

  // User settings section
  sheet.getRange('A1').setValue('User Name:')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');

  sheet.getRange('B1').setValue('User 1')
    .setBackground('#ffffff');

  sheet.getRange('B1').setNote(
    'Set this to "User 1" or "User 2" so the system knows who is making changes.\n' +
    'This appears in Transaction History and Main Inventory.'
  );

  // Location settings
  sheet.getRange('A2').setValue('Valid Locations:')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');

  sheet.getRange('B2').setValue('home, 4, P')
    .setBackground('#ffffff');

  sheet.getRange('B2').setNote(
    'Valid storage locations:\n' +
    '• home - Items stored at home\n' +
    '• 4 - Storage unit on 4th floor\n' +
    '• P - Parking garage storage'
  );

  // Default quantity
  sheet.getRange('A3').setValue('Default Quantity:')
    .setFontWeight('bold')
    .setBackground('#f3f3f3');

  sheet.getRange('B3').setValue(1)
    .setBackground('#ffffff');

  // Search section
  sheet.getRange('A5').setValue('🔍 Search Inventory')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#e8f0fe');

  sheet.getRange('A6').setValue('Search for:')
    .setFontWeight('bold');

  sheet.getRange('B6').setValue('')
    .setBackground('#ffffff');

  sheet.getRange('B6').setNote(
    'Enter item name (or partial name) and click:\n' +
    'Inventory Manager → Search Inventory\n\n' +
    'Results will appear below.'
  );

  // Results header
  sheet.getRange('A8').setValue('Search Results:')
    .setFontWeight('bold')
    .setBackground('#d9ead3');

  // Set column widths
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 300);

  Logger.log('Settings sheet created');
}

/**
 * Safe update function - updates sheet structure WITHOUT deleting data
 * Use this for updating formatting, formulas, and validation rules
 */
function updateSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    'Update Sheet Structure',
    'This will update formatting, formulas, and validation rules.\n\n' +
    '✅ Your data will be preserved\n' +
    '✅ Only structure/formatting will be updated\n\n' +
    'Continue?',
    ui.ButtonSet.OK_CANCEL
  );

  const inventorySheet = ss.getSheetByName('Main Inventory');

  if (!inventorySheet) {
    ui.alert('Error', 'Main Inventory sheet not found. Run "Setup Sheets" first.', ui.ButtonSet.OK);
    return;
  }

  // Update Main Inventory headers - 7 COLUMNS (Remove? moved to column A)
  const headers = ['📋 Remove?', 'Item Name', 'Location', 'Box', 'Quantity', 'Last Updated', 'Full Location'];
  inventorySheet.getRange('A1:G1').setValues([headers]);

  // Format header row
  inventorySheet.getRange('A1:G1')
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Update column widths
  inventorySheet.setColumnWidth(1, 70);   // Remove? checkbox
  inventorySheet.setColumnWidth(2, 250);  // Item Name
  inventorySheet.setColumnWidth(3, 100);  // Location
  inventorySheet.setColumnWidth(4, 80);   // Box
  inventorySheet.setColumnWidth(5, 100);  // Quantity
  inventorySheet.setColumnWidth(6, 150);  // Last Updated
  inventorySheet.setColumnWidth(7, 120);  // Full Location

  // Add checkbox validation for Column A (Remove?)
  const checkboxRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  inventorySheet.getRange('A2:A1000').setDataValidation(checkboxRule);

  // Update validation for Location column (now column C)
  const locationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['home', '4', 'P'], true)
    .setAllowInvalid(false)
    .setHelpText('Valid locations: home, 4 (storage unit), P (parking garage)')
    .build();
  inventorySheet.getRange('C2:C1000').setDataValidation(locationRule);

  // Update Full Location formula in column G
  inventorySheet.getRange('G2').setFormula('=IF(B2<>"", C2&"-"&D2, "")');
  inventorySheet.getRange('G2:G1000').setNumberFormat('@');
  inventorySheet.getRange('G2').copyTo(inventorySheet.getRange('G2:G1000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Update conditional formatting for zero quantity (column E)
  const zeroQtyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$E2=0')
    .setBackground('#f4c7c3')
    .setRanges([inventorySheet.getRange('A2:G1000')])
    .build();

  inventorySheet.clearConditionalFormatRules();
  inventorySheet.setConditionalFormatRules([zeroQtyRule]);

  ui.alert(
    'Update Complete!',
    'Sheet structure has been updated.\n\n' +
    '✅ All your data was preserved\n' +
    '✅ Formatting and formulas updated\n' +
    '✅ Remove checkbox column added',
    ui.ButtonSet.OK
  );
}

/**
 * Helper function to check if setup has been run
 */
function isSetupComplete() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = ['Main Inventory', 'Pending Changes', 'Transaction History', 'Parser Input', 'Settings'];

  for (let sheetName of requiredSheets) {
    if (!ss.getSheetByName(sheetName)) {
      return false;
    }
  }

  return true;
}

/**
 * Reset function - clears all data but keeps structure (use with caution!)
 */
function resetAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Reset All Data?',
    'This will delete ALL data from Main Inventory, Pending Changes, and Transaction History.\n\n' +
    'The sheet structure will remain intact.\n\n' +
    'Are you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Clear Main Inventory (except header) - NOW 7 COLUMNS
    const inventorySheet = ss.getSheetByName('Main Inventory');
    if (inventorySheet && inventorySheet.getLastRow() > 1) {
      inventorySheet.getRange(2, 1, inventorySheet.getLastRow() - 1, 7).clearContent();
    }

    // Clear Pending Changes
    const pendingSheet = ss.getSheetByName('Pending Changes');
    if (pendingSheet && pendingSheet.getLastRow() > 1) {
      pendingSheet.getRange(2, 1, pendingSheet.getLastRow() - 1, 8).clearContent();
    }

    // Clear Transaction History
    const historySheet = ss.getSheetByName('Transaction History');
    if (historySheet && historySheet.getLastRow() > 1) {
      historySheet.getRange(2, 1, historySheet.getLastRow() - 1, 8).clearContent();
    }

    ui.alert('Data Reset Complete', 'All data has been cleared.', ui.ButtonSet.OK);
  }
}
