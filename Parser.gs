/**
 * Home Inventory Management System - Parser
 *
 * This script reads structured table data from ChatGPT and creates pending changes.
 * ChatGPT should format output as a table with columns: Item Name | Location | Box | Quantity | Notes (optional)
 */

/**
 * Main parsing function - called from the Inventory Manager menu
 * Reads structured table data from Parser Input sheet and creates pending changes
 */
function parseTransactions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!isSetupComplete()) {
    ss.toast('Please run "Setup Sheets" first from the Inventory Manager menu.', 'Setup Required', 5);
    return;
  }

  const parserSheet = ss.getSheetByName('Parser Input');
  const pendingSheet = ss.getSheetByName('Pending Changes');

  // Read structured data from columns A-E (Item Name, Location, Box, Quantity, Notes)
  // Start from row 3 to skip header row (supports up to 500 items)
  const dataRange = parserSheet.getRange('A3:E502').getValues();

  // Filter out empty rows (where Item Name is empty)
  const rows = dataRange.filter(row => row[0] && row[0].toString().trim() !== '');

  if (rows.length === 0) {
    ss.toast(
      'No data found in Parser Input.\n\n' +
      'Please paste ChatGPT table starting at row 3:\n' +
      'Item Name | Location | Box | Quantity | Notes',
      'No Input',
      5
    );
    return;
  }

  // Parse rows into transactions
  const transactions = [];

  rows.forEach((row, index) => {
    const itemName = row[0].toString().trim();
    const location = row[1] ? row[1].toString().trim() : '';
    const box = row[2] ? row[2].toString().trim() : '';
    const quantity = row[3] ? parseInt(row[3]) : 1;
    const notes = row[4] ? row[4].toString().trim() : '';

    // Validate required fields
    if (!itemName) {
      Logger.log(`Row ${index + 3}: Skipping - no item name`);
      return;
    }

    if (!location) {
      Logger.log(`Row ${index + 3}: Skipping "${itemName}" - no location`);
      return;
    }

    // Normalize location to standard format (home, 4, P)
    const normalizedLocation = normalizeLocation(location);

    transactions.push({
      itemName: itemName,
      location: normalizedLocation,
      box: box,
      quantity: isNaN(quantity) ? 1 : quantity,
      notes: notes
    });
  });

  if (transactions.length === 0) {
    ss.toast(
      'No valid items found.\n\n' +
      'Make sure each row has at least:\n' +
      '• Item Name (Column A)\n' +
      '• Location (Column B)',
      'No Valid Items',
      5
    );
    return;
  }

  // Cross-reference with existing inventory and populate pending changes
  populatePendingChanges(transactions);

  // Clear parser input data (keep headers) - supports up to 500 items
  parserSheet.getRange('A3:E502').clearContent();

  // Show success message
  ss.toast(
    `✅ Parsed ${transactions.length} item(s) successfully!\n\n` +
    'Next steps:\n' +
    '1. Go to Pending Changes tab\n' +
    '2. Review the parsed items\n' +
    '3. Check boxes for items to commit\n' +
    '4. Click: Inventory Manager → Commit Checked Changes',
    'Parse Complete',
    10
  );
}

/**
 * Normalizes location text to standard format (home, 4, P)
 */
function normalizeLocation(locationText) {
  const loc = String(locationText).toLowerCase().trim();

  // Storage unit 4
  if (loc.match(/storage\s*(?:unit\s*)?4|^4$/)) {
    return '4';
  }

  // Parking garage
  if (loc.match(/parking|garage|^p$/)) {
    return 'P';
  }

  // Home
  if (loc.match(/home/)) {
    return 'home';
  }

  // Default: return as-is if it's a single character (likely 4 or P)
  if (loc.length <= 2) {
    return loc.toUpperCase();
  }

  // Default fallback
  return loc;
}

/**
 * Creates pending changes from parsed transactions
 * Action determination happens during commit, not during parsing
 */
function populatePendingChanges(transactions) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName('Pending Changes');

  const pendingData = [];

  transactions.forEach(trans => {
    // Create pending row with 8 columns (simplified format)
    pendingData.push([
      false,                  // Column 1: Checkbox (unchecked)
      trans.itemName,         // Column 2: Item name
      trans.location,         // Column 3: Location
      trans.box,              // Column 4: Box
      trans.quantity,         // Column 5: Quantity
      trans.notes || '',      // Column 6: Notes
      new Date(),             // Column 7: Timestamp
      'Pending'               // Column 8: Status
    ]);
  });

  // Append to Pending Changes sheet
  if (pendingData.length > 0) {
    // Auto-cleanup: Remove empty rows that push data down
    const maxRows = pendingSheet.getMaxRows();
    if (maxRows > 100) {
      // Find actual last row with data
      const lastRowData = pendingSheet.getRange('B:B').getValues();
      let actualLastRow = 1;

      for (let i = 0; i < lastRowData.length; i++) {
        if (lastRowData[i][0] && lastRowData[i][0].toString().trim() !== '') {
          actualLastRow = i + 1;
        }
      }

      // Resize sheet to just what we need (keep some buffer rows)
      const targetRows = Math.max(actualLastRow + 50, 20); // Keep at least 20 rows
      if (targetRows < maxRows) {
        try {
          // Delete excess rows, but leave at least 10 empty rows
          const rowsToDelete = maxRows - targetRows;
          if (rowsToDelete > 0) {
            pendingSheet.deleteRows(targetRows + 1, rowsToDelete);
            Logger.log(`Auto-cleanup: Deleted ${rowsToDelete} empty rows`);
          }
        } catch (e) {
          Logger.log(`Auto-cleanup skipped: ${e.message}`);
          // If cleanup fails, just continue - not critical
        }
      }
    }

    // Now find where to write new data
    const currentLastRow = pendingSheet.getLastRow();
    const startRow = currentLastRow + 1;

    pendingSheet.getRange(startRow, 1, pendingData.length, 8).setValues(pendingData);

    // Apply checkbox validation to column A
    const checkboxRule = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .build();
    pendingSheet.getRange(startRow, 1, pendingData.length, 1).setDataValidation(checkboxRule);

    // Apply formatting - YELLOW background for all pending items
    pendingSheet.getRange(startRow, 1, pendingData.length, 8).setBackground('#fff3cd'); // Yellow

    Logger.log(`Created ${pendingData.length} pending changes at row ${startRow}`);
  }
}

/**
 * Utility function to manually test parsing with sample data
 * Run this from Script Editor to test the parser
 */
function testParser() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const parserSheet = ss.getSheetByName('Parser Input');

  // Clear existing data
  parserSheet.getRange('A3:E502').clearContent();

  // Insert sample data
  const sampleData = [
    ['WD-40', '4', '23', 1, ''],
    ['Hammer', 'P', '5', 1, 'Claw hammer'],
    ['Rope', '4', '12', 1, '50 ft'],
    ['Screwdriver', 'P', '8', 1, ''],
    ['Drill', 'home', '', 1, 'Cordless'],
    ['Nails', '4', '15', 3, 'Box of 100']
  ];

  parserSheet.getRange(3, 1, sampleData.length, 5).setValues(sampleData);

  // Run parser
  parseTransactions();

  Logger.log('Test complete! Check Pending Changes tab.');
}
