# Hybrid Payment Options System

## Overview

The hybrid payment options system allows you to define payment options at multiple levels with intelligent override behavior. This provides maximum flexibility while maintaining consistency across your race series.

## Architecture

### Three Levels of Payment Options

1. **Series Default Payment Options** (NEW)
   - Series-wide payment options that apply to ALL series categories
   - Defined in the series editor under "Default Payment Options"
   - Used by series categories that are NOT in any category group

2. **Category Group Payment Options**
   - Payment options specific to a category group
   - Override series default options for categories in that group
   - Defined in the series editor under "Category Groups & Payment Options"

3. **Race Payment Options**
   - Race-specific payment options
   - Can override series defaults and group options when payment type matches
   - Defined in the race editor under "Race Payment"

## Priority Order (Override Logic)

When a user selects a category during registration, the system determines which payment options to show using this priority:

```
1. Race-specific category with forced paytype (HIGHEST PRIORITY)
   └─ Shows ONLY the forced payment type from race payment options

2. Series category in a group
   ├─ Shows ALL group payment options (paytype field ignored)
   ├─ If race has matching payment type → uses race's amount/name (override)
   └─ PLUS any race payment options that don't match group types (additive)

3. Series category NOT in a group
   ├─ Shows ALL series default payment options (paytype field ignored)
   ├─ If race has matching payment type → uses race's amount/name (override)
   └─ PLUS any race payment options that don't match default types (additive)

4. Race-only category without forced paytype (FALLBACK)
   └─ Uses all race payment options
```

**Key Behaviors:**
- **Series Categories:** Always show ALL group/default payment options + race additions (paytype field is informational only)
- **Race Categories with Forced Paytype:** Show ONLY that payment type (restrictive)
- **Race Categories without Forced Paytype:** Show all race payment options

## How Overrides Work

When you define a race payment option with the same `type` as a series default or group option, the race values override the series values:

**Example:**

Series Default Payment Option:
- Type: `early_bird`
- Name: "Early Bird Registration"
- Amount: $25

Race Payment Option (overrides):
- Type: `early_bird`
- Name: "Super Early Bird - Race 1"
- Amount: $20

**Result:** Users registering for series categories will see "Super Early Bird - Race 1" at $20 instead of the series default.

## Use Cases

### Use Case 1: Simple Series with Consistent Pricing

**Setup:**
- Define series default payment options (e.g., "Early Bird $25", "Regular $30")
- All series categories automatically use these options
- No category groups needed

**Benefit:** Set it once, applies to all races in the series

### Use Case 2: Different Pricing for Different Category Types

**Setup:**
- Create category group "High School" with payment options ($15, $20)
- Create category group "Adult" with payment options ($25, $30)
- Assign categories to appropriate groups

**Benefit:** Different pricing tiers for different category types

### Use Case 3: Special Pricing for One Race

**Setup:**
- Series has default payment options ($25, $30)
- For Race #1, add race payment option with type `early_bird` at $20
- Race #1 shows $20, all other races show $25

**Benefit:** Per-race pricing adjustments without changing series configuration

### Use Case 4: Hybrid - Defaults + Groups + Overrides

**Setup:**
- Series default payment options for most categories
- Category groups for special pricing (e.g., "Juniors" group)
- Race-specific overrides for special events

**Benefit:** Maximum flexibility with minimal configuration

### Use Case 5: Series Group + Race-Specific Payment Options (No Forced Paytype)

**Setup:**
- Series category group "Elite" with payment options: "Early Bird $25", "Regular $30", "Season Pass $200"
- Categories "Pro Men", "Pro Women" in the Elite group (NO forced paytype)
- Race #1 adds race payment option: "Expert Entry $130" (type: `expert`)

**Result:** Users registering for Pro Men/Women at Race #1 see all 4 options:
- Early Bird $25 (from group)
- Regular $30 (from group)
- Season Pass $200 (from group)
- Expert Entry $130 (from race, additive)

**Benefit:** Series maintains consistent pricing structure while allowing race-specific options

### Use Case 5b: Forced Payment Type on Series Category

**Setup:**
- Series category group "Elite" with payment options: "Early Bird $25", "Regular $30", "Season Pass $200"
- Category "Pro Men" in Elite group with forced paytype: `early_bird`
- Race #1 adds race payment option: "Expert Entry $130" (type: `expert`)

**Result:** Users registering for Pro Men at Race #1 see ONLY:
- Early Bird $25 (forced paytype from group)

**Benefit:** Ensures specific categories always use a specific pricing tier, regardless of race-specific options

### Use Case 6: Race Override + Additional Option

**Setup:**
- Series default payment options: "Early Bird $25", "Regular $30"
- Race #1 adds race payment options:
  - "Early Bird Special $20" (type: `early_bird` - overrides series default)
  - "VIP Entry $50" (type: `vip` - new option)

