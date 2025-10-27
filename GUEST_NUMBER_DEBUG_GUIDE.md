# 🔍 Guest Number Display Issue - Debug Guide

## ✅ Changes Made to Track the Issue

### 1. **Added Validation in AddProperty.tsx**
**File**: `src/pages/AddProperty.tsx` (Lines 105-119)

```tsx
// Validate required numeric fields
if (!formData.maxGuestsPerUnit || parseInt(formData.maxGuestsPerUnit) < 1) {
  toast.error("Please enter the maximum number of guests per unit");
  return;
}
```

**What this does**: Ensures partners can't submit a property without entering guest numbers.

---

### 2. **Added Console Logging in AddProperty.tsx**
**File**: `src/pages/AddProperty.tsx` (Lines 154-163)

```tsx
// Log the values being saved
const maxGuestsValue = parseInt(formData.maxGuestsPerUnit);
const numberOfUnitsValue = parseInt(formData.numberOfUnits);

console.log("Saving property with:", {
  max_guests_per_unit: maxGuestsValue,
  number_of_units: numberOfUnitsValue,
  raw_max_guests: formData.maxGuestsPerUnit,
  raw_units: formData.numberOfUnits
});
```

**What this does**: Logs exactly what values are being saved to the database when a partner adds a property.

---

### 3. **Added Console Logging in Index.tsx**
**File**: `src/pages/Index.tsx` (Lines 54-59)

```tsx
// Log fetched properties to check guest numbers
console.log("Fetched properties:", data?.slice(0, 3).map(p => ({
  name: p.property_name,
  max_guests_per_unit: p.max_guests_per_unit,
  number_of_units: p.number_of_units
})));
```

**What this does**: Shows what guest numbers are being fetched from the database on the homepage.

---

## 🔍 How to Debug the Issue

### Step 1: Test Adding a New Property
1. **Login as a partner**
2. **Go to "Add Property"**
3. **Fill in the "Max Guests per Unit" field** (e.g., enter 4)
4. **Open browser console** (F12)
5. **Submit the form**
6. **Check console output** for:
   ```
   Saving property with: {
     max_guests_per_unit: 4,
     number_of_units: 1,
     raw_max_guests: "4",
     raw_units: "1"
   }
   ```

**Expected**: Should see the number you entered (e.g., 4)
**If you see NaN or undefined**: The form isn't capturing the value correctly

---

### Step 2: Check Homepage Display
1. **Refresh the homepage**
2. **Open browser console** (F12)
3. **Look for** this log:
   ```
   Fetched properties: [
     {
       name: "Property Name",
       max_guests_per_unit: 4,
       number_of_units: 1
     }
   ]
   ```

**Expected**: Should see the same number you entered (e.g., 4)
**If you see null, undefined, or different number**: Database issue

---

### Step 3: Check Property Card Display
1. **Look at property cards** on homepage
2. **Find the line**: "Up to X guests"
3. **Verify it matches** what you entered

**Code location**: `src/components/PropertyCard.tsx` line 104:
```tsx
<span className="text-sm">Up to {property.max_guests_per_unit} guests</span>
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Form Shows Empty Value
**Symptoms**: Console shows `raw_max_guests: ""`
**Cause**: Partner didn't fill the field
**Solution**: ✅ Already fixed with validation (lines 105-109 in AddProperty.tsx)

---

### Issue 2: Database Saving NULL
**Symptoms**: 
- Console on save shows correct value
- Console on fetch shows `null` or `undefined`

**Cause**: Database column doesn't exist or wrong column name

**Solution**: Run this SQL in Supabase:
```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'max_guests_per_unit';

-- If it doesn't exist, add it
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS max_guests_per_unit INTEGER;

-- Check existing data
SELECT id, property_name, max_guests_per_unit, number_of_units 
FROM properties 
LIMIT 5;
```

---

### Issue 3: parseInt Returns NaN
**Symptoms**: Console shows `max_guests_per_unit: NaN`

**Cause**: Field value is empty string or invalid

**Solution**: ✅ Already fixed with validation (lines 105-109)

---

### Issue 4: Wrong Column Name
**Symptoms**: Everything seems right but display is wrong

**Possible causes**:
1. Database column named differently (e.g., `max_guests` instead of `max_guests_per_unit`)
2. TypeScript types don't match database

**Check**:
```sql
-- Get exact column names
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name LIKE '%guest%';
```

---

## 📊 Data Flow Diagram

```
Partner fills form
    ↓
[max_guests_per_unit: "4"]
    ↓
Validation checks it's not empty
    ↓
parseInt("4") = 4
    ↓
Console logs: "Saving property with: { max_guests_per_unit: 4 }"
    ↓
INSERT INTO properties (..., max_guests_per_unit: 4)
    ↓
Database stores: 4
    ↓
Homepage queries: SELECT * FROM properties
    ↓
Console logs: "Fetched properties: [{ max_guests_per_unit: 4 }]"
    ↓
PropertyCard displays: "Up to 4 guests"
```

---

## 🎯 Quick Test Checklist

- [ ] Open browser console (F12)
- [ ] Add a new property as partner
- [ ] Fill "Max Guests per Unit" with a specific number (e.g., 5)
- [ ] Check console for "Saving property with:" log
- [ ] Verify the number is correct (not NaN or undefined)
- [ ] Go to homepage
- [ ] Check console for "Fetched properties:" log
- [ ] Verify the same number appears
- [ ] Look at the property card
- [ ] Verify it says "Up to 5 guests"

---

## 🔧 If Still Not Working

### Check Database Directly

**In Supabase SQL Editor**:
```sql
-- Get the most recent property
SELECT 
  id,
  property_name,
  max_guests_per_unit,
  number_of_units,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 1;
```

**What to look for**:
- Is `max_guests_per_unit` NULL?
- Is it 0?
- Is it the number you entered?

---

### Check TypeScript Types

**File**: `src/integrations/supabase/types.ts`

Look for:
```typescript
properties: {
  Row: {
    // ...
    max_guests_per_unit: number
    // ...
  }
}
```

**If it's missing or different**: Regenerate types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

## 📝 Report Template

If issue persists, provide these details:

```
1. Console log from "Saving property with:":
   [paste console output]

2. Console log from "Fetched properties:":
   [paste console output]

3. SQL query result:
   SELECT id, property_name, max_guests_per_unit 
   FROM properties 
   ORDER BY created_at DESC 
   LIMIT 1;
   [paste result]

4. What the property card shows:
   "Up to X guests" - what is X?

5. What you entered in the form:
   [number you typed]
```

---

## ✅ Summary

**Files Modified**:
1. ✅ `src/pages/AddProperty.tsx` - Added validation + logging
2. ✅ `src/pages/Index.tsx` - Added fetch logging
3. ✅ PropertyCard already displays correctly (line 104)

**Next Steps**:
1. Test adding a property
2. Check all console logs
3. Verify the number flows through correctly
4. If it doesn't, follow the troubleshooting steps above

The logging will tell you exactly where the guest number is getting lost!
