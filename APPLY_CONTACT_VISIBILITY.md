# Contact Owner Visibility Feature

## ✅ What's New

Partners can now:
- **Show/hide** their contact info on property pages
- **Display their name** and business name to guests
- **Choose** whether to make contacts public

Guests can now:
- **See owner name** on property details page
- **Contact owner directly** via WhatsApp or phone
- **See business name** if provided

---

## 🔧 To Apply This Feature

### Step 1: Run the Database Migration

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Paste and run this SQL:

```sql
-- Add contact visibility field to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS show_contacts_publicly BOOLEAN NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.partners.show_contacts_publicly IS 'Controls whether partner contact info is visible on property pages';
```

Click **Run** ✅

---

## 📋 How It Works

### For Partners:

1. Go to **My Profile & Contacts**
2. Find **"Contact Visibility"** section
3. Toggle **"Show my contacts publicly"**
4. Fill in your phone number
5. Click **Save**

### What Guests See:

**If contacts are PUBLIC:**
```
┌─────────────────────────┐
│  🧑 Property Owner      │
├─────────────────────────┤
│  Hosted by             │
│  John Doe              │
│  Cozy Stays Kenya      │
│                        │
│  Contact               │
│  [WhatsApp] [Call]     │
│  +254 700 000 000      │
└─────────────────────────┘
```

**If contacts are PRIVATE:**
- Contact section doesn't appear
- Guests can only use the booking form

---

## 🎯 Features

### ✅ In Partner Profile:
- Toggle to show/hide contacts
- Preview of how contacts appear
- Settings saved to database

### ✅ On Property Details Page:
- Shows owner's full name
- Shows business name (if provided)
- Shows WhatsApp & Call buttons
- Only appears if partner approved public contacts
- Phone number displayed below buttons

### ✅ Privacy Control:
- Partners can hide contacts anytime
- Changes apply immediately to all properties
- Default is PUBLIC (can be changed)

---

## 🔍 Technical Details

### Database Changes:
- Added `show_contacts_publicly` column to `partners` table
- Type: BOOLEAN
- Default: TRUE
- Allows partners to control visibility

### What Gets Displayed:
- Partner's full name (from `profiles` table)
- Business name (from `partners` table)
- Phone number (from `profiles` table)
- Only if `show_contacts_publicly = true`

---

## ✨ Next Steps

After running the migration:

1. **Test as Partner:**
   - Update your profile
   - Toggle contact visibility
   - Save and verify

2. **Test as Guest:**
   - View any property
   - Check if owner contact appears
   - Try WhatsApp & Call buttons

3. **Verify Privacy:**
   - Set contacts to PRIVATE
   - View property page
   - Contact section should NOT appear

---

## 🐛 Troubleshooting

**Contact section not showing?**
- Check if partner enabled "Show my contacts publicly"
- Verify partner has phone number in profile
- Refresh the property page

**TypeScript errors?**
- Restart your dev server: `npm run dev`
- The migration adds the new field
- Types will update automatically

**Contact toggle not saving?**
- Check browser console for errors
- Verify migration was applied
- Try logging out and back in

---

## 📝 Summary

✅ **Database:** Migration adds visibility column  
✅ **Partner Profile:** Toggle to show/hide contacts  
✅ **Property Page:** Shows owner name & contact if approved  
✅ **Privacy:** Full control over what guests see  
✅ **UX:** Clean, professional contact section  

**Now guests can connect directly with property owners!** 🎉
