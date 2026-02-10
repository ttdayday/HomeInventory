# Home Inventory Management System

A Google Sheets-based inventory tracking system with a review/confirm workflow for managing items across multiple storage locations.

## Overview

This system helps you track items stored across your home, storage unit (4th floor), and parking garage. The key feature is a **staging area** where you can review proposed changes before committing them to your inventory - just like reviewing code changes before merging!

### Key Features

- ✅ **Review/Confirm Workflow** - Preview changes before applying them
- 📝 **ChatGPT Integration** - Paste plain text from ChatGPT voice dictation
- 🔍 **Search Functionality** - Quickly find items by name
- 👥 **Multi-User Support** - Both users can work independently
- 📊 **Transaction History** - Complete audit trail of all changes
- 🏷️ **Location Tracking** - Track items across home, storage 4, and parking P

---

## Storage Locations

- **home** - Items stored at home
- **4** - Storage unit on 4th floor
- **P** - Parking garage storage unit

---

## Quick Start Guide

### For Adding Items (Using ChatGPT)

1. **Dictate to ChatGPT:**
   - Open ChatGPT speech mode
   - Say: *"I'm putting WD-40 in storage 4 box 23, hammer in parking box 5"*
   - ChatGPT will respond with text

2. **Copy the text** from ChatGPT

3. **Open your Google Sheet:**
   - Go to **Parser Input** tab
   - Paste the text into the large text area (cell A2)
   - Click menu: **Inventory Manager → Parse Transactions**

4. **Review changes:**
   - Go to **Pending Changes** tab
   - You'll see rows like:
     - ☐ ADD | WD-40 | → 4-23 | Qty: 1
     - ☐ ADD | Hammer | → P-5 | Qty: 1
   - Check the boxes next to items you want to add

5. **Commit:**
   - Click menu: **Inventory Manager → Commit Checked Changes**
   - Changes are now in **Main Inventory** tab
   - Transaction logged in **Transaction History** tab

### For Finding Items

1. Go to **Settings** tab
2. Enter item name in cell B6 (e.g., "WD-40")
3. Click menu: **Inventory Manager → Search Inventory**
4. Results appear below showing location and box number

### For Manual Entry

You can also add items directly in the **Main Inventory** tab:
- Just fill in: Item Name, Location (home/4/P), Box, Quantity
- Changes are automatically tracked in Transaction History

---

## Supported ChatGPT Formats

The parser understands these natural language formats:

### Basic Formats
```
WD-40 at 4-23
Hammer at P-5
Drill at home
Nails in 4-15
Rope in storage 4 box 12
Screwdriver in parking box 8
```

### With Quantities
```
3 hammers at P-5
5x nails in 4-23
10 screws at home
```

### Moving Items
```
Moving drill from home to 4-15
Move tape from P-3 to storage 4 box 20
```

### Removing Items
```
Removed WD-40 from 4-23
Took out hammer from P-5
```

**Tips:**
- Multiple items can be on separate lines or comma-separated
- Location names are flexible: "storage 4", "4", "fourth floor" all work
- "parking", "garage", "P" all refer to parking garage

---

## User Workflow Details

### How the Review/Confirm System Works

1. **Parsing Stage**
   - ChatGPT output is parsed into structured transactions
   - Each item is checked against existing inventory
   - Action type is determined automatically:
     - **ADD** - New item
     - **UPDATE** - Item exists, updating quantity
     - **MOVE** - Item exists, changing location
     - **REMOVE** - Taking item out
   - All proposed changes go to **Pending Changes** sheet
   - NO changes are made to inventory yet

2. **Review Stage**
   - You see exactly what will change:
     - Current state (if item exists)
     - Proposed new state
     - Original ChatGPT text for reference
   - Color coding helps identify action types:
     - Yellow background = Pending review
     - Green action badge = ADD
     - Blue action badge = MOVE
     - Red action badge = REMOVE

3. **Selection Stage**
   - Check boxes next to changes you approve
   - Can edit fields if ChatGPT misunderstood something
   - Can add notes

4. **Commit Stage**
   - System processes only checked items
   - Updates Main Inventory
   - Logs to Transaction History
   - Marks as "Confirmed" (green background)
   - Unchecked items remain pending

5. **Cleanup**
   - Confirmed items turn green
   - Use **Clear Completed Pending Changes** to clean up old entries

---

## Multi-User Guide

### Setting Your User Name

1. Go to **Settings** tab
2. Cell B1: Enter "User 1" or "User 2"
3. This name appears in Transaction History

### Working Together

**Both users can work simultaneously:**
- Parse different items at the same time ✅
- Review your own pending changes ✅
- Commit independently ✅

**How to avoid conflicts:**
- Check timestamp in Pending Changes to identify your changes
- Don't edit another user's pending rows
- If commit says "Locked", another user is committing - wait 30 seconds and retry
- Main Inventory can be viewed anytime without conflicts

**Best Practice:**
- When you arrive at storage, parse your items right away
- Review and commit before leaving
- Each user manages their own pending changes

---

## Sheets Structure

### 1. Main Inventory
**The source of truth** - Current state of all items

