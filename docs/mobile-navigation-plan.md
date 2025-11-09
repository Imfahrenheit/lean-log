# Mobile Navigation Improvement Plan

## Current Issues Identified

### 1. **Navigation Hidden on Mobile**
- **Problem**: Main navigation bar is completely hidden on mobile (`hidden md:flex`)
- **Impact**: Users cannot access any navigation links on mobile devices
- **Location**: `app/(app)/layout.tsx` line 31

### 2. **Incomplete UserMenu**
- **Problem**: UserMenu dropdown only includes:
  - Profile
  - Meals Settings
  - API Keys
  - Sign out
- **Missing**: Today, Weight, History, Invites (admin)
- **Location**: `components/user-menu.tsx`

### 3. **Admin Features Not Accessible**
- **Problem**: Invites link only visible in desktop nav
- **Impact**: Admins cannot access invite management on mobile
- **Location**: `app/(app)/layout.tsx` line 50-54

### 4. **No Mobile-First Navigation Pattern**
- **Problem**: No hamburger menu, bottom navigation, or mobile drawer
- **Impact**: Poor mobile UX, users must use dropdown menu workaround

## Proposed Solutions

### Option 1: Mobile Drawer Menu (Recommended)
**Pros:**
- Clean, modern mobile UX
- Can show all navigation items
- Easy to organize by sections (Main, Settings, Admin)
- Uses existing Dialog component

**Implementation:**
1. Add hamburger menu button (visible only on mobile)
2. Create mobile navigation drawer component
3. Organize navigation into sections:
   - **Main**: Today, Weight, History, Profile
   - **Settings**: Meals, API Keys
   - **Admin** (if admin): Invites
4. Keep desktop navigation as-is

### Option 2: Bottom Navigation Bar
**Pros:**
- Always visible, thumb-friendly
- Common mobile pattern
- Quick access to main features

**Cons:**
- Limited space (4-5 items max)
- May need to prioritize features
- Less space for admin features

**Implementation:**
1. Create bottom nav bar component
2. Show primary actions: Today, Weight, History, Profile
3. Keep settings/admin in hamburger menu

### Option 3: Enhanced UserMenu Dropdown
**Pros:**
- Minimal changes needed
- Uses existing component

**Cons:**
- Still requires multiple clicks
- Not ideal mobile UX
- Dropdown can be cramped

**Implementation:**
1. Add all navigation items to UserMenu
2. Organize with separators
3. Add icons for better visual hierarchy

## Recommended Implementation: Option 1 + Option 3 Hybrid

### Phase 1: Mobile Drawer Menu
1. Create `MobileNav` component with drawer
2. Add hamburger menu button to header (mobile only)
3. Organize navigation into logical sections
4. Include admin section conditionally

### Phase 2: Enhanced UserMenu
1. Add missing navigation items (Today, Weight, History)
2. Add Invites for admins
3. Better organization with icons and sections
4. Works as fallback/desktop enhancement

### Phase 3: Active Route Highlighting
1. Highlight current route in navigation
2. Visual feedback for active page
3. Better UX overall

## Technical Details

### Components Needed
1. **MobileNav Component** (`components/mobile-nav.tsx`)
   - Uses Dialog component for drawer
   - Hamburger icon from lucide-react
   - Navigation sections with icons
   - Close on navigation

2. **Navigation Items Structure**
```typescript
const mainNav = [
  { href: "/", label: "Today", icon: Calendar },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

const settingsNav = [
  { href: "/settings/meals", label: "Meals", icon: Utensils },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
];

const adminNav = [
  { href: "/settings/invites", label: "Invites", icon: Mail },
];
```

3. **Icons from lucide-react**
   - Calendar, Scale, History, User, Utensils, Key, Mail, Menu, X

### Layout Changes
- Add hamburger button (visible `md:hidden`)
- Keep desktop nav (`hidden md:flex`)
- Add MobileNav component to layout

### UserMenu Enhancements
- Add all navigation items
- Better organization with sections
- Icons for visual clarity
- Admin section conditional

## Implementation Steps

1. ✅ Create MobileNav component
2. ✅ Add hamburger button to header
3. ✅ Update layout to include MobileNav
4. ✅ Enhance UserMenu with all navigation items
5. ✅ Add active route highlighting
6. ✅ Test on mobile devices
7. ✅ Polish animations and transitions

## Success Criteria

- [ ] All navigation items accessible on mobile
- [ ] Admin features accessible on mobile
- [ ] Clean, intuitive mobile UX
- [ ] No regression on desktop
- [ ] Active route clearly indicated
- [ ] Smooth animations and transitions

