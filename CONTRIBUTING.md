# Contributing to Pier88

Thank you for your interest in contributing to Pier88, a client management system for solo practitioners. This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Requirements](#testing-requirements)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Review Process](#review-process)
- [Getting Help](#getting-help)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher and npm
- **Python** 3.11 or higher
- **Git** for version control
- A code editor (VS Code recommended)

### First-Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/therapy-app.git
   cd therapy-app
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/therapy-app.git
   ```
4. **Follow the development setup** instructions below

## Development Setup

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your Clerk credentials:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_key_here
   VITE_API_URL=http://localhost:8000/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # For testing and development tools
   ```

4. Create environment file with your Clerk credentials:
   ```bash
   # Create .env file
   echo "CLERK_FRONTEND_API=your-clerk-frontend-api" > .env
   echo "CLERK_SECRET_KEY=your-clerk-secret-key" >> .env
   ```

5. Run the FastAPI server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Verify Installation

Run the test suites to verify everything is set up correctly:

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest
```

## Project Structure

```
therapy-app/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Page-level components
│   │   ├── components/         # Reusable UI components
│   │   ├── config/             # Configuration files
│   │   ├── types/              # Type definitions
│   │   ├── assets/             # Static assets
│   │   ├── App.jsx             # Root application routes
│   │   └── main.jsx            # React entry point
│   ├── public/                 # Static files
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite configuration
│   └── vitest.config.js        # Test configuration
│
├── backend/                     # FastAPI backend
│   ├── main.py                 # FastAPI app and routes
│   ├── models.py               # Pydantic data models
│   ├── database.py             # SQLite database setup
│   ├── auth.py                 # Authentication logic
│   ├── intake_routes.py        # Intake form endpoints
│   ├── communication_routes.py # Messaging endpoints
│   ├── tests/                  # Backend tests
│   ├── requirements.txt        # Production dependencies
│   ├── requirements-dev.txt    # Development dependencies
│   └── pytest.ini              # Pytest configuration
│
├── .github/                     # GitHub configuration
│   ├── workflows/              # CI/CD workflows
│   └── ISSUE_TEMPLATE/         # Issue templates
│
├── CONTRIBUTING.md             # This file
├── CODE_OF_CONDUCT.md          # Code of conduct
├── DEVELOPMENT_LOG.md          # Detailed development history
└── README.md                   # Project overview
```

For detailed architecture information, see [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md).

## Development Workflow

### Branch Strategy

- **`main`** - Production-ready code, protected branch
- **Feature branches** - Use descriptive names:
  - `feature/user-authentication`
  - `feature/session-notes-ui`
- **Bug fixes** - Prefix with `fix/`:
  - `fix/client-list-pagination`
  - `fix/timezone-handling`
- **Documentation** - Prefix with `docs/`:
  - `docs/api-endpoints`
  - `docs/setup-instructions`

### Making Changes

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following our code style guidelines

4. **Write or update tests** for your changes (required)

5. **Run tests locally** to ensure everything passes:
   ```bash
   # Frontend
   cd frontend
   npm test
   npm run lint
   npm run format:check

   # Backend
   cd backend
   pytest
   make lint
   ```

6. **Commit your changes** with a descriptive message (see Commit Guidelines below)

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a pull request** on GitHub

### Keeping Your Branch Updated

If your PR is open for a while, keep it updated with the main branch:

```bash
git fetch upstream
git rebase upstream/main
git push origin feature/your-feature-name --force-with-lease
```

## Testing Requirements

We maintain high test coverage to ensure code quality and prevent regressions.

### Frontend Testing

**Framework**: Vitest with React Testing Library

**Requirements**:
- Unit tests for utilities and custom hooks
- Component tests for UI components with complex logic
- Integration tests for critical user flows (authentication, client management, session tracking)
- Minimum coverage: **70%** (lines, functions, branches, statements)

**Running Tests**:
```bash
cd frontend

# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

**Test File Naming**:
- Place test files next to the file being tested
- Use `.test.js` or `.test.jsx` extension
- Example: `Dashboard.jsx` → `Dashboard.test.jsx`

**Example Test**:
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Backend Testing

**Framework**: pytest with FastAPI TestClient

**Requirements**:
- Unit tests for all API endpoints
- Integration tests for database operations
- Authentication and authorization tests
- Minimum coverage: **75%** (lines, functions, branches, statements)

**Running Tests**:
```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_clients.py

# Run with coverage
pytest --cov

# Run tests with specific marker
pytest -m unit
pytest -m integration
```

**Test File Naming**:
- Place tests in `backend/tests/` directory
- Use `test_*.py` naming convention
- Example: `test_clients.py`, `test_auth.py`

**Example Test**:
```python
import pytest

def test_get_clients(client, auth_headers):
    """Test fetching clients list"""
    response = client.get('/api/clients', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

### Test Markers

Backend tests can be marked with categories:
- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (database, external services)
- `@pytest.mark.auth` - Authentication-related tests
- `@pytest.mark.slow` - Slow-running tests

## Code Style Guidelines

### Frontend (JavaScript/React)

**Formatting**:
- Automatically enforced by Prettier
- Semi-colons: Not required
- Quotes: Single quotes for strings
- Tab width: 2 spaces
- Print width: 100 characters

**Linting**:
- ESLint configuration enforced
- React Hooks rules enforced
- No unused variables (except React component props starting with underscore)

**Best Practices**:
- Use functional components with hooks (no class components)
- Destructure props in function parameters
- Use meaningful variable and function names
- Extract complex logic into custom hooks
- Keep components small and focused
- Use CSS modules or co-located CSS files
- Avoid inline styles unless necessary for dynamic values

**File Naming**:
- Components: PascalCase (e.g., `Dashboard.jsx`, `ClientCard.jsx`)
- Utilities: camelCase (e.g., `formatDate.js`, `apiClient.js`)
- Stylesheets: Match component name (e.g., `Dashboard.css`)

**Code Formatting**:
```bash
# Format all files
npm run format

# Check formatting without modifying
npm run format:check

# Lint and auto-fix
npm run lint
```

### Backend (Python)

**Formatting**:
- Automatically enforced by Black
- Line length: 100 characters
- Python version target: 3.11

**Linting**:
- Ruff for linting (PEP 8 compliance)
- Type hints encouraged but not required
- Docstrings required for public functions

**Best Practices**:
- Follow PEP 8 naming conventions
- Use type hints for function parameters and return values
- Write descriptive docstrings for complex functions
- Keep functions small and focused
- Use Pydantic models for data validation
- Properly handle exceptions
- Use async/await where appropriate

**Code Formatting**:
```bash
# Format all files
make format

# Check formatting and linting
make lint

# Run all checks
make lint && pytest
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style/formatting (no functional changes)
- **refactor**: Code restructuring (no functional changes)
- **test**: Adding or updating tests
- **chore**: Build process, tooling, dependencies
- **perf**: Performance improvements
- **ci**: CI/CD configuration changes
- **revert**: Revert a previous commit

### Scope

Optional, specifies the area of change:
- `auth` - Authentication
- `clients` - Client management
- `sessions` - Session tracking
- `intake` - Intake forms
- `communication` - Messaging/homework
- `ui` - User interface
- `api` - API endpoints
- `db` - Database

### Examples

```
feat(auth): add password reset functionality

fix(sessions): resolve timezone handling bug in session list

docs(readme): update installation instructions

style(frontend): format code with prettier

refactor(api): simplify client endpoint logic

test(clients): add integration tests for CRUD operations

chore(deps): update react to version 19.2

perf(db): add index to sessions table for faster queries
```

### Guidelines

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize the first letter of the description
- No period at the end of the description
- Keep the first line under 72 characters
- Use the body to explain **what** and **why**, not **how**
- Reference issues and PRs in the footer: `Closes #123`

### Breaking Changes

If your commit introduces breaking changes:

```
feat(api): change client endpoint response format

BREAKING CHANGE: The /api/clients endpoint now returns an object with
a `data` array instead of a flat array.
```

## Pull Request Process

### Before Submitting

Ensure your PR meets these requirements:

- [ ] All tests pass locally (`npm test` and `pytest`)
- [ ] Code is properly formatted (`npm run format` and `make format`)
- [ ] Code passes linting (`npm run lint` and `make lint`)
- [ ] New features have accompanying tests
- [ ] Documentation is updated (if applicable)
- [ ] No `console.log()` or `print()` debug statements remain
- [ ] No sensitive information (API keys, passwords) is committed
- [ ] Commit messages follow the conventional format

### Creating a Pull Request

1. **Push your branch** to your fork
2. **Open a pull request** on GitHub against the `main` branch
3. **Fill out the PR template** completely
4. **Link related issues** using "Closes #123" or "Fixes #456"
5. **Request review** from maintainers
6. **Respond to feedback** promptly

### PR Title

Use the same format as commit messages:
- `feat(clients): add client search functionality`
- `fix(auth): resolve token expiration issue`
- `docs(contributing): update testing guidelines`

### PR Description

The PR template will guide you. Include:
- **Summary** of changes
- **Motivation** for the changes
- **Testing** performed
- **Screenshots** (for UI changes)
- **Breaking changes** (if any)

### CI Checks

Your PR must pass all automated checks:
- ✅ Frontend linting (ESLint)
- ✅ Frontend formatting (Prettier)
- ✅ Frontend tests (Vitest)
- ✅ Frontend build (Vite)
- ✅ Backend linting (Black, Ruff)
- ✅ Backend type checking (Mypy)
- ✅ Backend tests (pytest)
- ✅ Coverage thresholds met (70% frontend, 75% backend)

If checks fail, review the logs, fix the issues, and push updates.

## Review Process

### What to Expect

- **Initial review** within 2-3 business days
- **Constructive feedback** on code quality, design, and testing
- **Requests for changes** if needed
- **Approval** when all requirements are met

### Review Criteria

Reviewers will check for:
- **Correctness**: Does the code work as intended?
- **Testing**: Are there adequate tests?
- **Code quality**: Is the code readable and maintainable?
- **Performance**: Are there any performance concerns?
- **Security**: Are there security vulnerabilities?
- **Documentation**: Is documentation updated?
- **Style**: Does it follow our guidelines?

### Addressing Feedback

1. **Read feedback carefully** and ask questions if unclear
2. **Make requested changes** in new commits
3. **Respond to comments** when changes are made
4. **Request re-review** when ready
5. **Don't force-push** unless specifically requested

### After Approval

- Maintainers will merge your PR
- Your branch will be deleted automatically
- You'll be credited as a contributor

## Getting Help

### Resources

- **Documentation**: Review [README.md](README.md) and [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)
- **API Docs**: FastAPI auto-generated docs at `http://localhost:8000/docs`
- **Examples**: Look at existing code for patterns and conventions

### Questions

- **General questions**: Open a [Discussion](https://github.com/OWNER/therapy-app/discussions)
- **Bug reports**: Use the bug report [issue template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature requests**: Use the feature request [issue template](.github/ISSUE_TEMPLATE/feature_request.md)
- **Security issues**: Email security@example.com (do not create public issues)

### Community

- Be respectful and constructive
- Help others when you can
- Share your knowledge and experience
- Welcome newcomers

---

## Quick Reference

### Frontend Commands

```bash
npm run dev          # Start dev server
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run lint         # Lint and auto-fix
npm run format       # Format code
npm run build        # Build for production
```

### Backend Commands

```bash
python main.py       # Start FastAPI server
pytest               # Run all tests
pytest --cov         # Run tests with coverage
make format          # Format code
make lint            # Check code quality
make clean           # Clean cache files
```

### Git Commands

```bash
git fetch upstream                    # Get upstream changes
git rebase upstream/main              # Update your branch
git push origin branch-name           # Push to your fork
git push origin branch-name -f        # Force push (use carefully)
```

---

Thank you for contributing to Pier88! Your efforts help make this project better for everyone.
