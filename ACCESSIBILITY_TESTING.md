# Accessibility Testing Guide

Complete guide for testing the KCVV Organigram's accessibility features.
Ensures compliance with WCAG 2.1 Level AA standards and usability for all users (ages 6-99).

## Table of Contents

1. [Keyboard Navigation Testing](#keyboard-navigation-testing)
2. [Screen Reader Testing](#screen-reader-testing)
3. [Cross-Device Testing](#cross-device-testing)
4. [Age-Specific Testing](#age-specific-testing)
5. [Automated Testing](#automated-testing)
6. [Testing Checklist](#testing-checklist)

---

## Keyboard Navigation Testing

### Keyboard Shortcuts

Test all keyboard shortcuts work as expected:

| Shortcut | Action                 | Expected Result                                              |
| -------- | ---------------------- | ------------------------------------------------------------ |
| `←`      | Previous view          | Navigate to previous view (Cards ← Chart ← Responsibilities) |
| `→`      | Next view              | Navigate to next view (Cards → Chart → Responsibilities)     |
| `1`      | Go to Cards            | Switch to Cards (Overzicht) view                             |
| `2`      | Go to Chart            | Switch to Diagram view                                       |
| `3`      | Go to Responsibilities | Switch to Hulp view                                          |
| `/`      | Focus search           | Cursor moves to search input field                           |
| `Esc`    | Close modal            | Active modal/overlay closes                                  |
| `?`      | Show shortcuts         | Keyboard shortcuts help modal opens                          |

### Tab Order Testing

1. **Skip Link**:
   - Press `Tab` from page load
   - First focusable element should be "Ga naar hoofdinhoud" skip link
   - Skip link should be visible when focused
   - Pressing `Enter` should jump to main content

2. **Navigation Order**:

   ```text
   Tab Order:
   1. Skip Link
   2. Search Input
   3. View Tabs (Overzicht, Diagram, Hulp)
   4. Active View Content
      - Cards: Expandable cards in hierarchy order
      - Chart: Chart controls, nodes
      - Responsibilities: Decision tree options
   5. Mobile Bottom Navigation (mobile only)
   ```

3. **Focus Indicators**:
   - All focusable elements have visible focus ring
   - Focus ring color: KCVV green (#4acf52)
   - Focus ring width: 2px minimum
   - Focus ring offset: 2px minimum

### Keyboard-Only Navigation Test

Complete the following tasks using only keyboard:

- [ ] Navigate from search to each view using number keys
- [ ] Search for a member using `/` and arrow keys
- [ ] Open member details (in Cards view)
- [ ] Close member details using `Esc`
- [ ] Navigate through all views using arrow keys
- [ ] Open keyboard shortcuts help with `?`
- [ ] Close shortcuts help with `Esc`

---

## Screen Reader Testing

### Screen Reader Compatibility

Test with the following screen readers:

- **macOS**: VoiceOver (Safari)
- **Windows**: NVDA (Firefox) or JAWS (Chrome)
- **iOS**: VoiceOver (Safari)
- **Android**: TalkBack (Chrome)

### Screen Reader Test Cases

#### 1. Page Structure

- [ ] Page title is announced: "Organigram & Hulp | KCVV Elewijt"
- [ ] Main heading is announced: "Clubstructuur & Hulp"
- [ ] Landmarks are properly labeled (navigation, main, etc.)

#### 2. View Switching

- [ ] View change is announced: "Weergave gewijzigd naar [View Name]"
- [ ] Active view indicator is communicated
- [ ] View descriptions are announced

#### 3. Search Functionality

- [ ] Search input label is announced
- [ ] Search results are announced
- [ ] "No results" message is announced
- [ ] Selected result is announced with context

#### 4. Interactive Elements

- [ ] All buttons have descriptive labels
- [ ] Link purposes are clear
- [ ] Modal dialogs have proper titles
- [ ] Form inputs have associated labels

#### 5. Dynamic Content

- [ ] ARIA live regions announce view changes
- [ ] Modal open/close is announced
- [ ] Loading states are announced

### ARIA Attributes Checklist

Verify the following ARIA attributes:

- [ ] `aria-label` or `aria-labelledby` on all interactive regions
- [ ] `aria-current="page"` on active navigation items
- [ ] `aria-modal="true"` on modals
- [ ] `aria-live="polite"` on announcements
- [ ] `aria-hidden="true"` on decorative icons
- [ ] `role="navigation"` on nav elements
- [ ] `role="dialog"` on modals
- [ ] No conflicting roles (e.g., role="tab" inside role="navigation")

---

## Cross-Device Testing

### Mobile Devices (< 1024px)

#### Touch Targets

- [ ] All tap targets are minimum 44x44px
- [ ] Adequate spacing between tap targets (8px minimum)
- [ ] No overlapping interactive elements

#### Bottom Navigation

- [ ] Bottom nav is visible and accessible
- [ ] Active state is clearly indicated
- [ ] Icons are large enough (24x24px)
- [ ] Labels are readable

#### Swipe Gestures

- [ ] Swipe left moves to next view
- [ ] Swipe right moves to previous view
- [ ] Swipe doesn't interfere with vertical scrolling
- [ ] Swipe threshold is comfortable (75px)

#### Safe Area Insets

Test on devices with notches:

- [ ] iPhone 14+ (Dynamic Island)
- [ ] iPhone 12/13 (notch)
- [ ] Android devices with punch-hole cameras

Verify:

- [ ] Content not obscured by notch
- [ ] Bottom navigation respects safe area
- [ ] No content cut off by rounded corners

### Tablet Devices (768px - 1024px)

- [ ] Default view is appropriate
- [ ] Touch targets are adequate
- [ ] Layout uses available space well
- [ ] Both portrait and landscape orientations work

### Desktop (> 1024px)

- [ ] Keyboard shortcuts work
- [ ] Mouse hover states are clear
- [ ] FilterTabs show instead of bottom nav
- [ ] Focus indicators are visible
- [ ] Adequate click targets

---

## Age-Specific Testing

### Young Users (Ages 6-12)

**Language Simplicity**:

- [ ] Simple, clear language (no jargon)
- [ ] Short sentences
- [ ] Visual cues (icons + text)

**Interaction**:

- [ ] Large, obvious buttons
- [ ] Immediate feedback on actions
- [ ] Forgiving search (typo-tolerant)
- [ ] Can complete tasks without adult help

**Visual Design**:

- [ ] High contrast colors
- [ ] Distinct visual hierarchy
- [ ] Clear active states
- [ ] No small text (<14px)

**Test Tasks** (observe child completing):

1. Find a specific person in the chart
2. Search for someone by name
3. Navigate between different views
4. Find who to contact about joining the club

### Older Users (Ages 60+)

**Text Readability**:

- [ ] Minimum font size: 16px body text
- [ ] High contrast ratios (4.5:1 minimum)
- [ ] Respects browser zoom (up to 200%)
- [ ] Line height adequate (1.5 minimum)

**Interaction**:

- [ ] No time limits on interactions
- [ ] Clear, immediate feedback
- [ ] Undo/back functionality available
- [ ] No reliance on color alone

**Navigation**:

- [ ] Consistent navigation patterns
- [ ] Clear page titles and headings
- [ ] Breadcrumbs or location indicators
- [ ] Help always accessible (? key)

**Test Tasks** (observe senior completing):

1. Use keyboard shortcuts to navigate
2. Zoom page to 150% and use all features
3. Find contact information for a board member
4. Use the responsibility finder

---

## Automated Testing

### Tools

1. **axe DevTools** (Browser Extension)

   ```bash
   # Install Chrome/Firefox extension
   # Run automated scan on /club/organigram
   # Fix all critical and serious issues
   ```

2. **Lighthouse** (Chrome DevTools)

   ```bash
   # Run Lighthouse audit
   # Target: Accessibility score > 95
   # Check: Performance, Best Practices, SEO
   ```

3. **WAVE** (Web Accessibility Evaluation Tool)
   ```bash
   # Install browser extension
   # Scan organigram page
   # Verify no errors, minimal alerts
   ```

### Automated Test Commands

```bash
# Type checking
npm run type-check

# ESLint (accessibility rules)
npm run lint

# Unit tests (including a11y tests)
npm run test

# Build (catches accessibility JSX issues)
npm run build
```

### Jest/Vitest Accessibility Tests

Example test cases:

```typescript
describe('Organigram Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<UnifiedOrganigramClient />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('skip link is first focusable element', () => {
    render(<UnifiedOrganigramClient />);
    const skipLink = document.querySelector('a[href="#organigram-main-content"]');
    userEvent.tab();
    expect(skipLink).toHaveFocus();
  });

  it('announces view changes', () => {
    render(<UnifiedOrganigramClient />);
    const announcer = screen.getByRole('status');
    // Change view
    expect(announcer).toHaveTextContent('Weergave gewijzigd naar');
  });
});
```

---

## Testing Checklist

### Pre-Launch Checklist

#### WCAG 2.1 Level AA Compliance

- [ ] **Perceivable**
  - [ ] Text alternatives for images
  - [ ] Color not sole means of conveying info
  - [ ] Minimum contrast ratio 4.5:1
  - [ ] Text can be resized to 200%

- [ ] **Operable**
  - [ ] All functionality available via keyboard
  - [ ] No keyboard traps
  - [ ] Skip navigation links present
  - [ ] Page title describes purpose

- [ ] **Understandable**
  - [ ] Language of page is specified
  - [ ] Navigation is consistent
  - [ ] Input assistance for forms
  - [ ] Error messages are clear

- [ ] **Robust**
  - [ ] Valid HTML
  - [ ] ARIA used correctly
  - [ ] Compatible with assistive technologies

#### Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

#### Device Testing

- [ ] iPhone SE (small mobile)
- [ ] iPhone 14 Pro (notch + Dynamic Island)
- [ ] iPad (tablet)
- [ ] Desktop (1920x1080)
- [ ] Desktop (ultra-wide)

#### Performance Benchmarks

- [ ] Lighthouse Accessibility score > 95
- [ ] No axe violations
- [ ] Keyboard navigation smooth (no lag)
- [ ] Screen reader performance acceptable

---

## Reporting Issues

When reporting accessibility issues, include:

1. **Issue Type**: Keyboard, Screen Reader, Visual, etc.
2. **Severity**: Critical, High, Medium, Low
3. **WCAG Criterion**: e.g., 2.1.1 Keyboard
4. **User Impact**: Who is affected
5. **Steps to Reproduce**
6. **Expected vs Actual Behavior**
7. **Screenshot/Video** (if applicable)
8. **Environment**: Browser, OS, Assistive Tech

### Issue Template

```markdown
## Accessibility Issue: [Brief Description]

**Type**: [Keyboard/Screen Reader/Visual/Touch/Other]
**Severity**: [Critical/High/Medium/Low]
**WCAG Criterion**: [e.g., 2.1.1 Keyboard]

### User Impact

[Who is affected and how]

### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior

[What should happen]

### Actual Behavior

[What currently happens]

### Environment

- Browser: [Chrome 120]
- OS: [macOS 14]
- Assistive Tech: [VoiceOver, NVDA, etc.]
- Screen Size: [Mobile/Tablet/Desktop]

### Screenshots/Video

[Attach if applicable]
```

---

## Resources

### Official Guidelines

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [NVDA](https://www.nvaccess.org/) (Windows screen reader)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (macOS/iOS)

### Color Contrast Checkers

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

---

_Last Updated: 2026-01-13 (Phase 5)_
_Part of Issue #467: Unified Organigram & Responsibility Finder System_
