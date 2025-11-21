# Testing Guide

This directory contains unit tests, property-based tests, and integration tests for the Emotion-Aware Classroom Analyzer.

## Test Structure

```
tests/
├── unit/                    # Unit tests for specific functions
├── properties/              # Property-based tests using fast-check
├── integration/             # Integration tests for API and database
└── README.md               # This file
```

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Test Database

Create a separate test database to avoid affecting development data:

```bash
# Connect to PostgreSQL
psql postgres

# Create test database
CREATE DATABASE classroom_analyzer_test;
GRANT ALL PRIVILEGES ON DATABASE classroom_analyzer_test TO your_user;
\q
```

### 3. Configure Test Environment

Create a `.env.test` file or set environment variables:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/classroom_analyzer_test
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npx vitest run tests/properties/db-connection.property.test.js
```

## Property-Based Testing

Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) to generate random inputs and verify that properties hold across all inputs.

### Example Property Test

```javascript
const fc = require('fast-check');

it('should maintain correctness property', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 100 }), // Generator for random integers
      async (value) => {
        const result = await someFunction(value);
        // Property: result should always be within bounds
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
        return true;
      }
    ),
    { numRuns: 100 } // Run 100 iterations with random inputs
  );
});
```

### Property Test Tags

Each property test includes a comment tag linking it to the design document:

```javascript
// Feature: classroom-analyzer-enhancement, Property 2: Average attention calculation correctness
// Validates: Requirements 5.1, 6.3, 7.1
```

## Test Database Management

### Reset Test Database

```bash
psql classroom_analyzer_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
```

### Run Migration on Test Database

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/classroom_analyzer_test npm run migrate
```

## Writing Tests

### Unit Tests

Unit tests verify specific examples and edge cases:

```javascript
const { describe, it, expect } = require('vitest');

describe('MyFunction', () => {
  it('should handle empty input', () => {
    const result = myFunction([]);
    expect(result).toBe(0);
  });

  it('should calculate correct value', () => {
    const result = myFunction([1, 2, 3]);
    expect(result).toBe(6);
  });
});
```

### Property-Based Tests

Property tests verify universal properties:

```javascript
const fc = require('fast-check');

it('should maintain property for all inputs', async () => {
  await fc.assert(
    fc.property(
      fc.array(fc.integer()),
      (arr) => {
        const result = myFunction(arr);
        // Property: result should always be non-negative
        return result >= 0;
      }
    ),
    { numRuns: 100 }
  );
});
```

## Troubleshooting

### Database Connection Errors

- Ensure PostgreSQL is running
- Verify DATABASE_URL in environment
- Check that test database exists
- Confirm user has proper permissions

### Test Timeouts

- Increase timeout in vitest.config.js
- Check for hanging database connections
- Ensure proper cleanup in afterAll/afterEach hooks

### Import Errors

- This project uses CommonJS (require/module.exports)
- Ensure all test files use require() not import

## CI/CD Integration

Tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/classroom_analyzer_test
```

## Coverage Goals

- Unit tests: Cover specific examples and edge cases
- Property tests: Verify universal properties hold
- Integration tests: Test end-to-end flows
- Target: 80%+ code coverage for critical paths
