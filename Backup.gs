/**
 * Home Inventory Management System - Backup Functions
 *
 * Creates timestamped backups of Main Inventory sheet
 * Supports both manual and automatic (every 3 months) backups
 */

/**
 * Creates a timestamped backup copy of the Main Inventory sheet
 * Can be called manually or automatically via trigger
 */
function createBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName('Main Inventory');

  if (!inventorySheet) {
    Logger.log('ERROR: Main Inventory sheet not found - cannot create backup');

    // Only show toast if called manually (not from trigger)
    if (isCalledManually()) {
      ss.toast('Main Inventory sheet not found. Cannot create backup.', 'Error', 5);
    }
    return;
  }

  // Check if there's data to backup
  const lastRow = inventorySheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('No data to backup - Main Inventory is empty');

    if (isCalledManually()) {
      ss.toast('Main Inventory is empty. No backup needed.', 'Info', 3);
    }
    return;
  }

  // Create backup name with timestamp
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  const backupName = `Backup - Main Inventory - ${timestamp}`;

  // Duplicate the Main Inventory sheet
  const backupSheet = inventorySheet.copyTo(ss);
  backupSheet.setName(backupName);

  // Move backup sheet to the end
  ss.moveActiveSheet(ss.getNumSheets());

  // Make Main Inventory the active sheet again
  ss.setActiveSheet(inventorySheet);

  // Log success
  Logger.log(`Backup created successfully: ${backupName}`);
  Logger.log(`Backed up ${lastRow - 1} items`);

  // Show success message if called manually
  if (isCalledManually()) {
    ss.toast(
      `✅ Backup created: "${backupName}"\n\n` +
      `Backed up ${lastRow - 1} item(s).\n\n` +
      'The backup sheet is at the end of your tabs.',
      'Backup Complete',
      8
    );
  }
}

/**
 * Sets up automatic backups to run every 3 months
 * Creates a time-driven trigger
 */
function setupAutomaticBackups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Check if trigger already exists
  const existingTrigger = findBackupTrigger();

  if (existingTrigger) {
    const response = ui.alert(
      'Automatic Backups Already Active',
      'Automatic backups are already scheduled to run every 3 months.\n\n' +
      'Do you want to:\n' +
      '• Click "Yes" to keep existing schedule\n' +
      '• Click "No" to reset schedule (will create new backup immediately)',
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      ss.toast('Automatic backups are already active.', 'Info', 3);
      return;
    } else {
      // Delete old trigger and create new one
      ScriptApp.deleteTrigger(existingTrigger);
      Logger.log('Deleted old backup trigger');
    }
  }

  // Confirm setup
  const response = ui.alert(
    'Setup Automatic Backups?',
    'This will create automatic backups of your Main Inventory every 3 months.\n\n' +
    '✅ Backups are non-destructive (just creates copies)\n' +
    '✅ Backups are timestamped and saved as new sheets\n' +
    '✅ You can also create manual backups anytime\n' +
    '✅ You can disable automatic backups later\n\n' +
    'A backup will be created immediately, then every 3 months.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Backup setup cancelled.', 'Cancelled', 3);
    return;
  }

  // Create immediate backup
  createBackup();

  // Create time-driven trigger for every 3 months
  ScriptApp.newTrigger('createBackup')
    .timeBased()
    .everyDays(90)  // 3 months ≈ 90 days
    .create();

  Logger.log('Automatic backup trigger created - runs every 90 days (3 months)');

  ui.alert(
    'Automatic Backups Activated! ✅',
    'Your Main Inventory will now be backed up automatically every 3 months.\n\n' +
    'First backup: Created now (check your sheet tabs)\n' +
    'Next backup: In 3 months\n\n' +
    'To disable automatic backups:\n' +
    'Menu → Inventory Manager → Disable Automatic Backups',
    ui.ButtonSet.OK
  );
}

/**
 * Disables automatic backups by deleting the trigger
 */
function disableAutomaticBackups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const existingTrigger = findBackupTrigger();

  if (!existingTrigger) {
    ss.toast('No automatic backups are currently active.', 'Info', 3);
    return;
  }

  const response = ui.alert(
    'Disable Automatic Backups?',
    'This will stop automatic backups from running every 3 months.\n\n' +
    '⚠️ Your existing backup sheets will NOT be deleted.\n' +
    '⚠️ You can still create manual backups anytime.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Cancelled.', 'Info', 2);
    return;
  }

  ScriptApp.deleteTrigger(existingTrigger);
  Logger.log('Automatic backup trigger deleted');

  ss.toast(
    'Automatic backups disabled.\n\n' +
    'Existing backups are still available.\n' +
    'You can still create manual backups.',
    'Backups Disabled',
    5
  );
}