**Columns:**
- Item Name
- Location (home, 4, P)
- Box (number)
- Quantity
- Last Updated
- Updated By
- Full Location (auto-calculated: Location-Box)

### 2. Pending Changes
**Staging area** - Review before committing

**Columns:**
- ☑ Checkbox (check to commit)
- Action (ADD/UPDATE/MOVE/REMOVE)
- Item Name
- Current Location/Box (if exists)
- New Location/Box
- Quantity
- Notes (original ChatGPT text)
- Timestamp
- Status (Pending/Confirmed/Rejected)

### 3. Transaction History
**Audit log** - Complete history of all changes

Records every change with:
- Timestamp
- User
- Action
- Item Name
- From/To locations
- Quantity
- Notes

### 4. Parser Input
**Simple interface** - Paste ChatGPT output here

- Large text area for pasting
- Instructions and examples
- Parse button in menu

### 5. Settings
**Configuration and search**

- User name setting
- Valid locations reference
- Search interface

---

## Menu Functions

Access these from the **Inventory Manager** menu:

### 📝 Parse Transactions
- Parses ChatGPT output from Parser Input tab
- Creates pending changes for review

### ✅ Commit Checked Changes
- Applies checked changes to Main Inventory
- Updates Transaction History
- Marks changes as confirmed

### 🔍 Search Inventory
- Finds items by name (partial match works)
- Shows location, box, and quantity

### 🧹 Clear Completed Pending Changes
- Removes confirmed/rejected items from Pending Changes
- Keeps the sheet clean

### ⚙️ Setup Sheets
- Initial setup - creates all sheets
- Run this once when first setting up

### 🔄 Reset All Data
- Clears all data (structure remains)
- Use with caution!

---

## Troubleshooting

### Parser doesn't recognize text
**Solution:**
- Check format matches examples
- Try: "Item at Location-Box" format
- Manually add to Pending Changes if needed

### Wrong location parsed
**Solution:**
- Edit the location in Pending Changes before committing
- Check the New Loc and New Box columns

### Can't find an item
**Solution:**
- Try partial name (search "WD" instead of "WD-40")
- Check Transaction History to see if it was moved or removed
- Verify spelling in Main Inventory

### "Another user is committing" message
**Solution:**
- Wait 30 seconds
- Click Commit again
- The lock prevents conflicting changes

### Changes not appearing in Main Inventory
**Solution:**
- Check the boxes in Pending Changes first
- Then click Commit Checked Changes
- Verify Status changed to "Confirmed"

---

## Tips & Best Practices

### Using ChatGPT Effectively

**Good dictation:**
- "WD-40 in storage 4 box 23"
- "Three hammers in parking box 5"
- "Rope in storage unit 4 box 12"

**Ask ChatGPT to format:**
- "List these items in format: item at location-box"
- ChatGPT will structure it correctly

### Organizing Your Storage

- **Number your boxes** - Makes tracking easier
- **Group similar items** - Tools in boxes 1-10, holiday in 11-20, etc.
- **Label boxes** - Write box number on outside
- **Update immediately** - Parse items as you store them

### Maintaining the System

- **Clear pending regularly** - Use "Clear Completed Pending Changes" weekly
- **Check Transaction History** - Review what's been moved or removed
- **Search before buying** - Check if you already have WD-40 before buying more
- **Regular audits** - Once a year, verify physical items match inventory

---

## Advanced Features

### Manually Editing Pending Changes

Before committing, you can:
- Edit Item Name if ChatGPT got it wrong
- Change Location or Box number
- Adjust Quantity
- Add notes for context

### Batch Operations

To move multiple items at once:
1. Manually add rows to Pending Changes
2. Set Action to "MOVE"
3. Fill in From and To locations
4. Check all boxes
5. Commit

### Using Transaction History

Filter or search Transaction History to:
- See all changes by one user
- Find when an item was moved
- Audit quantity changes
- Review what was removed

---

## Future Enhancements

Planned features for version 2:
- 📷 Photo attachments (Google Drive links)
- 🏷️ Barcode/QR code labels for boxes
- 📧 Email notifications
- 📁 Category tags (tools, holiday, sports)
- 📱 Mobile-optimized interface
- 📊 Reports and statistics

---

## Support

For issues or questions:
1. Check this README first
2. Review the examples in Parser Input tab
3. Check Google Apps Script logs (View > Logs in Script Editor)
4. Contact the system administrator

---

## Technical Details

**Built with:**
- Google Sheets (spreadsheet)
- Google Apps Script (JavaScript automation)
- No external dependencies or costs

**Files:**
- `SheetSetup.gs` - Creates sheet structure
- `Core.gs` - Main business logic
- `Parser.gs` - Text parsing engine
- `Migration.gs` - Import existing data

**Security:**
- All data stays in your Google Sheet
- Standard Google Sheets permissions
- Transaction History is protected (warning before edit)

---

## Version History

**v1.0** - Initial release
- Basic inventory tracking
- ChatGPT text parsing
- Review/confirm workflow
- Multi-user support
- Search functionality
- Transaction history

---

## License

This is a custom system built for personal use. Feel free to adapt and modify as needed!
