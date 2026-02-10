/**
 * Home Inventory Management System - Core Functions
 *
 * This script contains the main business logic:
 * - Custom menu creation
 * - Commit pending changes to inventory
 * - Search functionality
 * - Helper functions
 */

/**
 * Creates custom menu when spreadsheet opens
 * This runs automatically on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Inventory Manager')
    .addItem('📝 Parse Transactions', 'parseTransactions')
    .addItem('☑️ Check All Pending', 'checkAllPending')
    .addItem('✅ Commit Checked Changes', 'commitChanges')
    .addItem('🔍 Search Inventory', 'searchInventory')
    .addSeparator()
    .addItem('🗑️ Remove Checked Items from Inventory', 'removeCheckedItems')
    .addSeparator()
    .addItem('💾 Create Backup Now', 'createBackup')
    .addItem('⏰ Setup Automatic Backups (Every 3 Months)', 'setupAutomaticBackups')
    .addItem('🛑 Disable Automatic Backups', 'disableAutomaticBackups')
    .addItem('ℹ️ Backup Status', 'showBackupInfo')
    .addItem('🗑️ Delete Old Backups (1+ Year)', 'deleteOldBackups')
    .addSeparator()
    .addItem('🧹 Clear Completed Pending Changes', 'clearCompletedPending')
    .addItem('🗑️ Clear All Pending Changes', 'clearAllPendingChanges')
    .addItem('🧽 Clear Parser Input', 'clearParserInput')
    .addSeparator()
    .addItem('🔧 Update Sheet Structure (Safe)', 'updateSheetStructure')
    .addItem('⚙️ Setup Sheets (⚠️ Deletes Data!)', 'setupSheets')
    .addItem('🔄 Reset All Data (⚠️ Deletes Data!)', 'resetAllData')
    .addToUi();
}

/**
 * Main function to commit checked changes from Pending Changes to Main Inventory
 * Uses locking to prevent concurrent modifications
 */
function commitChanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if setup is complete
  if (!isSetupComplete()) {
    ss.toast('Please run "Setup Sheets" first from the Inventory Manager menu.', 'Setup Required', 5);
    return;
  }

  const pendingSheet = ss.getSheetByName('Pending Changes');
  const inventorySheet = ss.getSheetByName('Main Inventory');
  const historySheet = ss.getSheetByName('Transaction History');
  const settingsSheet = ss.getSheetByName('Settings');

  // Get current user
  const currentUser = settingsSheet.getRange('B1').getValue() || 'User 1';

  // Use lock to prevent concurrent commits
  const lock = LockService.getScriptLock();

  try {
    // Wait up to 30 seconds for lock
    if (!lock.tryLock(30000)) {
      ss.toast('Another user is committing changes. Please wait and try again.', 'Locked', 5);
      return;
    }

    const lastRow = pendingSheet.getLastRow();

    if (lastRow < 2) {
      ss.toast('No pending changes to commit.', 'Info', 3);
      return;
    }

    // Get all pending data (simplified 8-column format)
    const pendingData = pendingSheet.getRange(2, 1, lastRow - 1, 8).getValues();
    let committedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < pendingData.length; i++) {
      const checkbox = pendingData[i][0];
      const itemName = String(pendingData[i][1] || '');
      const location = String(pendingData[i][2] || '');
      const box = String(pendingData[i][3] || '');
      const quantity = pendingData[i][4];
      const notes = String(pendingData[i][5] || '');
      const status = pendingData[i][7];

      // Only process checked and pending items
      if (checkbox === true && status === 'Pending') {
        try {
          // Validate required fields
          if (!itemName || itemName.trim() === '') {
            throw new Error('Item name is required');
          }

          if (!location || location.trim() === '') {
            throw new Error('Location is required');
          }

          // Check if item exists to determine action
          const existingRow = findItemRow(itemName);
          let action;

          if (existingRow > 0) {
            // Item exists - check if location changed or just quantity
            const existingData = inventorySheet.getRange(existingRow, 1, 1, 7).getValues()[0];
            const existingLoc = String(existingData[2] || '');  // Location is now column C (index 2)
            const existingBox = String(existingData[3] || '');  // Box is now column D (index 3)

            if (location !== existingLoc || box !== existingBox) {
              // Location changed - MOVE
              action = 'MOVE';
              moveItem(itemName, location, box, currentUser);
            } else {
              // Same location - UPDATE quantity
              action = 'UPDATE';
              updateItemQuantity(itemName, quantity, currentUser);
            }
          } else {
            // New item - ADD
            action = 'ADD';
            addItemToInventory(itemName, location, box, quantity, currentUser);
          }

          // Log transaction to history
          logTransaction(action, itemName, '', '', location, box, quantity, notes, currentUser);

          // Mark as confirmed in Pending Changes
          pendingSheet.getRange(i + 2, 8).setValue('Confirmed');
          pendingSheet.getRange(i + 2, 1, 1, 8).setBackground('#d4edda'); // Light green

          committedCount++;

        } catch (error) {
          Logger.log(`Error committing row ${i + 2}: ${error.message}`);
          errors.push(`Row ${i + 2} (${itemName}): ${error.message}`);

          // Mark as error
          pendingSheet.getRange(i + 2, 8).setValue(`Error: ${error.message}`);
          pendingSheet.getRange(i + 2, 1, 1, 8).setBackground('#f8d7da'); // Light red
        }
      } else if (checkbox !== true && status === 'Pending') {
        skippedCount++;
      }
    }

    // Sort inventory alphabetically by item name
    if (committedCount > 0) {
      sortInventory();
    }

    // Show results
    let message = `✅ Committed ${committedCount} change(s) successfully!`;

    if (skippedCount > 0) {
      message += `\n⏭️ Skipped ${skippedCount} unchecked item(s).`;
    }

    if (errors.length > 0) {
      message += `\n\n❌ Errors (${errors.length}):\n${errors.slice(0, 3).join('\n')}`;
      if (errors.length > 3) {
        message += `\n... and ${errors.length - 3} more`;
      }
    }

    if (committedCount > 0) {
      ss.toast(message, 'Commit Complete', 8);
    } else {
      ss.toast('No changes were committed. Check the boxes for items you want to commit.', 'Info', 5);
    }

  } catch (error) {
    Logger.log(`Error in commitChanges: ${error.message}`);
    ss.toast(`Error: ${error.message}`, 'Error', 5);

  } finally {
    // Always release the lock
    lock.releaseLock();
  }
}

