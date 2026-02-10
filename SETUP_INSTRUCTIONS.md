# Setup Instructions - Home Inventory Management System

Complete step-by-step guide to set up your inventory management system from scratch.

---

## Prerequisites

- Google Account
- Access to Google Sheets
- Existing inventory data (optional - if you want to migrate)

**Time to complete:** 15-30 minutes

---

## Part 1: Create New Google Sheet

### Step 1: Create a New Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it: **"Home Inventory"** (click "Untitled spreadsheet" at the top)

✅ You should now have a blank Google Sheet

---

## Part 2: Add Apps Script Code

### Step 2: Open Script Editor

1. In your Google Sheet, click **Extensions** menu
2. Click **Apps Script**
3. A new tab opens with the Script Editor
4. Delete any existing code in `Code.gs`

### Step 3: Create Script Files

You'll create 4 script files. For each file:

**File 1: SheetSetup.gs**

1. In Script Editor, click **+** next to Files
2. Click **Script**
3. Name it: `SheetSetup`
4. Copy the entire contents of `SheetSetup.gs` from this repository
5. Paste it into the editor
6. Click **Save** (💾 icon or Ctrl+S)

**File 2: Core.gs**

1. Click **+** next to Files again
2. Click **Script**
3. Name it: `Core`
4. Copy contents of `Core.gs` and paste
5. Save

**File 3: Parser.gs**

1. Click **+** next to Files
2. Click **Script**
3. Name it: `Parser`
4. Copy contents of `Parser.gs` and paste
5. Save

**File 4: Migration.gs**

1. Click **+** next to Files
2. Click **Script**
3. Name it: `Migration`
4. Copy contents of `Migration.gs` and paste
5. Save

You can now delete the original `Code.gs` file if it's empty.

### Step 4: Save the Project

1. Click **💾 Save** or press Ctrl+S
2. Name the project: **"Home Inventory System"**

✅ All scripts are now loaded

---

## Part 3: Run Initial Setup

### Step 5: Run Setup Function

1. Still in Script Editor, at the top, find the function dropdown
2. Select **`setupSheets`** from the dropdown
3. Click **▶ Run**

### Step 6: Grant Permissions (First Time Only)

**You'll see a permission dialog:**

1. Click **Review permissions**
2. Choose your Google account
3. Click **Advanced** (at bottom left)
4. Click **Go to Home Inventory System (unsafe)**
   - Don't worry - this is your own script, it's safe!
5. Click **Allow**

**Why these permissions?**
- Read and write to your spreadsheet
- Display UI dialogs

### Step 7: Wait for Setup

- The script runs and creates all sheets
- Takes 5-10 seconds
- You'll see a success dialog when done
- Click **OK**

### Step 8: Return to Spreadsheet

1. Close the Script Editor tab
2. Go back to your Google Sheet tab
3. Refresh the page (F5 or reload button)

✅ You should now see 5 tabs:
- Main Inventory
- Pending Changes
- Transaction History
- Parser Input
- Settings

✅ You should see a new menu: **Inventory Manager**

---

## Part 4: Configure Settings

### Step 9: Set Your User Name

1. Go to **Settings** tab
2. Cell B1: Enter **"User 1"** or **"User 2"**
   - This identifies who makes changes
   - Your spouse should use the other name

✅ User configured

---

## Part 5: Migrate Existing Data (Optional)

**Skip this part if you're starting from scratch.**

### Step 10: Prepare Your Existing Data

1. Open your existing Google Sheet inventory
2. Make a backup copy: **File → Make a copy**
3. Verify your columns are in this order:
   - Column A: Item Name
   - Column B: Location
   - Column C: Box
   - Column D: Quantity
4. Copy the URL of your existing sheet

### Step 11: Configure Migration Script

1. Go back to Script Editor (Extensions → Apps Script)
2. Open **Migration.gs** file
3. Find line ~25: `const SOURCE_SHEET_URL = 'YOUR_EXISTING_SHEET_URL_HERE';`
4. Replace `'YOUR_EXISTING_SHEET_URL_HERE'` with your actual sheet URL in quotes
5. Example: `const SOURCE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/ABC123xyz/edit';`
6. Save (Ctrl+S)

### Step 12: Preview Migration (Recommended)

1. In function dropdown, select **`previewMigration`**
2. Click **▶ Run**
3. Check the preview shows your items correctly
4. Click **OK**

### Step 13: Run Migration

1. In function dropdown, select **`migrateExistingData`**
2. Click **▶ Run**
3. Click **YES** to confirm
4. Wait for completion message
5. Click **OK**

### Step 14: Verify Migration

1. Return to your Google Sheet
2. Go to **Main Inventory** tab
3. Verify items imported correctly
4. Check a few items match your original sheet
5. Verify locations are correct (home, 4, or P)

✅ Data migrated successfully

---

## Part 6: Test the System

### Step 15: Test Parsing

1. Go to **Parser Input** tab
2. In the large text area (cell A2), paste this test data:
   ```
   Test Hammer at P-5
   Test Screwdriver in storage 4 box 10
   Test Wrench at home
   ```
3. Click menu: **Inventory Manager → Parse Transactions**
4. You should see a success message

### Step 16: Test Review

1. Go to **Pending Changes** tab
2. You should see 3 rows:
   - Test Hammer | Action: ADD | Location: P-5
   - Test Screwdriver | Action: ADD | Location: 4-10
   - Test Wrench | Action: ADD | Location: home
3. Check the boxes (column A) for all three items

