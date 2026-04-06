# Mathpia UI Enhancement - PRD

## Overview

Comprehensive UI enhancement for Mathpia, a Korean math tutoring tablet application for private academies (hagwon). This plan applies a unified design token system, role-based theming, skeleton loading states, empty states, form validation, responsive layout hooks, accessibility improvements, and error boundaries across all screens.

## How to Use

```bash
ralphy --prd planning-ui/claude-ralphy-prd.md
# Or: cp planning-ui/claude-ralphy-prd.md ./PRD.md && ralphy
```

## Context

- **App**: Mathpia - Korean math tutoring tablet app (React Native / Expo)
- **Tech Stack**: Expo SDK 54, React Native 0.81.5, TypeScript ~5.9.2, react-native-paper MD3, react-native-reanimated v4.2.1, Zustand v5.0.9, expo-router v6
- **Three User Roles**: Teacher (indigo #5C6BC0), Student (blue #4A90D9), Parent (green #66BB6A)
- **Font**: Noto Sans KR (Regular 400, Medium 500, Bold 700)
- **Scope**: UI-only changes - no business logic, API, or database modifications

## Constraints

- All changes are UI-only. Do not modify business logic, API calls, or database schemas.
- TypeScript strict mode must pass: run `npx tsc --noEmit` after each section.
- Use existing mock data and services - do not create new ones.
- All text content is in Korean.
- Minimum touch target size: 44px.
- All icon-only buttons must have Korean `accessibilityLabel`.

## Dependency Note

Sections must be implemented in dependency order:
1. **Section 01** first (no dependencies - foundational design tokens)
2. **Section 02** second (depends on 01 - common components)
3. **Sections 03-08** can be done in parallel (all depend on 01 + 02)

## Tasks

- [ ] Section 01: Design Tokens & Theme System — `planning-ui/sections/section-01-design-tokens.md`
- [ ] Section 02: Common Components — `planning-ui/sections/section-02-common-components.md`
- [ ] Section 03: Auth Screens — `planning-ui/sections/section-03-auth-screens.md`
- [ ] Section 04: Student Screens — `planning-ui/sections/section-04-student-screens.md`
- [ ] Section 05: Teacher Screens — `planning-ui/sections/section-05-teacher-screens.md`
- [ ] Section 06: Parent Screens — `planning-ui/sections/section-06-parent-screens.md`
- [ ] Section 07: Responsive & Accessibility — `planning-ui/sections/section-07-responsive-accessibility.md`
- [ ] Section 08: Error & Empty States — `planning-ui/sections/section-08-error-empty-states.md`
