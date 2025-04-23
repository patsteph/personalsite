# Personal Website V2 Refactoring Plan

This document outlines the comprehensive refactoring plan for the personal website project to improve code quality, maintainability, and extensibility. Each task includes a checkbox for tracking progress.

## High Priority Tasks

### Authentication & Authorization
- [x] **Standardize Auth Flow**
  - [x] Consolidate authentication logic in `lib/auth.tsx`
  - [x] Separate Firebase SDK calls from custom business logic
  - [x] Implement proper error handling for auth state changes
  - [x] Fix race conditions in auth state management

- [x] **Refactor Middleware**
  - [x] Remove excessive logging, implement conditional debugging
  - [x] Simplify route protection logic
  - [x] Improve cookie validation
  - [x] Add proper TypeScript typing to middleware

- [x] **Cookie Handling**
  - [x] Standardize on js-cookie library throughout the application
  - [x] Remove direct document.cookie manipulation
  - [x] Implement consistent cookie settings (path, expiry, security)
  - [x] Add proper error handling for cookie operations

### Data Access Layer
- [x] **Create a Consistent API Pattern**
  - [x] Implement a unified service layer for Firebase interactions
  - [x] Create type-safe API client functions
  - [x] Standardize error handling across all data operations
  - [x] Implement proper null-checking and undefined handling

- [x] **Convert API Endpoints**
  - [x] Ensure all server-side endpoints use Firebase Admin SDK
  - [x] Remove client SDK usage from API routes
  - [x] Implement consistent response format across all endpoints
  - [x] Add proper validation for all API inputs

- [ ] **Field Name Standardization**
  - [ ] Fix genres vs. categories inconsistency in books collection
  - [ ] Audit all collections for field naming inconsistencies
  - [ ] Update queries to use consistent field names
  - [ ] Document data model for each collection

## Medium Priority Tasks

### Component Architecture
- [x] **Separate Concerns**
  - [x] Split complex components into presentational and container components
  - [x] Extract business logic from UI components
  - [x] Implement proper prop drilling or context usage
  - [x] Remove inline styles and standardize on Tailwind classes

- [x] **Custom Hooks**
  - [x] Create reusable hooks for common state management patterns
  - [x] Extract Firebase interaction logic into custom hooks
  - [x] Implement hooks for form handling and validation
  - [x] Add proper TypeScript typing to all custom hooks

- [x] **Unified Error Handling**
  - [x] Implement error boundaries for critical UI sections
  - [x] Create consistent error display components
  - [x] Add error logging and reporting
  - [x] Improve user feedback for error states

### Technical Debt
- [x] **Remove `to_archive` Directory**
  - [x] Evaluate archived code for useful patterns
  - [x] Properly integrate or remove legacy code
  - [x] Document decisions for future reference
  - [x] Remove unnecessary backup files (directory not found in codebase)

- [x] **Code Duplication**
  - [x] Identify and refactor repeated patterns
  - [x] Create reusable utility functions
  - [x] Standardize common operations (fetching, error handling)
  - [x] Implement proper inheritance or composition for similar components

- [x] **Consolidate Configuration**
  - [x] Simplify configuration generation scripts
  - [x] Standardize environment variable handling
  - [x] Create clear documentation for configuration options
  - [x] Implement validation for configuration values

## Low Priority Tasks

### Performance Optimization
- [x] **Implement Memoization**
  - [x] Use React.memo for expensive component renders
  - [x] Apply useMemo and useCallback consistently
  - [x] Optimize re-render patterns
  - [x] Add performance monitoring

- [x] **Optimize Data Fetching**
  - [x] Implement React Query for data fetching and caching
  - [x] Add proper loading states and skeletons
  - [x] Implement infinite scrolling with intersection observer
  - [x] Optimize query patterns for Firestore

- [x] **Reduce Bundle Size**
  - [x] Implement code splitting for larger components
  - [x] Create dynamic import utility for lazy loading
  - [x] Add optimized loading states for code-split components
  - [x] Use Next.js built-in image optimization

### Developer Experience
- [x] **Improve Documentation**
  - [x] Add JSDoc comments to critical functions
  - [x] Set up JSDoc configuration
  - [x] Document data flow and state management
  - [x] Add inline code comments for complex logic

- [x] **Standardize Logging**
  - [x] Replace console.log with structured logging
  - [x] Implement log levels (debug, info, warn, error)
  - [x] Add context to log messages
  - [x] Create production-safe logging configuration

- [x] **Enhance Testing**
  - [x] Set up testing framework (Jest, React Testing Library)
  - [x] Implement unit tests for critical functions
  - [ ] Add integration tests for key user flows (future enhancement)
  - [ ] Implement CI/CD pipeline with test runs (future enhancement)

