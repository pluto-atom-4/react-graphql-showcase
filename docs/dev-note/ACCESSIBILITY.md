# WCAG 2.1 Level AA Accessibility Documentation

This document describes the accessibility features and compliance measures implemented in the React GraphQL Showcase application to meet WCAG 2.1 Level AA standards.

## Overview

This application is designed to be fully accessible to users with disabilities, including those using:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation without a mouse
- High contrast modes
- Voice control systems
- Assistive technologies

## WCAG 2.1 Level AA Compliance

All components in this application have been audited and enhanced to meet WCAG 2.1 Level AA standards. This includes:

- **Perceivable**: Information is presented in ways users can perceive
- **Operable**: Users can navigate and interact with all components
- **Understandable**: Content and interactions are clear and predictable
- **Robust**: Content works with assistive technologies

### Compliance Checklist

✅ **1. Sufficient Color Contrast (Level AA)**
- All text meets 4.5:1 contrast ratio for normal text
- All interactive elements have clear visual indicators
- Status indicators use multiple cues (color + icon/text)

✅ **2. ARIA Labels & Roles**
- All buttons have descriptive `aria-label` attributes
- Modal uses `role="dialog"` with `aria-labelledby`
- Interactive rows have `role="button"` and `tabindex="0"`
- Status content has `role="status"` with appropriate `aria-live` attributes

✅ **3. Keyboard Navigation**
- All interactive elements are accessible via keyboard
- Tab order follows logical visual flow
- Escape key closes modals and dialogs
- Focus trap prevents focus loss from modal dialogs

✅ **4. Focus Indicators**
- All interactive elements have visible focus rings
- Focus rings use `focus:ring-2 focus:ring-blue-500` pattern
- Focus indicators meet 3:1 contrast ratio with surrounding color

✅ **5. Semantic HTML**
- Table headers use `<th scope="col">` for proper header association
- Form fields are properly labeled (where applicable)
- Headings follow hierarchical structure
- Lists use semantic `<ul>` and `<ol>` elements

✅ **6. Status Messages & Alerts**
- Loading indicators have `role="status"` with `aria-live="polite"`
- Error messages have `role="alert"` with `aria-live="assertive"`
- Real-time updates are announced to screen readers

✅ **7. Forms & Input**
- All form inputs are properly labeled
- Error messages are linked to inputs
- Form validation provides clear guidance

✅ **8. Link & Button Text**
- All buttons have descriptive text or `aria-label`
- Links have clear, meaningful text
- "Click here" links are avoided

✅ **9. Images & Alternative Text**
- Images have appropriate alt text
- Icons use `aria-label` or are hidden from screen readers

✅ **10. Multimedia**
- Video players have caption tracks
- Audio descriptions are provided where needed

✅ **11. Language**
- Language is clear and simple
- Abbreviations are expanded
- Complex concepts are explained

✅ **12. Navigation & Orientation**
- Consistent navigation structure
- Multiple ways to find content
- Current page/section is indicated
- Breadcrumbs or path information provided

## Components Enhanced

### BuildDetailModal
- ✅ Modal container: `role="dialog"` + `aria-modal="true"`
- ✅ Modal title: `aria-labelledby` for screen reader announcement
- ✅ Close button: `aria-label="Close dialog"`
- ✅ Status buttons: `aria-label` for each action (e.g., "Mark as complete")
- ✅ Add Part button: `aria-label="Add part to build"`
- ✅ Submit Test Run button: `aria-label="Submit test run results"`
- ✅ Table headers: `scope="col"` for proper column association
- ✅ Status badge: `role="status"` for live region updates
- ✅ Polling indicator: `role="status"` + `aria-live="polite"`
- ✅ Error display: `role="alert"` + `aria-live="assertive"`
- ✅ Focus trap: Tab focus wraps within modal
- ✅ Escape key: Closes modal when pressed
- ✅ First element focus: Automatically focuses first interactive element

### BuildDashboard
- ✅ Create Build button: `aria-label="Create new build"`
- ✅ View Details button: `aria-label="View build details"`
- ✅ Focus restoration: Returns focus to trigger button when modal closes
- ✅ Table headers: `scope="col"` for accessibility

### Pagination
- ✅ Previous/Next buttons: Focus rings added for keyboard navigation
- ✅ Page size selector: Accessible keyboard navigation
- ✅ Focus indicators: Clear visual feedback

## Keyboard Navigation Guide

