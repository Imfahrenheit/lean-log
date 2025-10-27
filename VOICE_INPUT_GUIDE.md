# Voice Input Guide 🎤

This guide shows you how to use voice input effectively for tracking your meals.

## 📋 Quick Start

The voice input works best when you **provide your own macro values** instead of letting the AI guess. The AI is smart, but your food scale is smarter! 📊

---

## ✅ Best Practices

### **1. Single Combined Meal (Recommended for Complex Meals)**

When you eat multiple items together, combine them into ONE entry with your calculated macros:

**✅ GOOD:**
```
"Lunch with 600 calories, 45 grams protein, 60 grams carbs, and 20 grams fat"
```
**Result:** Creates 1 entry named "Lunch" with exact macros you provided

**✅ GOOD:**
```
"Meal 1: 500 calories, 40 protein, 50 carbs, 15 fat"
```
**Result:** Creates 1 entry for "Meal 1" with your values

**✅ GOOD:**
```
"Dinner: salmon rice and broccoli, 700 calories, 50g protein, 70g carbs, 25g fat"
```
**Result:** Creates 1 entry named "Salmon, rice, broccoli" with exact macros

---

### **2. Multiple Separate Items (When You Know Each Item's Macros)**

If you want separate entries for each food item, provide macros for each:

**✅ GOOD:**
```
"50 grams protein from chicken and 200 calories from rice"
```
**Result:** 
- Entry 1: "Chicken" - 50g protein
- Entry 2: "Rice" - 200 calories (AI estimates other macros)

**✅ GOOD:**
```
"2 eggs with 12g protein, 1g carbs, 10g fat, and toast with 6g protein, 30g carbs, 2g fat for breakfast"
```
**Result:**
- Entry 1: "2 Eggs" - exact macros, meal: breakfast
- Entry 2: "Toast" - exact macros, meal: breakfast

---

### **3. Simple Single Items (Let AI Estimate)**

For common foods with known nutritional values, you can let the AI estimate:

**✅ GOOD:**
```
"Had a banana"
```
**Result:** Creates "Banana" with estimated macros (~27g carbs, 1g protein)

**✅ GOOD:**
```
"Protein shake"
```
**Result:** Creates "Protein shake" with typical macros (~25g protein, 5g carbs)

**✅ GOOD:**
```
"200 calorie protein bar"
```
**Result:** Creates "Protein bar" with 200 calories and estimated macros

---

## ⚠️ What to Avoid

### **❌ BAD: Listing Foods Without Macros**
```
"Salmon, rice, and veggies for lunch"
```
**Problem:** AI will create 3 separate entries with GUESSED macros that are likely wrong!

**✅ BETTER:**
```
"Lunch: salmon rice and veggies, 650 calories, 48g protein, 65g carbs, 22g fat"
```

---

### **❌ BAD: Vague Descriptions**
```
"I had some chicken and stuff"
```
**Problem:** Too vague - AI will show 0g for all macros and ask you to edit

**✅ BETTER:**
```
"Chicken meal: 400 calories, 45g protein, 10g carbs, 15g fat"
```

---

## 🎯 Pro Tips

### **Tip 1: Use Meal Names**
Match your custom meal names for automatic categorization:
```
"Meal 1: 500 calories, 40g protein, 50g carbs, 15g fat"
"Pre-workout: protein bar, 200 calories"
"Post-workout: shake, 300 calories, 50g protein"
```

### **Tip 2: Be Specific with Numbers**
```
✅ "45 grams protein" or "45g protein"
✅ "600 calories"
✅ "30 grams carbs and 15 grams fat"
```

### **Tip 3: Edit When Needed**
- If the AI creates the wrong number of entries, use the EDIT button
- Low confidence entries (yellow warning) need your input
- You can combine or split entries in the edit modal

### **Tip 4: Round Numbers Are Fine**
```
"Lunch: 600 calories, 40 protein, 60 carbs, 20 fat"
```
No need to say "40.5 grams" - round numbers work great!

---

## 📊 Real-World Examples

### **Example 1: Post-Workout Meal**
**Voice Input:**
```
"Post-workout meal: chicken and rice, 550 calories, 48 grams protein, 55 grams carbs, 12 grams fat"
```

**Result:**
- ✅ 1 entry: "Chicken and rice"
- ✅ Macros: P:48g, C:55g, F:12g, Cal:550
- ✅ Assigned to "post-workout" meal (if you have one)

---

### **Example 2: Breakfast with Exact Values**
**Voice Input:**
```
"Breakfast: 400 calories, 25g protein, 45g carbs, 12g fat"
```

**Result:**
- ✅ 1 entry: "Breakfast"
- ✅ Exact macros you provided
- ✅ Assigned to "breakfast" meal

---

### **Example 3: Quick Snack**
**Voice Input:**
```
"Snack: protein bar, 200 calories"
```

**Result:**
- ✅ 1 entry: "Protein bar"
- ✅ 200 calories (AI estimates macros: ~20g protein, ~15g carbs, ~8g fat)
- ✅ Assigned to "snack" meal

---

### **Example 4: Multiple Items Separately**
**Voice Input:**
```
"Chicken breast: 40g protein, 5g carbs, 3g fat. Sweet potato: 30g carbs, 2g protein, 0g fat"
```

**Result:**
- ✅ Entry 1: "Chicken breast" - P:40g, C:5g, F:3g
- ✅ Entry 2: "Sweet potato" - P:2g, C:30g, F:0g

---

## 🔑 Key Takeaways

1. **Always provide calories and/or macros** for complex meals
2. **Combine multi-item meals into one entry** with total macros
3. **Use meal names** (breakfast, lunch, meal-1, etc.) for organization
4. **Edit entries** with low confidence (yellow warning)
5. **Simple single items** (banana, protein shake) can rely on AI estimates

---

## 🆘 Troubleshooting

**Q: I got 3 entries when I wanted 1. What happened?**
A: You listed foods without providing combined macros. Either:
- Delete extras and edit the remaining one, OR
- Say it again: "Lunch: salmon rice veggies, 650 cal, 48p, 65c, 22f"

**Q: Why does it show 0g for all macros?**
A: You described a complex meal without numbers. Click EDIT and add your actual values.

**Q: Can I just say food names without macros?**
A: Yes, but only for simple single items (banana, apple, protein shake). For meals with multiple ingredients, always provide macros!

**Q: What if I make a mistake?**
A: The confirm screen has EDIT and DELETE buttons. Fix anything before saving!

---

## 💡 Remember

**Your food scale + your calculations = accurate tracking**
**AI guesses = convenient but not precise**

Use voice input to **save time entering your data**, not to avoid calculating it! 🎯
