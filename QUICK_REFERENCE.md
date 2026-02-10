# Quick Reference - Home Inventory System

One-page cheat sheet for daily use.

---

## 🎯 Daily Workflow

### Adding Items (ChatGPT Method)

```
1. Open ChatGPT speech mode
2. Say: "I'm putting [item] in storage [location] box [number]"
3. Copy ChatGPT's response
4. Open Google Sheet → Parser Input tab
5. Paste text in cell A2
6. Menu: Inventory Manager → Parse Transactions
7. Go to Pending Changes tab
8. Check boxes for items to add
9. Menu: Inventory Manager → Commit Checked Changes
```

### Finding Items

```
1. Go to Settings tab
2. Enter item name in cell B6
3. Menu: Inventory Manager → Search Inventory
4. Results show location and box number
```

---

## 📍 Storage Locations

| Code | Location |
|------|----------|
| **home** | Items at home |
| **4** | Storage unit on 4th floor |
| **P** | Parking garage storage |

---

## 🗣️ ChatGPT Formats That Work

```
✅ "WD-40 at 4-23"
✅ "Hammer in parking box 5"
✅ "Rope in storage 4 box 12"
✅ "3 hammers at P-5"
✅ "Moving drill from home to 4-15"
✅ "Removed WD-40 from 4-23"
```

---

## 🎨 Color Codes

| Color | Meaning |
|-------|---------|
| 🟡 Yellow | Pending review |
| 🟢 Green | Confirmed/Added |
| 🔴 Red | Error or removed |
| 🔵 Blue | Move action |

---

## 📱 Menu Quick Actions

| Action | What It Does |
|--------|--------------|
| **Parse Transactions** | Process ChatGPT text |
| **Commit Checked Changes** | Apply pending changes |
| **Search Inventory** | Find items |
| **Clear Completed** | Clean up pending list |

---

## 🔧 Common Fixes

### Parser didn't find items
→ Check format matches examples above
→ Try: "Item at Location-Box"

### Wrong location parsed
→ Edit in Pending Changes before committing
→ Change New Loc and New Box columns

### Can't find item in search
→ Try partial name ("WD" not "WD-40")
→ Check spelling in Main Inventory

### "Another user is committing"
→ Wait 30 seconds and retry
→ Other user is saving changes

---

## 👥 Multi-User Tips

- Set your name in Settings tab (User 1 or User 2)
- Check timestamp to identify your changes
- Don't edit other user's pending rows
- Both can parse at same time ✅

---

## 📊 Sheet Tabs

| Tab | Purpose |
|-----|---------|
| **Main Inventory** | Current items (source of truth) |
| **Pending Changes** | Review before committing |
| **Transaction History** | Audit log of all changes |
| **Parser Input** | Paste ChatGPT text here |
| **Settings** | User name and search |

---

## ⌨️ Keyboard Shortcuts

- **Ctrl+F** - Find in sheet
- **Ctrl+;** - Insert today's date
- **F5** - Refresh page
- **Alt+Shift+I** - Open menu (Mac: Option+Shift+I)

---

## 🚨 Important Notes

1. **Always check boxes** before clicking Commit
2. **Review Pending Changes** carefully before committing
3. **Set your user name** in Settings tab
4. **Clear completed pending** regularly to keep it clean
5. **Backup your data** - File → Make a copy monthly

---

## 📖 Need More Help?

- **Full guide:** README.md
- **Setup help:** SETUP_INSTRUCTIONS.md
- **Script logs:** Extensions → Apps Script → View → Logs

---

## 🎓 Pro Tips

✨ **Dictate multiple items at once** - ChatGPT handles comma-separated lists

✨ **Edit before committing** - Fix any mistakes in Pending Changes

✨ **Use partial names** - "WD" finds "WD-40"

✨ **Check history** - Transaction History shows who changed what

✨ **Manual entry works too** - Just type in Main Inventory tab

---

## 🔄 Typical Session

```
Arrive at storage with items
  ↓
Open ChatGPT on phone
  ↓
Dictate all items
  ↓
Copy ChatGPT output
  ↓
Open Google Sheet on tablet
  ↓
Paste → Parse → Review → Commit
  ↓
Done in 2 minutes! ✅
```

---

**Happy Organizing! 📦**
