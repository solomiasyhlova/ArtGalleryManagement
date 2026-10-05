# Test Action

1. Read current-feature.md to understand what was implemented
2. Identify server services, middleware, shared schemas and utility functions added/modified for this feature
3. Check if tests already exist for these functions
4. For functions without tests that have testable logic, write unit tests:
   - Create unit tests using Vitest
   - Focus on `shared/src/schemas`, `server/src/services`, `server/src/middleware`, `server/src/utils` and `client/src/lib` (not React components)
   - Mock TypeORM repositories, bcrypt and jsonwebtoken. No real database or network
   - Test happy path and error cases
   - Do not write tests just to write them. Use your best judgement
5. Run `npm test` to verify all tests pass
6. Report test coverage for the new feature code