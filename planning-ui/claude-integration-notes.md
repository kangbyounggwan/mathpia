# Integration Notes - Self-Review Feedback

## Suggestions INTEGRATED

### 1. Manual font files instead of @expo-google-fonts package
**Why**: Eliminates version conflict risk with Expo SDK 54. Simpler, more reliable.
**Action**: Update Phase 1.1 to use `assets/fonts/*.ttf` approach as primary method. Remove @expo-google-fonts dependency.

### 2. Remove `color` from typography tokens
**Why**: Colors coupled into typography tokens are inflexible for colored backgrounds (hero cards, progress cards use white text).
**Action**: Remove all `color` properties from `typography` object. Each usage site sets color independently.

### 3. Use Animated.View wrapper for Card instead of createAnimatedComponent
**Why**: More reliable, simpler, guaranteed compatibility.
**Action**: Update Phase 2.5 Card implementation to use `Animated.View` wrapper.

### 4. Remove explicit fontWeight when custom font family encodes weight
**Why**: Android may ignore string fontWeight with custom fonts. Font family name is sufficient.
**Action**: Update fontConfig to not use fontWeight, rely on fontFamily alone. Keep fontWeight only for fallback.

### 5. Add register.tsx to Phase 3
**Why**: Registration screen has the same hardcoded typography issues as login.
**Action**: Add register.tsx typography + validation updates to Phase 3 scope.

### 6. Add materials.tsx and profile.tsx to Phase 4
**Why**: These student screens also need typography token migration.
**Action**: Add both screens to Phase 4 as typography-only updates.

### 7. Document MathText WebView font limitation
**Why**: Noto Sans KR won't load inside WebView/iframe. This is a known limitation.
**Action**: Add note to plan. Optionally add CSS @import for web font in MathText HTML template.

### 8. Replace AnalysisSkeleton with new SkeletonLoader
**Why**: Simpler than migrating old Animated API code. New SkeletonLoader is more flexible.
**Action**: Replace AnalysisSkeleton.tsx contents with SkeletonLoader-based presets.

## Suggestions NOT INTEGRATED

### 9. SkeletonLoader shared value context lifting
**Why NOT**: Over-engineering for the current scope. Simple opacity pulse with 10 instances is performant. The plan's existing approach (per-instance shared value) is efficient enough.

### 10. Streak data source clarification
**Why NOT**: The streak is already displayed in the current student dashboard using mock submission data. No new data source needed.

### 11. "주의 필요 학생" criteria definition
**Why NOT**: This is a UI-only detail that the implementer can decide. Suggesting criteria (completion < 50%) is sufficient guidance. No need to over-specify.
