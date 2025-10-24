# Fix: Independent WhatsApp Number

## 🐛 Problem Fixed

**Before:**
- Updating phone number also changed WhatsApp number
- WhatsApp number couldn't be saved independently
- Both fields were linked to the same database column

**After:**
- ✅ Phone and WhatsApp are separate fields
- ✅ Each can be edited independently
- ✅ WhatsApp defaults to phone number if not set
- ✅ Property page shows both numbers if different

---

## 🔧 Apply This Fix

### Step 1: Run Database Migration

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Paste and run:

```sql
-- Add whatsapp_number field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'Separate WhatsApp number (can be different from main phone)';
```

Click **Run** ✅

---

## ✨ How It Works Now

### In Partner Profile:

```
Phone Number:     +254 700 111 222  (For regular calls)
WhatsApp Number:  +254 700 333 444  (For WhatsApp - can be different!)
```

### When You Save:
- Both numbers are saved independently
- Changing phone doesn't affect WhatsApp
- Changing WhatsApp doesn't affect phone
- If WhatsApp is empty, it defaults to phone number

### On Property Page:

**If numbers are the SAME:**
```
Contact:
[WhatsApp] [Call]
Phone: +254 700 111 222
```

**If numbers are DIFFERENT:**
```
Contact:
[WhatsApp] [Call]
Phone: +254 700 111 222
WhatsApp: +254 700 333 444
```

---

## 🎯 Benefits

✅ **Flexibility:** Use different numbers for calls vs WhatsApp  
✅ **Business Lines:** Phone for office, WhatsApp for personal  
✅ **Independence:** Edit either without affecting the other  
✅ **Smart Display:** Shows both numbers if different  
✅ **Fallback:** WhatsApp uses phone number if not set separately  

---

## 📝 Testing

1. **Update Migration:**
   - Run the SQL in Supabase
   - Restart your dev server

2. **Test in Profile:**
   - Go to Partner Profile
   - Change Phone Number → Save
   - Change WhatsApp Number → Save
   - Verify both saved correctly

3. **Test on Property Page:**
   - View any property
   - Check Contact section
   - Click WhatsApp button → Should use WhatsApp number
   - Click Call button → Should use Phone number

---

## 🔍 Technical Details

### Database:
- Added `whatsapp_number` column to `profiles` table
- Type: TEXT (nullable)
- Independent from `phone_number`

### Code Changes:
- **PartnerProfile.tsx:** Saves/loads WhatsApp separately
- **PropertyDetails.tsx:** Shows both numbers, uses correct one for each button

### Logic:
- WhatsApp button → Uses `whatsapp_number` (or `phone_number` if empty)
- Call button → Always uses `phone_number`
- Display → Shows both if different

---

**Now you can have separate phone and WhatsApp numbers!** 📱💬
