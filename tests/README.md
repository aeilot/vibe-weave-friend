# Tests

This directory contains integration and unit tests for the application.

## UserSettings Test

The `user-settings.test.ts` file contains integration tests for the UserSettings database operations:

- Create user settings
- Retrieve user settings
- Update user settings
- Verify updates are persisted
- Auto-create settings on update (if not exists)
- Delete user settings

These tests verify the complete CRUD functionality for storing user AI API configuration in the database.

## Running Tests

Currently, these are TypeScript test files that demonstrate the expected behavior. To run them:

```bash
# Using Node.js with ts-node (if installed)
npx ts-node tests/user-settings.test.ts

# Or compile and run
npx tsc tests/user-settings.test.ts --outDir dist/tests
node dist/tests/user-settings.test.js
```

The tests use the localStorage-based database service, so they will work in both browser and Node.js environments (with appropriate localStorage shim).