### Global Shortcuts
| Action | Keyboard |
|--------|----------|
| Navigate between elements | `Tab` / `Shift+Tab` |
| Activate button/link | `Enter` or `Space` |
| Close dialog | `Escape` |
| Navigate menu items (if applicable) | `Arrow Keys` |

### Modal Dialog Navigation
| Action | Keyboard |
|--------|----------|
| Move to next element | `Tab` |
| Move to previous element | `Shift+Tab` |
| Activate button | `Enter` or `Space` |
| Close modal | `Escape` |

When a modal is open, Tab focus is trapped within the modal. Pressing Tab on the last element returns to the first element. Pressing Shift+Tab on the first element moves to the last element.

### Table Navigation
| Action | Keyboard |
|--------|----------|
| Move to next row | `Tab` (if rows are focusable) |
| Activate row action | `Enter` or `Space` (on row) |
| Move to next cell | `Tab` (within row) |

## Testing Accessibility

### Manual Testing with Keyboard
1. Navigate the application using **only the keyboard** (no mouse)
2. All interactive elements should be reachable
3. Tab order should follow visual flow
4. Focus indicators should be clearly visible
5. Escape key should close any open dialogs

### Screen Reader Testing
1. Use a screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through the application
3. Verify announcements:
   - Button purpose is clear (via `aria-label`)
   - Form fields are properly labeled
   - Status changes are announced
   - Error messages are read
   - Modal title is announced when opened

### Automated Testing with axe DevTools
1. Open browser DevTools
2. Install axe DevTools extension (https://www.deque.com/axe/devtools/)
3. Run scan on each page
4. Expected: 0 violations at Level AA

### Lighthouse Audit
1. Open Chrome DevTools → Lighthouse
2. Run "Accessibility" audit
3. Expected score: ≥ 90

### WAVE Browser Extension
1. Install WAVE extension (https://wave.webaim.org/extension/)
2. Activate on each page
3. Expected: 0 errors

## Implementation Patterns

### ARIA Labeling
All buttons have descriptive labels:
```tsx
<button aria-label="Close dialog">×</button>
<button aria-label="Mark as complete">Complete</button>
```

### Focus Management
Modal traps focus and restores it when closed:
```tsx
const [previousActiveElement, setPreviousActiveElement] = useState<HTMLElement | null>(null);

useEffect(() => {
  setPreviousActiveElement(document.activeElement as HTMLElement);
  return () => {
    previousActiveElement?.focus();
  };
}, [previousActiveElement]);
```

### Focus Rings
All interactive elements have visible focus indicators:
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
  Action
</button>
```

### Keyboard Event Handling
Modal closes on Escape key:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

## Resources & Standards

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - W3C Web Content Accessibility Guidelines
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - How to use ARIA roles, properties, and states
- [axe DevTools](https://www.deque.com/axe/devtools/) - Automated accessibility testing
- [WAVE Browser Extension](https://wave.webaim.org/extension/) - Visual accessibility feedback
- [WebAIM](https://webaim.org/) - Web Accessibility In Mind - Educational resource
- [A11y Project](https://www.a11yproject.com/) - Community-driven accessibility resource

## Reporting Accessibility Issues

If you discover an accessibility issue:

1. **Test with multiple tools**:
   - Keyboard navigation (Tab/Shift+Tab, Escape)
   - Screen reader (NVDA, JAWS, or VoiceOver)
   - axe DevTools
   - Lighthouse

2. **Document the issue**:
   - Component affected
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS/assistive technology used

3. **Create an issue** with:
   - Component name
   - Accessibility standard violated (WCAG criterion)
   - Screenshots or video
   - Suggested fix (if applicable)

## Maintenance & Future Work

### Regular Audits
- Run axe DevTools scan monthly
- Review Lighthouse accessibility scores
- Test with screen readers quarterly
- Manual keyboard navigation testing with each release

### Continuous Improvement
- Address any newly reported accessibility issues within 48 hours
- Stay updated with WCAG standards and best practices
- Review and update patterns as React/TypeScript versions evolve
- Add accessibility tests to CI/CD pipeline

### Component Guidelines for Contributors
When adding new components:
1. Include ARIA labels on all interactive elements
2. Add focus rings via Tailwind utility classes
3. Support keyboard navigation (Tab, Enter, Escape)
4. Test with at least one screen reader
5. Run axe DevTools scan
6. Add accessibility tests to test suite

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 2026 | Initial WCAG 2.1 Level AA compliance implementation |

---

**Status**: ✅ WCAG 2.1 Level AA Compliant  
**Last Audited**: April 2026  
**Next Review**: May 2026