## Task Tracking

### Completed Tasks
- **High Priority**: Standardized Auth Flow in lib/auth.tsx (2025-04-23)
  - Implemented consistent cookie handling with js-cookie
  - Added conditional debugging
  - Fixed dependency arrays in hooks

- **Medium Priority**: Component Architecture and Technical Debt (2025-04-23)
  - Created custom hooks for data fetching (useBooks, useSignals, useAuth)
  - Implemented unified error handling with error-handler.ts
  - Refactored components to separate UI from data logic
  - Created container components with proper prop handling
  - Removed technical debt (to_archive directory was already gone)
  - Standardized error handling and data operations across the codebase
  
- **Low Priority**: Performance Optimization (2025-04-23)
  - Implemented React Query for efficient data fetching and caching
  - Added proper loading states and skeleton UI components
  - Created custom hooks to separate UI from data logic
  - Added memoization with React.memo, useMemo, and useCallback
  - Improved infinite scrolling with react-intersection-observer
  - Optimized Firestore query patterns
  - Applied code splitting with dynamic imports
  - Created dynamic import utility for lazy loading
  - Implemented structured logging with log levels
  - Set up testing framework with Jest and React Testing Library
  - Created unit tests for error handling and data fetching hooks
  - Set up JSDoc configuration for documentation
  - Added proper JSDoc comments
  - Extracted cookie management into helper functions
- **High Priority**: Refactored Middleware (2025-04-23)
  - Converted from JavaScript to TypeScript
  - Implemented conditional debugging with a debugLog helper
  - Added error handling
  - Standardized cookie name using a constant
  - Improved code organization with JSDoc comments
- **High Priority**: Standardized Cookie Handling (2025-04-23)
  - Created centralized cookie utility in lib/utils/cookies.ts
  - Implemented client-side and server-side cookie helpers
  - Fixed lint errors with correct type imports
  - Used shared constants for cookie names
  - Applied consistent error handling for all cookie operations
- **High Priority**: Created Consistent API Pattern (2025-04-23)
  - Implemented api-service.ts utility with standardized functions
  - Created type-safe API client functions (apiGet, apiPost, etc.)
  - Standardized error handling for all API operations
  - Refactored books.ts to use the new API service
  - Added proper JSDoc comments and return type annotations
- **High Priority**: Converted API Endpoints (2025-04-23)
  - Updated feedback.ts to use Firebase Admin SDK instead of client SDK
  - Refactored public-books.ts to use Admin SDK with proper error handling
  - Implemented standard response format across endpoints
  - Added input validation to prevent errors
  - Fixed syntax errors and improved type safety

### In Progress
- **High Priority**: Field Name Standardization

### Blockers
- None yet

## Implementation Notes

This section will be used to document important decisions, design patterns, and architectural changes made during the refactoring process.

### Auth Flow
We've standardized the authentication flow with these key changes:

1. **Configuration Constants**: Added constants for cookie name, expiry, and redirect delay for easier maintenance.
2. **Conditional Debugging**: Added a DEBUG_AUTH flag that only enables debug logs in development mode.
3. **Cookie Management**: Created dedicated helper functions (setAuthCookie, removeAuthCookie) to ensure consistent cookie handling.
4. **Clean Component Structure**: Added JSDoc comments and improved function organization.
5. **Race Condition Fixes**: Simplified the auth state management to prevent potential race conditions.
6. **Clean Dependency Arrays**: Fixed useCallback dependency arrays to include all necessary dependencies.

### Data Access Pattern
We've standardized the data access pattern with these key changes:

1. **Centralized API Service**: Created a unified API service layer in `lib/utils/api-service.ts` with standardized functions for making HTTP requests.
2. **Type-safe API Functions**: Implemented generic type-safe functions like `apiGet<T>`, `apiPost<T, D>`, etc., that handle common API operations.
3. **Consistent Error Handling**: Standardized error responses with a common `ApiResponse<T>` interface and proper error transformation.
4. **Authentication Management**: Centralized authentication token management for API requests.
5. **Enhanced Documentation**: Added comprehensive JSDoc comments to all API functions.

This pattern serves as a template for refactoring the remaining API modules. Each module can now focus on its specific domain logic while delegating common concerns like authentication, error handling, and request formatting to the centralized service.

### Component Architecture
*TBD*

## Risk Assessment

For each major change, we'll document:
1. The current implementation
2. The proposed change
3. Expected benefits
4. Potential risks
5. Mitigation strategies
6. Fallback plan

This will help ensure we make informed decisions about larger architectural changes.
