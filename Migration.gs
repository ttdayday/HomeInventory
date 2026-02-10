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

/**
 * 🔧 MIGRATION: Reorganizes existing data to new column layout
 *
 * OLD: [Item Name, Location, Box, Quantity, Last Updated, Full Location, Remove?]
 * NEW: [Remove?, Item Name, Location, Box, Quantity, Last Updated, Full Location]
 *
 * This moves the Remove? column from G to A and shifts everything else right
 *
 * ⚠️ IMPORTANT: Run this ONCE after updating to the new code version
 */
function migrateToNewColumnLayout() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  if (!inventorySheet) {
    ui.alert('Error', 'Main Inventory sheet not found.', ui.ButtonSet.OK);
    return;
  }

  const lastRow = inventorySheet.getLastRow();

  if (lastRow < 2) {
    ui.alert('Info', 'No data to migrate.', ui.ButtonSet.OK);
    return;
  }

  // Confirm with user
  const response = ui.alert(
    '🔧 Migrate to New Column Layout',
    `This will reorganize ${lastRow - 1} row(s) of data:\n\n` +
    `OLD: Item Name | Location | Box | Qty | Updated | FullLoc | Remove?\n` +
    `NEW: Remove? | Item Name | Location | Box | Qty | Updated | FullLoc\n\n` +
    `✅ Your data will be preserved\n` +
    `✅ Columns will be rearranged\n` +
    `✅ Checkboxes will be added to column A\n\n` +
    'Continue?',
    ui.ButtonSet.OK_CANCEL
  );

  if (response !== ui.Button.OK) {
    ui.alert('Cancelled', 'No changes were made.', ui.ButtonSet.OK);
    return;
  }

  // Read all existing data (OLD format)
  const oldData = inventorySheet.getRange(2, 1, lastRow - 1, 7).getValues();

  // Prepare new data array with rearranged columns
  const newData = [];

  for (let i = 0; i < oldData.length; i++) {
    const oldRow = oldData[i];

    // OLD format indices:
    // 0: Item Name
    // 1: Location
    // 2: Box
    // 3: Quantity
    // 4: Last Updated
    // 5: Full Location
    // 6: Remove? (might be empty, text, or invalid value)

    // NEW format: [Remove?, Item Name, Location, Box, Qty, Last Updated, Full Loc]
    const newRow = [
      false,           // Remove? - default to unchecked (was column G, index 6)
      oldRow[0],       // Item Name (was column A, index 0)
      oldRow[1],       // Location (was column B, index 1)
      oldRow[2],       // Box (was column C, index 2)
      oldRow[3],       // Quantity (was column D, index 3)
      oldRow[4],       // Last Updated (was column E, index 4)
      oldRow[5]        // Full Location (was column F, index 5)
    ];

    newData.push(newRow);
  }

  // Clear existing data and validations
  inventorySheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  inventorySheet.getRange(2, 1, lastRow - 1, 7).clearDataValidations();

  // Write reorganized data
  inventorySheet.getRange(2, 1, newData.length, 7).setValues(newData);

  // Apply the structure updates (headers, validations, formulas)
  updateSheetStructure();

  ui.alert(
    '✅ Migration Complete!',
    `Successfully reorganized ${newData.length} row(s)!\n\n` +
    `New column layout:\n` +
    `• Column A: Remove? (checkboxes)\n` +
    `• Column B: Item Name\n` +
    `• Column C: Location\n` +
    `• Column D: Box\n` +
    `• Column E: Quantity\n` +
    `• Column F: Last Updated\n` +
    `• Column G: Full Location\n\n` +
    'Your inventory is now using the new layout!',
    ui.ButtonSet.OK
  );

  Logger.log(`Migrated ${newData.length} rows to new column layout`);
}

/**
 * Helper function to verify data migration worked correctly
 * Displays sample data from first 3 rows in the logs
 */
function verifyMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  if (!inventorySheet) {
    Logger.log('ERROR: Main Inventory sheet not found');
    return;
  }

  const lastRow = inventorySheet.getLastRow();

  Logger.log('=== Migration Verification ===');
  Logger.log(`Total rows (including header): ${lastRow}`);

  // Check headers
  const headers = inventorySheet.getRange(1, 1, 1, 7).getValues()[0];
  Logger.log(`Headers: ${headers.join(' | ')}`);

  // Check first 3 data rows
  if (lastRow > 1) {
    const sampleRows = Math.min(3, lastRow - 1);
    const sampleData = inventorySheet.getRange(2, 1, sampleRows, 7).getValues();

    Logger.log('\n=== Sample Data (first 3 rows) ===');
    sampleData.forEach((row, index) => {
      Logger.log(`Row ${index + 2}:`);
      Logger.log(`  Remove?: ${row[0]} (type: ${typeof row[0]})`);
      Logger.log(`  Item Name: ${row[1]}`);
      Logger.log(`  Location: ${row[2]}`);
      Logger.log(`  Box: ${row[3]}`);
      Logger.log(`  Quantity: ${row[4]}`);
      Logger.log(`  Last Updated: ${row[5]}`);
      Logger.log(`  Full Location: ${row[6]}`);
    });
  }

  Logger.log('\n=== Verification Complete ===');
  ss.toast(
    'Migration verified. Check logs (Ctrl+Enter) for details.',
    'Verification Complete',
    5
  );
}