/**
 * Adds a new item to the Main Inventory
 */
function addItemToInventory(itemName, location, box, quantity, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  // Check if item already exists
  const existingRow = findItemRow(itemName);
  if (existingRow > 0) {
    throw new Error(`Item "${itemName}" already exists. Use UPDATE or MOVE action instead.`);
  }

  // Add new row - 7 COLUMNS (Remove? checkbox is now first column)
  const fullLocation = `${location}-${box}`;
  const newRowNum = inventorySheet.getLastRow() + 1;

  inventorySheet.appendRow([
    '',            // Remove? checkbox - will be set below
    itemName,
    location,
    box || '',
    quantity || 1,
    new Date(),
    fullLocation
  ]);

  // Insert actual checkbox in column A for the new row
  inventorySheet.getRange(newRowNum, 1).insertCheckboxes();

  Logger.log(`Added item: ${itemName} at ${fullLocation}`);
}

/**
 * Updates the quantity of an existing item
 */
function updateItemQuantity(itemName, quantityChange, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  const row = findItemRow(itemName);
  if (row < 0) {
    throw new Error(`Item "${itemName}" not found in inventory.`);
  }

  // Get current quantity and update (Quantity is now column 5)
  const currentQty = inventorySheet.getRange(row, 5).getValue() || 0;
  const newQty = currentQty + quantityChange;

  if (newQty < 0) {
    throw new Error(`Cannot set quantity to ${newQty}. Current quantity is ${currentQty}.`);
  }

  inventorySheet.getRange(row, 5).setValue(newQty);
  inventorySheet.getRange(row, 6).setValue(new Date());

  Logger.log(`Updated quantity for ${itemName}: ${currentQty} → ${newQty}`);
}

/**
 * Moves an item to a new location
 */
function moveItem(itemName, newLocation, newBox, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  const row = findItemRow(itemName);
  if (row < 0) {
    throw new Error(`Item "${itemName}" not found in inventory.`);
  }

  // Update location and box (Location is now column 3, Box is column 4)
  inventorySheet.getRange(row, 3).setValue(newLocation);
  inventorySheet.getRange(row, 4).setValue(newBox || '');
  inventorySheet.getRange(row, 6).setValue(new Date());

  Logger.log(`Moved ${itemName} to ${newLocation}-${newBox}`);
}

/**
 * Removes an item from inventory
 */
