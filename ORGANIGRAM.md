# KCVV Organigram Feature

**Status:** ✅ Implemented - Multi-view unified system
**Last Updated:** January 2026

---

## Overview

An interactive organizational chart (organigram) that displays the complete club structure including Hoofdbestuur and Jeugdbestuur. The system offers multiple views to accommodate different user preferences and devices.

### Key Features

- **Multi-view system**: Cards, Chart, and Responsibilities views
- **Unified search**: Search across members and responsibilities
- **Mobile-first**: Responsive design with touch optimizations
- **Accessibility**: Keyboard navigation, screen reader support
- **Deep linking**: Shareable URLs to specific members
- **Integration**: Seamless connection with Responsibility Finder

---

## Table of Contents

1. [Views](#views)
2. [Features](#features)
3. [File Structure](#file-structure)
4. [How to Customize](#how-to-customize)
5. [Configuration Options](#configuration-options)
6. [Navigation](#navigation)
7. [Future Enhancements](#future-enhancements)

---

## Views

### 1. Card Hierarchy View (Default on Mobile)

A collapsible card-based view similar to a file explorer:

- Expand/collapse departments
- Clear visual hierarchy
- Touch-friendly on mobile
- Shows member details on click

### 2. Interactive Chart View (Default on Desktop)

A D3-based visual organizational diagram:

- Zoom and pan controls
- Expand/collapse nodes
- Visual representation of reporting structure
- Fullscreen mode available

### 3. Responsibilities View

Integration with the Responsibility Finder:

- Find the right contact for your question
- Decision tree navigation
- Direct links to organigram members
- Search by topic or keyword

---

## Features

### Implemented

- ✅ Multi-view toggle (Cards / Chart / Responsibilities)
- ✅ Responsive defaults (Mobile → Cards, Desktop → Chart)
- ✅ View preference saved to localStorage
- ✅ Unified search across members and responsibilities
- ✅ Member detail modal with contact info
- ✅ Department filters (Hoofdbestuur/Jeugdbestuur)
- ✅ Deep linking via URL parameters
- ✅ Keyboard navigation (arrow keys, Enter, Escape)
- ✅ Screen reader announcements
- ✅ Skip links for accessibility
- ✅ Swipe gestures on mobile (switch views)
- ✅ Bottom navigation on mobile
- ✅ Lazy loading for performance
- ✅ KCVV branding and colors

### Accessibility Features

- Entire card is clickable (not just tiny buttons)
- Large zoom controls (+/−)
- Keyboard shortcuts (? to show help)
- Focus management
- ARIA labels and live regions
- High contrast support
- Minimum 44x44px touch targets

---

## File Structure

```text
src/
├── app/(main)/club/organigram/
│   └── page.tsx                     # Main organigram page
├── components/organigram/
│   ├── UnifiedOrganigramClient.tsx  # Main client component with view toggle
│   ├── MemberDetailsModal.tsx       # Member detail popup
│   ├── index.ts                     # Component exports
│   ├── card-hierarchy/
│   │   ├── CardHierarchy.tsx        # Card-based view
│   │   ├── HierarchyLevel.tsx       # Recursive level component
│   │   └── ExpandableCard.tsx       # Individual member card
│   ├── chart/
│   │   ├── EnhancedOrgChart.tsx     # D3 chart component
│   │   ├── NodeRenderer.tsx         # Chart node rendering
│   │   ├── ContactOverlay.tsx       # Contact quick actions
│   │   └── MobileNavigationDrawer.tsx
│   └── shared/
│       ├── UnifiedSearchBar.tsx     # Search component
│       ├── ContactCard.tsx          # Reusable contact display
│       ├── DepartmentFilter.tsx     # Filter by department
│       ├── KeyboardShortcuts.tsx    # Keyboard help modal
│       └── types.ts                 # Shared TypeScript types
├── data/
│   └── club-structure.ts            # ⭐ EDIT THIS: Club org data
├── types/
│   └── organigram.ts                # TypeScript interfaces
└── lib/
    └── organigram-utils.ts          # Utility functions
```

---

## How to Customize

### 1. Update Board Member Data

Edit `/src/data/club-structure.ts` and replace placeholder names with real names:

```typescript
{
  id: 'president',
  name: '[Naam Voorzitter]',          // ← Change this
  title: 'Voorzitter',
  positionShort: 'PRES',
  department: 'hoofdbestuur',
  responsibilities: 'Leiding geven...',
  email: 'voorzitter@kcvvelewijt.be', // ← Add real email
  phone: '+32 123 456 789',           // ← Add phone if available
  imageUrl: '/images/staff/john.jpg', // ← Add profile photo
  profileUrl: '/club/organigram',     // ← Deep link to organigram node (optional)
  parentId: 'club',
}
```

### 2. Add New Positions

Add new entries to the `clubStructure` array:

```typescript
{
  id: 'new-position',
  name: 'Jane Smith',
  title: 'New Role Title',
  positionShort: 'NRT',
  department: 'hoofdbestuur', // or 'jeugdbestuur' or 'general'
  responsibilities: 'Description of role...',
  parentId: 'president', // ← Set who this person reports to
}
```

### 3. Add Profile Photos

1. Place profile photos in `/public/images/staff/`
2. Update `imageUrl` in club-structure.ts:
   ```typescript
   imageUrl: "/images/staff/firstname-lastname.jpg";
   ```

### 4. Link to Staff Profiles

Staff profiles are sourced from Sanity. The `organigramNode` document in Sanity links to a `staffMember` document which holds the canonical profile data. Deep links use the organigram page URL with the member's node ID as a query param.

---

## Configuration Options

### Change Colors

Edit `/src/components/organigram/chart/EnhancedOrgChart.tsx`:

```typescript
// Change border/accent colors
border: 2px solid #4acf52;  // ← Your club color

// Change gradient bar
background: linear-gradient(90deg, #4acf52 0%, #41b147 100%);
```

### Adjust Initial View

The view defaults are:

- **Mobile**: Cards view (better for touch)
- **Desktop**: Chart view (better for overview)

Users can switch views and their preference is saved.

### Change Node Size (Chart View)

Edit `/src/components/organigram/chart/EnhancedOrgChart.tsx`:

```typescript
.nodeWidth(() => 280)    // ← Card width in pixels
.nodeHeight(() => 140)   // ← Card height in pixels
```

---

## Navigation

The organigram is accessible via:

- **URL**: `/club/organigram`
- **Navigation**: De club → Organigram
- **Mobile Menu**: De club → Organigram

### URL Parameters

Deep linking is supported:

- `/club/organigram?view=cards` - Open in cards view
- `/club/organigram?view=chart` - Open in chart view
- `/club/organigram?view=responsibilities` - Open responsibilities
- `/club/organigram?member=president` - Open with member selected
- `/club/organigram?view=chart&member=youth-coordinator` - Combined

---

## Current Structure

The club hierarchy (45 positions defined):

```text
KCVV Elewijt
├── Voorzitter (President)
│   ├── Ondervoorzitter (VP)
│   │   ├── Technisch Coördinator
│   │   │   ├── Hoofdtrainer Senioren
│   │   │   │   └── Assistent-trainer
│   │   │   └── Keeperstrainer
│   │   └── Infrastructuurbeheerder
│   │       ├── Terreinbeheerder
│   │       └── Kantinebeheerder
│   ├── Secretaris
│   │   ├── Communicatieverantwoordelijke
│   │   │   ├── Social Media Manager
│   │   │   └── Clubfotograaf
│   │   └── Evenementencoördinator
│   ├── Penningmeester
│   │   └── Verantwoordelijke Sponsoring
│   └── Jeugdcoördinator (Youth)
│       ├── Technisch Verantwoordelijke Jeugd
│       │   ├── Coördinator U6-U9
│       │   │   └── Trainer U8
│       │   ├── Coördinator U10-U12
│       │   │   └── Trainer U10
│       │   ├── Coördinator U13-U15
│       │   │   └── Trainer U13
│       │   └── Coördinator U16-U19
│       ├── Secretaris Jeugdbestuur
│       │   ├── Materiaalverantwoordelijke Jeugd
│       │   └── Vrijwilligerscoördinator Jeugd
│       ├── Penningmeester Jeugdbestuur
│       └── Jeugdevenementencoördinator
```

---

## Deployment Notes

1. ✅ No environment variables needed
2. ✅ All data is statically defined (fast performance)
3. ✅ No external API calls required
4. ✅ Works offline after initial load
5. ✅ Lazy loading for chart component

---

## Future Enhancements

### Option 1: Fetch from Drupal (Dynamic)

If you want to manage the org structure in Drupal CMS instead of the TypeScript file:

1. Create a "Board Member" content type in Drupal
2. Add a DrupalService method to fetch board members
3. Update the page to fetch data server-side
4. Benefits: Non-technical users can update via CMS

### Option 2: Keep Static (Current)

Advantages:

- ✅ Lightning fast (no API calls)
- ✅ Works offline
- ✅ No CMS complexity
- ✅ Version controlled

### Planned Improvements

- Analytics tracking for usage patterns
- A/B testing different default views
- Performance monitoring
- User feedback collection

---

## Testing Checklist

Before going live with real data:

- [ ] Verify all names are correct
- [ ] Check all email addresses work
- [ ] Test all profile photo URLs
- [ ] Confirm Drupal staff profile links
- [ ] Test on mobile device
- [ ] Test on tablet
- [ ] Test search functionality
- [ ] Test view switching
- [ ] Test keyboard navigation
- [ ] Test department filters

---

## Support & Documentation

### For Developers

- Check code comments in each file
- The [d3-org-chart library docs](https://github.com/bumbeishvili/org-chart)
- TypeScript interfaces in `/src/types/organigram.ts`

### Related Documentation

- `RESPONSIBILITY.md` - Responsibility finder integration
- `ACCESSIBILITY_TESTING.md` - Accessibility testing guide

---

**Last Updated:** January 2026