/**
 * Shows backup status and information
 */
function showBackupInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Check if automatic backups are enabled
  const trigger = findBackupTrigger();
  const autoBackupStatus = trigger ? '✅ ACTIVE - Runs every 3 months' : '❌ NOT ACTIVE';

  // Count existing backup sheets
  const allSheets = ss.getSheets();
  const backupSheets = allSheets.filter(sheet => sheet.getName().startsWith('Backup - Main Inventory'));
  const backupCount = backupSheets.length;

  // Get dates of backups if any exist
  let backupList = '';
  if (backupCount > 0) {
    backupList = '\n\nExisting backups:\n';
    backupSheets.forEach((sheet, index) => {
      const name = sheet.getName();
      const date = name.replace('Backup - Main Inventory - ', '');
      backupList += `${index + 1}. ${date}\n`;
    });
  }

  ui.alert(
    'Backup System Status',
    `Automatic Backups: ${autoBackupStatus}\n` +
    `Total Backups: ${backupCount} sheet(s)${backupList}\n\n` +
    'Manual Backup:\n' +
    '• Menu → Inventory Manager → 💾 Create Backup Now\n\n' +
    'Automatic Backups:\n' +
    '• Menu → Inventory Manager → ⏰ Setup Automatic Backups\n\n' +
    'To restore from backup:\n' +
    '1. Open backup sheet\n' +
    '2. Copy all data (Ctrl+A, Ctrl+C)\n' +
    '3. Open Main Inventory\n' +
    '4. Paste data (Ctrl+V)',
    ui.ButtonSet.OK
  );
}

/**
 * Helper function to find the backup trigger
 * Returns the trigger if found, null otherwise
 */
function findBackupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'createBackup') {
      return triggers[i];
    }
  }

  return null;
}

/**
 * Helper function to detect if function was called manually or by trigger
 * Returns true if called manually (user clicked menu)
 */
function isCalledManually() {
  // Check if there's an active UI session
  try {
    SpreadsheetApp.getUi();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Deletes old backup sheets (older than 1 year)
 * Useful for cleanup if you have too many backups
 */
function deleteOldBackups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Find all backup sheets
  const allSheets = ss.getSheets();
  const backupSheets = allSheets.filter(sheet => sheet.getName().startsWith('Backup - Main Inventory'));

  if (backupSheets.length === 0) {
    ss.toast('No backup sheets found.', 'Info', 3);
    return;
  }

  // Calculate cutoff date (1 year ago)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const sheetsToDelete = [];

  backupSheets.forEach(sheet => {
    const name = sheet.getName();
    const dateStr = name.replace('Backup - Main Inventory - ', '');

    try {
      // Parse date from sheet name (format: "yyyy-MM-dd HH:mm")
      const backupDate = new Date(dateStr.split(' ')[0]);

      if (backupDate < oneYearAgo) {
        sheetsToDelete.push({
          sheet: sheet,
          name: name,
          date: dateStr
        });
      }
    } catch (e) {
      Logger.log(`Could not parse date from backup: ${name}`);
    }
  });

  if (sheetsToDelete.length === 0) {
    ss.toast('No backups older than 1 year found.', 'Info', 3);
    return;
  }

  // Confirm deletion
  let deleteList = '';
  sheetsToDelete.forEach((item, index) => {
    deleteList += `${index + 1}. ${item.date}\n`;
  });

  const response = ui.alert(
    'Delete Old Backups?',
    `Found ${sheetsToDelete.length} backup(s) older than 1 year:\n\n${deleteList}\n` +
    '⚠️ This will permanently delete these backup sheets.\n' +
    '⚠️ This action cannot be undone.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ss.toast('Cancelled.', 'Info', 2);
    return;
  }

  // Delete old backups
  let deletedCount = 0;
  sheetsToDelete.forEach(item => {
    ss.deleteSheet(item.sheet);
    Logger.log(`Deleted old backup: ${item.name}`);
    deletedCount++;
  });

  ss.toast(
    `✅ Deleted ${deletedCount} old backup(s).\n\n` +
    'Recent backups are still available.',
    'Cleanup Complete',
    5
  );
}