function removeItem(itemName, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  const row = findItemRow(itemName);
  if (row < 0) {
    throw new Error(`Item "${itemName}" not found in inventory.`);
  }

  // Delete the row
  inventorySheet.deleteRow(row);

  Logger.log(`Removed item: ${itemName}`);
}

/**
 * Finds the row number of an item in Main Inventory (case-insensitive)
 * Returns -1 if not found
 */
function findItemRow(itemName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  const data = inventorySheet.getDataRange().getValues();
  const searchName = itemName.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {  // Start at 1 to skip header
    const currentName = String(data[i][1]).toLowerCase().trim();  // Item Name is now column B (index 1)
    if (currentName === searchName) {
      return i + 1;  // Return 1-indexed row number
    }
  }

  return -1;
}

/**
 * Logs a transaction to the Transaction History sheet
 * Inserts at row 2 (top) so newest transactions appear first
 */
function logTransaction(action, itemName, fromLoc, fromBox, toLoc, toBox, quantity, notes, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName('Transaction History');

  const fromLocation = fromLoc && fromBox ? `${fromLoc}-${fromBox}` : fromLoc || '';
  const toLocation = toLoc && toBox ? `${toLoc}-${toBox}` : toLoc || '';

  // Insert new row at position 2 (right after header)
  historySheet.insertRowAfter(1);

  // Get the range for the new row
  const newRowRange = historySheet.getRange(2, 1, 1, 8);

  // Set values in the newly inserted row 2
  newRowRange.setValues([[
    new Date(),
    user,
    action,
    itemName,
    fromLocation,
    toLocation,
    quantity || '',
    notes || ''
  ]]);

  // Reset formatting to plain (remove header formatting)
  newRowRange.setBackground('white');
  newRowRange.setFontColor('black');
  newRowRange.setFontWeight('normal');

  Logger.log(`Logged transaction: ${action} ${itemName}`);
}

/**
 * Sorts the Main Inventory alphabetically by item name
 */
function sortInventory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  const lastRow = inventorySheet.getLastRow();

  if (lastRow > 2) {
    // Sort by column A (Item Name), excluding header row
    const range = inventorySheet.getRange(2, 1, lastRow - 1, 7);  // CHANGED FROM 6 TO 7
    range.sort(1);  // Sort by first column
  }

  Logger.log('Inventory sorted alphabetically');
}

/**
 * Search for items in the inventory
 */
function searchInventory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!isSetupComplete()) {
    ss.toast('Please run "Setup Sheets" first from the Inventory Manager menu.', 'Setup Required', 5);
    return;
  }

  const settingsSheet = ss.getSheetByName('Settings');
  const inventorySheet = ss.getSheetByName('Main Inventory');

  // Get search term from Settings sheet (cell B6)
  const searchTerm = settingsSheet.getRange('B6').getValue();

  if (!searchTerm || searchTerm.trim() === '') {
    ss.toast('Please enter a search term in the Settings tab (cell B6).', 'Error', 5);
    return;
  }

  const searchTermLower = String(searchTerm).toLowerCase().trim();

  // Clear previous results (rows 9 onwards)
  settingsSheet.getRange('A9:B1000').clearContent();

  const results = [];

  // Search Main Inventory
  const invData = inventorySheet.getDataRange().getValues();

  for (let i = 1; i < invData.length; i++) {  // Skip header row
    const itemName = String(invData[i][1]);  // Item Name is now column B (index 1)

    if (itemName.toLowerCase().includes(searchTermLower)) {
      const location = invData[i][2];   // Location is now column C (index 2)
      const box = invData[i][3];        // Box is now column D (index 3)
      const quantity = invData[i][4];   // Quantity is now column E (index 4)

      results.push([
        itemName,
        `Location: ${location} | Box: ${box} | Qty: ${quantity}`
      ]);
    }
  }

  // Display results
  if (results.length > 0) {
    settingsSheet.getRange(9, 1, results.length, 2).setValues(results);

    // Format results
    settingsSheet.getRange(9, 1, results.length, 1).setFontWeight('bold');
    settingsSheet.getRange(9, 1, results.length, 2).setBackground('#d9ead3');

    ss.toast(`Found ${results.length} item(s) matching "${searchTerm}"`, 'Search Results', 5);
  } else {
    settingsSheet.getRange('A9').setValue('No items found');
    settingsSheet.getRange('A9:B9').setBackground('#f8d7da');
    ss.toast(`No items found matching "${searchTerm}"`, 'No Results', 5);
  }
}

