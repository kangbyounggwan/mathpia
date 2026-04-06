# Self Review (Gemini/Codex CLIs Not Available)

**Reviewer:** Claude (self-review)
**Generated:** 2026-04-03

---

## Overall Assessment

The plan is comprehensive, well-structured, and actionable. The 8-phase approach with design tokens first is the correct architectural decision. The file change map and testing strategy provide clear implementation guidance.

## Potential Footguns & Edge Cases

### 1. `@expo-google-fonts/noto-sans-kr` Package Compatibility (Phase 1)
- **Risk**: The `@expo-google-fonts/noto-sans-kr` package version `^0.2.3` may not be compatible with Expo SDK 54. The expo-google-fonts ecosystem has had breaking changes between Expo versions.
- **Recommendation**: Prefer the manual `.ttf` download approach (`assets/fonts/`) as it's more reliable and doesn't add a dependency. Download from Google Fonts directly. This eliminates version conflicts entirely.

### 2. `Animated.createAnimatedComponent(PaperCard)` (Phase 2.5)
- **Risk**: The plan acknowledges this may not work but doesn't commit to a default approach.
- **Recommendation**: Start with the `Animated.View` wrapper approach as the primary implementation (simpler, guaranteed to work), not as a fallback. This avoids time spent debugging `createAnimatedComponent` compatibility.

### 3. fontWeight String Literals (Phase 1.3-1.4)
- **Risk**: React Native on Android has historically had issues with string font weights like `'700'` not mapping correctly to the actual font file weight. When using custom fonts, the `fontWeight` property may be ignored.
- **Recommendation**: Instead of `fontWeight: '700'`, rely on the `fontFamily: 'NotoSansKR-Bold'` property alone. Do NOT set `fontWeight` when using custom fonts, or set it to `'normal'` for all variants. The font family name already encodes the weight.

### 4. expo-splash-screen Dependency (Phase 1.2)
- **Risk**: `expo-splash-screen` is listed as a new dependency, but Expo SDK 54 already includes `SplashScreen` functionality. Adding it separately may cause version conflicts.
- **Recommendation**: Check if `expo-splash-screen` is already a transitive dependency via `npx expo install expo-splash-screen` which resolves the correct version. Also note that `SplashScreen.preventAutoHideAsync()` must be called at module scope (outside component), not inside useEffect.

### 5. Typography Token Color Coupling (Phase 1.4)
- **Risk**: The `typography` tokens include `color` properties (e.g., `color: '#212121'`). This makes them inflexible for use on colored backgrounds where text should be white/light. Screens like the hero progress card use white text on colored backgrounds.
- **Recommendation**: Remove `color` from typography tokens. Let each usage site set `color` separately. This prevents `style={[typography.body, { color: '#FFFFFF' }]}` override pattern which is clunky.

### 6. Web Font Loading (Phase 1.2)
- **Risk**: On Expo Web, fonts loaded via `expo-font` are injected as `@font-face` CSS. If the font name doesn't match exactly what's used in `fontFamily`, text may fall back silently to system fonts without any error.
- **Recommendation**: After implementing font loading, add a visual test: render a Korean sentence and verify it uses Noto Sans KR by checking DevTools > Computed Styles > Font Family in the browser.

### 7. Chart Components Props Override (Phases 4-6)
- **Risk**: The plan says charts should "accept chartColors from theme" but the current charts already have color props with defaults. Changing defaults would change the visual appearance even when no explicit color prop is passed.
- **Recommendation**: Only change the default values in the chart components themselves. Do NOT add chartColors as required props. This minimizes changes needed at every usage site.

### 8. Missing MathText Font Update
- **Risk**: `MathText.tsx` renders HTML/CSS inside a WebView/iframe. The Noto Sans KR font loaded in the app will NOT be available inside WebView content. LaTeX math and surrounding text will still use system fonts.
- **Recommendation**: Either (a) embed the Noto Sans KR web font via a CSS `@import` in the KaTeX HTML template, or (b) document this as a known limitation. The font won't apply to math content regardless.

## Performance Considerations

### 9. SkeletonLoader Shared Value Efficiency
- The plan uses a single `useSharedValue` per `SkeletonLoader` instance. If a screen renders 10 skeleton items, that's 10 separate animated values running in parallel.
- **Recommendation**: Consider lifting the shimmer shared value to a context or parent component that provides it to all children. However, since these are just opacity animations, performance should be acceptable.

### 10. Bundle Size Impact
- Adding Noto Sans KR (3 weights) adds ~300-600KB. For a tablet app this is fine.
- No other significant bundle size impacts.

## Unclear or Ambiguous Requirements

### 11. Streak Display (Phase 4.2)
- The plan mentions "Add streak indicator icon beside the streak value" but doesn't specify where the streak data comes from. The current stores may not track streak data.
- **Recommendation**: Clarify if streak data exists in the mock data or if it needs to be computed. If it doesn't exist, defer to a future enhancement.

### 12. "주의 필요 학생" Alert Card (Phase 5.2)
- The plan mentions adding this card to the teacher dashboard but doesn't specify the criteria or data source.
- **Recommendation**: Define the criteria (e.g., completion rate < 50%, or > 3 overdue assignments) and which mock data to query.

### 13. Materials and Profile Screens
- `app/(student)/materials.tsx` and `app/(student)/profile.tsx` are not explicitly listed in the phase changes, but they should receive typography token updates.
- **Recommendation**: Add these to Phase 4 or Phase 7 as "typography token pass" targets.

## Missing Considerations

### 14. Register Screen (app/(auth)/register.tsx)
- Only the login screen is covered in Phase 3. The register screen also has hardcoded typography and would benefit from the same treatment.
- **Recommendation**: Add register.tsx to Phase 3 scope.

### 15. Existing AnalysisSkeleton Migration
- The plan mentions migrating `AnalysisSkeleton.tsx` from RN Animated to reanimated but doesn't provide implementation details.
- **Recommendation**: Either provide the migration code or simply replace it with the new `SkeletonLoader` presets. Since the new `SkeletonLoader` is more flexible, replacing is simpler.

## Security Vulnerabilities
- None identified. This is a UI-only change with no authentication, API, or data modification implications.

## Summary of Recommended Changes

1. Use manual font files instead of `@expo-google-fonts` package
2. Remove `color` from typography tokens
3. Use `Animated.View` wrapper for Card, not `createAnimatedComponent`
4. Remove `fontWeight` when custom font families encode the weight
5. Add register.tsx to Phase 3
6. Add materials.tsx and profile.tsx to Phase 4/7
7. Clarify streak data source
8. Document MathText WebView font limitation
