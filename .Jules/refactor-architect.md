# Refactor Architect's Journal

## 2025-05-15 - Multi-Layer Code Quality Pass
Smell: Large monolithic functions in backend and stats logic; highly repetitive synchronization loops in frontend.
Learning: Centralizing cross-cutting concerns like API authentication and S3 uploads drastically reduces boilerplate and improves maintenance safety. Breaking down complex aggregation logic into focused helpers makes the code read like a story rather than a math problem.
Pattern:
1. Extract routing and specialized calculation logic into standalone helpers in Lambda.
2. Use generic `pushEntity` and `fetchApi` patterns in sync services to handle repetitive CRUD.
3. Decompose state initialization and inner-loop logic in stat calculators to improve readability.
4. Enhance string utilities (`getInitials`) with robust regex-based splitting and filtering.