/**
 * Checks all pending items in Pending Changes sheet
 * Useful for bulk approval after reviewing items visually
 */
function checkAllPending() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName('Pending Changes');

  if (!pendingSheet) {
    ss.toast('Pending Changes sheet not found.', 'Error', 3);
    return;
  }

  const lastRow = pendingSheet.getLastRow();
  if (lastRow < 2) {
    ss.toast('No pending changes found.', 'Info', 3);
    return;
  }

  // Get all data (8-column format)
  const data = pendingSheet.getRange(2, 1, lastRow - 1, 8).getValues();
  let checkedCount = 0;

  // Check all rows with status = 'Pending'
  for (let i = 0; i < data.length; i++) {
    const status = data[i][7];  // Status is column 8 (index 7)

    if (status === 'Pending') {
      // Set checkbox to true
      pendingSheet.getRange(i + 2, 1).setValue(true);
      checkedCount++;
    }
  }

  if (checkedCount > 0) {
    ss.toast(
      `Checked ${checkedCount} pending item(s). Click "Commit Checked Changes" to apply.`,
      'Success',
      5
    );
  } else {
    ss.toast('No pending items to check.', 'Info', 3);
  }
}

/**
 * Clears completed (Confirmed/Rejected) pending changes to reduce clutter
 */
function clearCompletedPending() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const pendingSheet = ss.getSheetByName('Pending Changes');

  if (!pendingSheet) {
    ss.toast('Pending Changes sheet not found.', 'Error', 3);
    return;
  }

  const lastRow = pendingSheet.getLastRow();
  if (lastRow < 2) {
    ss.toast('No pending changes to clear.', 'Info', 3);
    return;
  }

  // Get all data (8-column format)
  const data = pendingSheet.getRange(2, 1, lastRow - 1, 8).getValues();

  // Count completed items
  let completedCount = 0;
  for (let i = 0; i < data.length; i++) {
    const status = data[i][7];
    if (status === 'Confirmed' || status === 'Rejected') {
      completedCount++;
    }
  }

  if (completedCount === 0) {
    ss.toast('No completed pending changes to clear.', 'Info', 3);
    return;
  }

  // Confirm with user
  const response = ui.alert(
    'Clear Completed Pending Changes?',
    `This will delete ${completedCount} completed item(s) (Confirmed/Rejected).\n\n` +
    'Pending items will remain.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Clear cancelled.', 'Cancelled', 3);
    return;
  }

  let deletedCount = 0;

  // Delete rows from bottom to top (to avoid row number shifts)
  for (let i = data.length - 1; i >= 0; i--) {
    const status = data[i][7];  // Status is now column 8 (index 7)

    if (status === 'Confirmed' || status === 'Rejected') {
      pendingSheet.deleteRow(i + 2);  // +2 because array is 0-indexed and sheet has header
      deletedCount++;
    }
  }

  ss.toast(`Cleared ${deletedCount} completed pending change(s).`, 'Success', 3);
}

/**
 * Clears ALL pending changes (regardless of status)
 * Use this to start fresh when you have many old pending items
 */
function clearAllPendingChanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const pendingSheet = ss.getSheetByName('Pending Changes');

  if (!pendingSheet) {
    ss.toast('Pending Changes sheet not found.', 'Error', 3);
    return;
  }

  const lastRow = pendingSheet.getLastRow();
  if (lastRow < 2) {
    ss.toast('No pending changes to clear.', 'Info', 3);
    return;
  }

  // Confirm with user
  const response = ui.alert(
    'Clear All Pending Changes?',
    `This will delete ALL ${lastRow - 1} pending change(s), including unchecked items.\n\n` +
    'Are you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Clear cancelled.', 'Cancelled', 3);
    return;
  }

  // Clear all data rows (keep header)
  const range = pendingSheet.getRange(2, 1, lastRow - 1, 8);
  range.clearContent();
  range.setBackground('white');  // Reset background colors

  ss.toast(`Cleared all pending changes.`, 'Success', 3);
  Logger.log(`Cleared ${lastRow - 1} pending changes`);
}

/**
 * Clears Parser Input data (keeps headers)
 * Use this to start fresh after parsing
 */
