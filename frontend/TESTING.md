# Scorebook Testing Standards

## Naming Conventions

- `describe` blocks must match the file or component name: `describe('GameMode', () => {`
- `it` strings must start with a verb in present tense: `it('renders the score board', ...)`
- Never use noun phrases: ❌ `it('the score board')` ✅ `it('displays the score board')`
- Never commit `.only` or `.skip` without a linked issue explaining why

## File Location Rules

- Utils tests: `src/utils/__tests__/myUtil.test.ts`
- Hook tests: `src/hooks/__tests__/useMyHook.test.ts`
- Component tests: co-located at `src/components/MyComponent.test.tsx`
- Page tests: `src/pages/MyPage.test.tsx` OR `src/__tests__/MyPage/` for complex suites

## Import Rules

- Always import `render` and testing utilities from `../test-utils/renderWithProviders`, not from `@testing-library/react` directly
- Always use `mockDb` for database access in tests, never `vi.mock('./db')`
- Always call `mockDb.reset()` in `beforeEach` in any test file that uses `mockDb`

## The 3 Test Types

| Type | Location | Uses DOM? | Uses mockDb? |
|---|---|---|---|
| Pure unit | `utils/__tests__/` | No | No |
| Hook unit | `hooks/__tests__/` | No | Yes |
| Integration | page/component level | Yes | Yes |