**Result:** Users see:
- Early Bird Special $20 (race override of series default)
- Regular $30 (from series default)
- VIP Entry $50 (race-specific addition)

## Configuration Guide

### Setting Up Series Default Payment Options

1. Go to Series Editor
2. Find "Default Payment Options" section
3. Click "+ Add Custom Payment" or use special types (Season Pass, Cash)
4. Define:
   - **Name**: Display name (e.g., "Early Bird Registration")
   - **Type ID**: Unique identifier (e.g., `early_bird`)
   - **Amount**: Price in dollars

### Setting Forced Payment Type on Categories

Categories can have a `paytype` field set to restrict users to a specific payment option:

1. Go to Series Editor (for series categories) or Race Editor (for race categories)
2. Find the Categories section
3. Enable editing mode and click on a category to edit
4. In the "Force Payment Type" dropdown, select a payment type
5. Save the category

**How it works:**
- When a category has a `paytype` set, users can ONLY select that specific payment type
- For **series categories**: The payment type comes from the category group or series defaults
- For **race categories**: The payment type comes from race payment options
- Race payment options can still override the amount/name if they have a matching type
- This is useful for categories that should always use a specific pricing tier (e.g., "Juniors" always use "junior_price")

### Setting Up Category Groups

1. Go to Series Editor
2. Find "Category Groups & Payment Options" section
3. Click "Add Group"
4. Select categories for the group
5. Add payment options specific to this group

### Overriding at Race Level

1. Go to Race Editor
2. Find "Race Payment" section
3. Click "Edit Race Payments"
4. Add a payment option with the SAME `type` as the series option you want to override
5. Set the race-specific name and amount

## Visual Indicators

### In Race Editor

The race editor shows all payment options with clear indicators:

- **Badge Colors:**
  - Blue "Race" = Race-specific payment option
  - Cyan "Series Group" = From a category group
  - Green "Series Default" = From series default options

- **Override Indicators:**
  - Yellow background = This option is overridden by a race payment option
  - Strikethrough text = Original series value (overridden)
  - ⚠️ Warning icon = Shows override status

### In Registration Form

Users see only the relevant payment options for their selected category, with the correct amounts and names after any overrides are applied.

## Data Model

### Series Document
```javascript
{
  seriesId: "pcrs2025",
  name: "PCRS 2025",
  regCategories: [...],
  
  // NEW: Default payment options
  defaultPaymentOptions: [
    { name: "Early Bird", type: "early_bird", amount: 25 },
    { name: "Regular", type: "regular", amount: 30 }
  ],
  
  // Category groups (optional)
  categoryGroups: [
    {
      name: "High School",
      categories: ["hs_boys", "hs_girls"],
      paymentOptions: [
        { name: "HS Early", type: "early_bird", amount: 15 },
        { name: "HS Regular", type: "regular", amount: 20 }
      ]
    }
  ]
}
```

### Race Document
```javascript
{
  raceid: "race001",
  series: "pcrs2025",
  
  // Race payment options (can override series)
  paymentOptions: [
    { name: "Special Early Bird", type: "early_bird", amount: 20 }
  ]
}
```

## Implementation Details

### Files Modified

1. **API Layer:**
   - `/api/series/index.js` - Added `defaultPaymentOptions` field support
   - `/src/lib/raceProcessing.js` - Includes default options in series data

2. **Admin Components:**
   - `EditSeriesComponent.vue` - UI for managing default payment options
   - `EditRaceComponent.vue` - Shows all options with override indicators

3. **Registration:**
   - `RaceReg.vue` - Implements priority logic for payment option selection

### Key Functions

**`getAvailablePaymentOptionsForCategory(category)` in RaceReg.vue:**
- Determines which payment options to show based on category type
- Applies override logic when race payment types match
- Returns merged options with correct amounts/names

**`allPaymentOptionsWithSource` computed property in EditRaceComponent.vue:**
- Aggregates all payment options from all sources
- Tracks which options are overridden
- Provides visual indicators for admin interface

## Testing Checklist

- [ ] Create series with default payment options
- [ ] Verify series categories use default options
- [ ] Create category group with different payment options
- [ ] Verify group categories use group options
- [ ] Add race payment option with matching type
- [ ] Verify race override shows correct amount/name
- [ ] Test registration form shows correct options per category
- [ ] Verify race editor shows override indicators
- [ ] Test with categories not in any group (should use defaults)
- [ ] Test with race-only categories (should use race options)

## Migration Notes

This is a **non-breaking change**. Existing series and races will continue to work:

- Series without `defaultPaymentOptions` will behave as before
- Existing category groups continue to work unchanged
- Race payment options continue to work as before
- The new hybrid system is opt-in

To adopt the hybrid model:
1. Add `defaultPaymentOptions` to your series
2. Optionally keep or remove category groups based on your needs
3. Use race payment options to override when needed