function clearParserInput() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const parserSheet = ss.getSheetByName('Parser Input');

  if (!parserSheet) {
    ss.toast('Parser Input sheet not found.', 'Error', 3);
    return;
  }

  // Check if there's any data to clear (supports up to 500 items)
  const dataRange = parserSheet.getRange('A3:E502');
  const data = dataRange.getValues();
  let hasData = false;

  for (let i = 0; i < data.length; i++) {
    if (data[i].some(cell => cell !== '')) {
      hasData = true;
      break;
    }
  }

  if (!hasData) {
    ss.toast('Parser Input is already empty.', 'Info', 3);
    return;
  }

  // Confirm with user
  const response = ui.alert(
    'Clear Parser Input?',
    'This will delete all data in the Parser Input sheet.\n\n' +
    'Headers will be preserved.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Clear cancelled.', 'Cancelled', 3);
    return;
  }

  // Clear data starting from row 3 (rows 1-2 are title and headers)
  dataRange.clearContent();

  ss.toast('Parser Input cleared. Ready for new data.', 'Success', 3);
  Logger.log('Parser Input cleared');
}

/**
 * Helper function to get current user from Settings
 */
function getCurrentUser() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    return 'User 1';
  }

  const user = settingsSheet.getRange('B1').getValue();
  return user || 'User 1';
}

/**
 * Removes items that are checked in the "Remove?" column of Main Inventory
 * Shows confirmation dialog before deletion and logs to Transaction History
 */
function removeCheckedItems() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  if (!isSetupComplete()) {
    ss.toast('Please run "Setup Sheets" first from the Inventory Manager menu.', 'Setup Required', 5);
    return;
  }

  const inventorySheet = ss.getSheetByName('Main Inventory');
  const settingsSheet = ss.getSheetByName('Settings');

  // Get current user
  const currentUser = settingsSheet.getRange('B1').getValue() || 'User 1';

  const lastRow = inventorySheet.getLastRow();

  if (lastRow < 2) {
    ss.toast('No items in inventory.', 'Info', 3);
    return;
  }

  // Get all data (7 columns including checkbox)
  const data = inventorySheet.getRange(2, 1, lastRow - 1, 7).getValues();

  // Find checked items
  const itemsToRemove = [];

  for (let i = 0; i < data.length; i++) {
    const checkbox = data[i][0];  // Column A (index 0) - Remove? checkbox

    if (checkbox === true) {
      itemsToRemove.push({
        rowIndex: i + 2,  // +2 for header row and 0-indexing
        itemName: data[i][1],  // Item Name is now column B (index 1)
        location: data[i][2],  // Location is now column C (index 2)
        box: data[i][3],       // Box is now column D (index 3)
        quantity: data[i][4]   // Quantity is now column E (index 4)
      });
    }
  }

  if (itemsToRemove.length === 0) {
    ss.toast('No items checked for removal. Check boxes in the "Remove?" column first.', 'Info', 5);
    return;
  }

  // Build confirmation message
  let confirmMsg = `You are about to REMOVE ${itemsToRemove.length} item(s) from inventory:\n\n`;

  itemsToRemove.forEach((item, index) => {
    confirmMsg += `${index + 1}. ${item.itemName} (${item.location}-${item.box})\n`;
  });

  confirmMsg += '\n⚠️ This action will:\n';
  confirmMsg += '• Delete these items from Main Inventory\n';
  confirmMsg += '• Log removals to Transaction History\n';
  confirmMsg += '• Cannot be undone from this dialog\n\n';
  confirmMsg += 'Continue?';

  // Show confirmation dialog
  const response = ui.alert(
    'Remove Items?',
    confirmMsg,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Removal cancelled.', 'Cancelled', 3);
    return;
  }

  // Remove items from bottom to top (to avoid row shifting issues)
  itemsToRemove.reverse();

  let removedCount = 0;

  itemsToRemove.forEach(item => {
    try {
      // Log to Transaction History BEFORE deleting
      logTransaction(
        'REMOVE',
        item.itemName,
        item.location,
        item.box,
        '',  // No "to" location
        '',  // No "to" box
        item.quantity,
        'Removed from inventory',
        currentUser
      );

      // Delete row from Main Inventory
      inventorySheet.deleteRow(item.rowIndex);

      removedCount++;
      Logger.log(`Removed: ${item.itemName} from ${item.location}-${item.box}`);

    } catch (error) {
      Logger.log(`Error removing ${item.itemName}: ${error.message}`);
      ss.toast(`Error removing ${item.itemName}: ${error.message}`, 'Error', 5);
    }
  });

  if (removedCount > 0) {
    ss.toast(
      `✅ Removed ${removedCount} item(s) from inventory.\n\n` +
      'Check Transaction History for audit log.',
      'Removal Complete',
      5
    );
  }
}
