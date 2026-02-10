/**
 * Home Inventory Management System - Data Migration
 *
 * This script helps migrate data from an existing Google Sheet
 * into the new inventory management system.
 */

/**
 * Main migration function - imports data from your existing Google Sheet
 *
 * INSTRUCTIONS:
 * 1. Make a backup copy of your existing sheet first!
 * 2. Update the SOURCE_SHEET_URL variable below with your existing sheet URL
 * 3. Update the SOURCE_SHEET_NAME if needed (default: first sheet)
 * 4. Verify the column mapping in COLUMN_MAPPING matches your sheet structure
 * 5. Run this function from Script Editor: Run > migrateExistingData
 */
function migrateExistingData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ========================================
  // CONFIGURATION - UPDATE THESE VALUES
  // ========================================

  // Your existing Google Sheet URL
  // Example: 'https://docs.google.com/spreadsheets/d/ABC123.../edit'
  const SOURCE_SHEET_URL = 'YOUR_EXISTING_SHEET_URL_HERE';

  // Name of the tab in your existing sheet (leave null to use first sheet)
  const SOURCE_SHEET_NAME = null;

  // Column mapping from your existing sheet (0-indexed)
  // Update these numbers if your columns are in a different order
  const COLUMN_MAPPING = {
    itemName: 0,     // Column A (0) = Item Name
    location: 1,     // Column B (1) = Location
    box: 2,          // Column C (2) = Box
    quantity: 3      // Column D (3) = Quantity
  };

  // Set to true to skip the first row (if it's a header row)
  const HAS_HEADER_ROW = true;

  // ========================================
  // END CONFIGURATION
  // ========================================

  // Validation
  if (SOURCE_SHEET_URL === 'YOUR_EXISTING_SHEET_URL_HERE') {
    SpreadsheetApp.getUi().alert(
      'Configuration Required',
      'Please update the SOURCE_SHEET_URL in Migration.gs before running.\n\n' +
      'Open the script editor and set SOURCE_SHEET_URL to your existing sheet URL.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  if (!isSetupComplete()) {
    SpreadsheetApp.getUi().alert(
      'Setup Required',
      'Please run "Setup Sheets" first from the Inventory Manager menu.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  // Confirm before migration
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Confirm Migration',
    'This will import data from your existing sheet.\n\n' +
    'Make sure you have:\n' +
    '• Made a backup of your existing sheet\n' +
    '• Updated the SOURCE_SHEET_URL in Migration.gs\n' +
    '• Verified the column mapping is correct\n\n' +
    'Continue with migration?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('Migration cancelled.');
    return;
  }

  try {
    // Open source sheet
    const sourceSpreadsheet = SpreadsheetApp.openByUrl(SOURCE_SHEET_URL);
    const sourceSheet = SOURCE_SHEET_NAME
      ? sourceSpreadsheet.getSheetByName(SOURCE_SHEET_NAME)
      : sourceSpreadsheet.getSheets()[0];

    if (!sourceSheet) {
      throw new Error('Source sheet not found. Check SOURCE_SHEET_NAME.');
    }

    // Get all data from source
    const sourceData = sourceSheet.getDataRange().getValues();

    if (sourceData.length === 0) {
      throw new Error('Source sheet is empty.');
    }

    // Get target sheet
    const targetSheet = ss.getSheetByName('Main Inventory');

    // Process data
    const startRow = HAS_HEADER_ROW ? 1 : 0;
    const migratedData = [];
    const errors = [];

    for (let i = startRow; i < sourceData.length; i++) {
      const row = sourceData[i];

      try {
        // Extract data based on column mapping
        const itemName = String(row[COLUMN_MAPPING.itemName] || '').trim();
        const location = String(row[COLUMN_MAPPING.location] || '').trim();
        const box = String(row[COLUMN_MAPPING.box] || '').trim();
        const quantity = parseInt(row[COLUMN_MAPPING.quantity]) || 1;

        // Skip empty rows
        if (!itemName) {
          continue;
        }

        // Normalize location
        const normalizedLocation = normalizeLocation(location);

        // Validate location
        if (!['home', '4', 'P'].includes(normalizedLocation)) {
          errors.push(`Row ${i + 1}: Invalid location "${location}" for item "${itemName}"`);
          continue;
        }

        // Build full location
        const fullLocation = `${normalizedLocation}-${box}`;

        // Add to migrated data
        migratedData.push([
          itemName,
          normalizedLocation,
          box,
          quantity,
          new Date(),
          'Migration',
          fullLocation
        ]);

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Import data to Main Inventory
    if (migratedData.length > 0) {
      const targetStartRow = targetSheet.getLastRow() + 1;
      targetSheet.getRange(targetStartRow, 1, migratedData.length, 7).setValues(migratedData);

      // Sort inventory
      sortInventory();

      // Show results
      let message = `✅ Successfully migrated ${migratedData.length} items!`;

      if (errors.length > 0) {
        message += `\n\n⚠️ ${errors.length} row(s) skipped due to errors:\n`;
        message += errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
          message += `\n... and ${errors.length - 5} more errors`;
        }
      }

      message += '\n\nNext steps:\n';
      message += '1. Review the Main Inventory tab\n';
      message += '2. Verify all items imported correctly\n';
      message += '3. Set your user name in Settings tab\n';
      message += '4. Start using the Parser Input tab!';

      ui.alert('Migration Complete', message, ui.ButtonSet.OK);

      Logger.log(`Migration complete: ${migratedData.length} items imported`);

    } else {
      ui.alert(
        'No Data Imported',
        'No valid data found to import.\n\nCheck the errors in the logs.',
        ui.ButtonSet.OK
      );
    }

  } catch (error) {
    Logger.log(`Migration error: ${error.message}`);
    ui.alert(
      'Migration Error',
      `Error during migration:\n\n${error.message}\n\nCheck the script logs for more details.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Preview migration without actually importing data
 * Use this to test your configuration before running the actual migration
 */
function previewMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Use same configuration as migrateExistingData
  const SOURCE_SHEET_URL = 'YOUR_EXISTING_SHEET_URL_HERE';
  const SOURCE_SHEET_NAME = null;
  const COLUMN_MAPPING = {
    itemName: 0,
    location: 1,
    box: 2,
    quantity: 3
  };
  const HAS_HEADER_ROW = true;

  if (SOURCE_SHEET_URL === 'YOUR_EXISTING_SHEET_URL_HERE') {
    SpreadsheetApp.getUi().alert(
      'Configuration Required',
      'Please update the SOURCE_SHEET_URL in Migration.gs before previewing.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  try {
    // Open source sheet
    const sourceSpreadsheet = SpreadsheetApp.openByUrl(SOURCE_SHEET_URL);
    const sourceSheet = SOURCE_SHEET_NAME
      ? sourceSpreadsheet.getSheetByName(SOURCE_SHEET_NAME)
      : sourceSpreadsheet.getSheets()[0];

    const sourceData = sourceSheet.getDataRange().getValues();

    // Preview first 10 rows
    const startRow = HAS_HEADER_ROW ? 1 : 0;
    const previewRows = sourceData.slice(startRow, startRow + 10);

    let preview = 'Migration Preview (first 10 rows):\n\n';

    previewRows.forEach((row, index) => {
      const itemName = String(row[COLUMN_MAPPING.itemName] || '').trim();
      const location = String(row[COLUMN_MAPPING.location] || '').trim();
      const box = String(row[COLUMN_MAPPING.box] || '').trim();
      const quantity = row[COLUMN_MAPPING.quantity] || 1;

      if (itemName) {
        const normalizedLocation = normalizeLocation(location);
        preview += `${index + 1}. ${itemName} | ${normalizedLocation}-${box} | Qty: ${quantity}\n`;
      }
    });

    const totalRows = HAS_HEADER_ROW ? sourceData.length - 1 : sourceData.length;
    preview += `\n... and ${Math.max(0, totalRows - 10)} more rows\n`;
    preview += `\nTotal rows to import: ${totalRows}`;

    SpreadsheetApp.getUi().alert('Preview', preview, SpreadsheetApp.getUi().ButtonSet.OK);

  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Preview Error',
      `Error:\n\n${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Import data from a CSV file
 * This is an alternative if you exported your existing sheet as CSV
 *
 * INSTRUCTIONS:
 * 1. Export your existing sheet as CSV
 * 2. Upload the CSV to Google Drive
 * 3. Update the CSV_FILE_ID below with the file ID from the Drive URL
 * 4. Run this function
 */
function importFromCSV() {
  const CSV_FILE_ID = 'YOUR_CSV_FILE_ID_HERE';

  if (CSV_FILE_ID === 'YOUR_CSV_FILE_ID_HERE') {
    SpreadsheetApp.getUi().alert(
      'Configuration Required',
      'Please update CSV_FILE_ID in Migration.gs with your CSV file ID from Google Drive.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  try {
    // Get CSV file from Drive
    const file = DriveApp.getFileById(CSV_FILE_ID);
    const csvContent = file.getBlob().getDataAsString();

    // Parse CSV
    const rows = Utilities.parseCsv(csvContent);

    // Import logic (similar to migrateExistingData)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const targetSheet = ss.getSheetByName('Main Inventory');

    const migratedData = [];

    for (let i = 1; i < rows.length; i++) {  // Skip header
      const row = rows[i];

      const itemName = String(row[0] || '').trim();
      const location = normalizeLocation(String(row[1] || '').trim());
      const box = String(row[2] || '').trim();
      const quantity = parseInt(row[3]) || 1;

      if (itemName && ['home', '4', 'P'].includes(location)) {
        migratedData.push([
          itemName,
          location,
          box,
          quantity,
          new Date(),
          'Migration',
          `${location}-${box}`
        ]);
      }
    }

    if (migratedData.length > 0) {
      const targetStartRow = targetSheet.getLastRow() + 1;
      targetSheet.getRange(targetStartRow, 1, migratedData.length, 7).setValues(migratedData);

      sortInventory();

      SpreadsheetApp.getUi().alert(
        'Import Complete',
        `Imported ${migratedData.length} items from CSV.`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Import Error',
      `Error: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Helper function - clears ALL data from Main Inventory
 * Use this if you want to re-run migration after a failed attempt
 */
function clearMainInventory() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear Main Inventory?',
    'This will DELETE ALL items from Main Inventory.\n\n' +
    'Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName('Main Inventory');

    const lastRow = inventorySheet.getLastRow();
    if (lastRow > 1) {
      inventorySheet.getRange(2, 1, lastRow - 1, 7).clearContent();
      ui.alert('Main Inventory cleared.');
    } else {
      ui.alert('Main Inventory is already empty.');
    }
  }
}