### Step 17: Test Commit

1. Click menu: **Inventory Manager → Commit Checked Changes**
2. You should see "Committed 3 changes successfully"
3. Go to **Main Inventory** tab
4. Verify the 3 test items appear
5. Go to **Transaction History** tab
6. Verify 3 transactions are logged

### Step 18: Test Search

1. Go to **Settings** tab
2. Cell B6: Enter **"Test Hammer"**
3. Click menu: **Inventory Manager → Search Inventory**
4. Results should show: Test Hammer | Location: P | Box: 5

✅ System working correctly!

### Step 19: Clean Up Test Data

1. Go to **Main Inventory** tab
2. Delete the 3 test item rows (right-click row number → Delete row)
3. Or use menu: **Inventory Manager → Reset All Data** (deletes everything)

---

## Part 7: Start Using the System

### Step 20: Add Your First Real Items

**Option A: Using ChatGPT (Recommended)**

1. Open ChatGPT speech mode
2. Say: "I'm putting WD-40 in storage unit 4 box 23"
3. Copy ChatGPT's response
4. Go to **Parser Input** tab in your sheet
5. Paste the text
6. Click: **Inventory Manager → Parse Transactions**
7. Go to **Pending Changes**, check boxes
8. Click: **Inventory Manager → Commit Checked Changes**

**Option B: Manual Entry**

1. Go to **Main Inventory** tab
2. Click row 2 (first empty row)
3. Enter:
   - Column A: Item name (e.g., "WD-40")
   - Column B: Location (home, 4, or P)
   - Column C: Box number (e.g., "23")
   - Column D: Quantity (e.g., 1)
4. Press Enter
5. System auto-fills Last Updated and User

✅ First items added!

---

## Part 8: Share with Your Spouse

### Step 21: Share the Sheet

1. Click **Share** button (top right)
2. Enter your spouse's email address
3. Set permission to **Editor**
4. Click **Send**

### Step 22: Spouse Setup

Your spouse should:
1. Open the shared sheet
2. Go to **Settings** tab
3. Change cell B1 to their user name (User 2)
4. Bookmark the sheet for easy access

✅ Both users configured!

---

## Common Setup Issues

### "Script not found" error
**Solution:**
- Make sure you saved all 4 script files
- Refresh the Google Sheet page
- Try running setupSheets again

### "Permission denied" error
**Solution:**
- You need to grant permissions (Step 6)
- Click "Review permissions" and allow access
- Your account must own the sheet

### Sheets not created
**Solution:**
- Check Script Editor logs: View → Logs
- Run setupSheets again
- Delete any partial sheets first

### Menu not appearing
**Solution:**
- Refresh the page (F5)
- Close and reopen the sheet
- Check if onOpen function exists in Core.gs

### Migration errors
**Solution:**
- Verify SOURCE_SHEET_URL is correct
- Check column mapping matches your sheet
- Use previewMigration first to test
- Make sure you have header row setting correct

---

## Keyboard Shortcuts

Once set up, you can use these shortcuts:

- **Alt+Shift+I** → Open Inventory Manager menu (Mac: Option+Shift+I)
- **Ctrl+F** → Find/search in current sheet
- **Ctrl+H** → Find and replace
- **Ctrl+;** → Insert current date
- **Ctrl+Shift+;** → Insert current time

---

## Next Steps

Now that setup is complete:

1. **Learn the workflow** - Review README.md for detailed usage instructions
2. **Start small** - Add 10-20 items to get comfortable
3. **Practice with ChatGPT** - Try different dictation formats
4. **Explore Transaction History** - See how changes are logged
5. **Customize if needed** - Edit formatting, add columns, etc.

---

## Maintenance

### Weekly
- Clear completed pending changes
- Review Transaction History

### Monthly
- Verify frequently accessed items are correctly located
- Update quantities for consumables

### Yearly
- Physical inventory audit (verify items match sheet)
- Archive old Transaction History

---

## Getting Help

If you run into issues:

1. **Check README.md** - Detailed user guide and troubleshooting
2. **Script Editor Logs** - Extensions → Apps Script → View → Logs
3. **Execution History** - Script Editor → Executions (see what ran)
4. **Test Functions** - Run testParser() in Script Editor to test parsing

---

## Backup Recommendations

**Your data is automatically backed up by Google Drive version history, but you can also:**

1. **Weekly Export:**
   - File → Download → Comma-separated values (.csv)
   - Save Main Inventory tab

2. **Monthly Copy:**
   - File → Make a copy
   - Name it: "Home Inventory Backup - [Date]"

3. **Cloud Backup:**
   - Google Drive already backs up your sheet
   - Access version history: File → Version history

---

## Customization Ideas

Once comfortable, you can customize:

- **Add columns** - Add "Category", "Value", "Purchase Date"
- **Change colors** - Customize backgrounds and highlights
- **Add more locations** - Edit data validation in SheetSetup.gs
- **Custom search** - Modify searchInventory() for advanced queries
- **Reports** - Create a "Reports" tab with pivot tables

---

## Summary Checklist

✅ Created new Google Sheet
✅ Added all 4 Apps Script files
✅ Ran setupSheets() successfully
✅ Granted permissions
✅ Configured user name in Settings
✅ Migrated existing data (if applicable)
✅ Tested parsing, review, commit workflow
✅ Tested search functionality
✅ Shared with spouse
✅ Both users configured

**You're all set! 🎉**

Start adding your inventory and enjoy stress-free storage management!
