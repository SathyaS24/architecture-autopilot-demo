---
name: architecture-autopilot-engineer
summary: Complete guide for analyzing codebase architectures, mining Git history for logical coupling, classifying change intent, planning refactors, modifying code, and verifying with automated tests.
tags:
  - architecture-analysis
  - git-archaeology
  - refactoring
  - typescript-testing
---

# Architecture Autopilot Engineer

This skill guides a coding agent through the complete lifecycle of analyzing tangled codebases, identifying logical and physical coupling, mining Git history for intent/debt, planning safe refactors, modifying code, and verifying regressions with tests.

---

## Workflow Steps

### 1. Repository Inspection & Context Gathering
Understand the directory structure, build files (`tsconfig.json`, `package.json`), source files, and test files before making any modifications.
- Locate the package configuration, scripts, and devDependencies (especially test frameworks like Vitest or Jest).
- Check the Git repository status (`git status`) to ensure the working directory is clean.

### 2. Static AST & Source Code Analysis
Perform AST-based static parsing on the codebase to map code entities:
- Extract all file-level imports, classes, functions, and named exports.
- Match imports with their corresponding target files in the repository to resolve actual physical dependencies.
- Assign files to their architectural layers (e.g., `controllers`, `services`, `repositories`) based on file names or folder structures.

### 3. Dependency Graph Construction
Represent physical dependencies using a directed graph where nodes represent source files and directed edges represent import relationships:
- Node $A \to B$ exists if file $A$ imports symbols from file $B$.
- Calculate graph metrics such as total dependencies, in-degree (dependents), and out-degree (dependencies).

### 4. Circular Dependency Detection
Apply Tarjan's Strongly Connected Components (SCC) algorithm to detect cycle groups:
- Any SCC containing more than one file indicates a cyclic dependency (e.g., File A imports B, and B imports A).
- Flag circular dependencies as high-priority refactoring targets.

### 5. Layer Violation Analysis
Define strict architectural layering rules (e.g., Controllers can import Services; Services can import Repositories; but Repositories must never import Services or Controllers):
- Traverse the graph edges and identify any edge that violates the unidirectional top-to-bottom layering guidelines.
- Report all violations with the specific files and violating layers.

### 6. Git Archaeology & History Mining
Supplement static results with historical context. Spawns Git read-only processes safely using machine-readable formats (e.g. `git log --name-status` and `git rev-parse --show-toplevel` for absolute path matching).
- Resolve Git-returned paths relative to the top-level repository root.
- Apply canonical path normalization (resolving symlinks and 8.3 short names on Windows using native realpath, drive letter uppercase conversion, and forward slash standardization) before comparing historical files with static analysis lists.

### 7. File Co-Change Coupling Analysis
Calculate historical co-change strength between files modified in the same commits:
$$\text{strength}(A, B) = \frac{\text{coChangeCount}(A, B)}{\min(\text{changeCount}(A), \text{changeCount}(B))}$$
- High co-change strength indicates tight logical coupling (e.g. files are repeatedly changed together in bug fixes or features), signifying that they should be refactored as a single unit.

### 8. Change Intent Classification
Do NOT rely on commit-message keywords alone. Combine multiple signals (commit message, changed files, patch/context, source comments, repeated historical changes, and architectural context) to determine the true intent of a change.
1. `bug_fix`: Keyword indicators (`fix`, `bug`, `crash`, `issue`, `error`, `solve`, `defect`) combined with localized patch fixes.
2. `configuration_change`: Metadata modifications involving `config`, `tsconfig`, `package.json`, `env`.
3. `dependency_change`: Changes to imports, locks, or manifest fields targeting packages/modules.
4. `test_change`: Assertions, test files, spec additions or modifications (e.g. `vitest`, `jest`).
5. `documentation`: Readme, CHANGELOG, or code doc blocks.
6. `refactor`: File structural changes, simplifications, and cleanups without behavioral alteration.
7. `feature`: New files, controllers, services, or endpoints implementing fresh functionality.

### 9. Debt vs. Workaround Categorization
Combine commit logs and source-level comments to categorize architectural state:
- **`INTENTIONAL_WORKAROUND`**: Explicitly documented in commit logs or source comments targeting environment/operational constraints (e.g., `Kubernetes`, `k8s`, `liveness`, `readiness`, `probe`, `heartbeat`, `latency`, `performance`, `compliance`, `compatibility`, `operational workaround`, `production requirement`).
- **`ACCIDENTAL_DEBT`**: Indicated by technical-debt markers in logs or code comments (e.g., `quick fix`, `temporary`, `refactor later`, `deadline`, `hack`, `FIXME`, `TODO`).
- **`INSUFFICIENT_EVIDENCE`**: Classified when no clear historical or source-level evidence is present to substantiate the origin or necessity of a pattern. Never guess; always use this default classification if evidence is sparse.

### 10. Conservative Safety Lock Decisions
Determine refactoring safety:
- If classified as `INTENTIONAL_WORKAROUND` $\to$ **`safeToRefactor = false`** (locked to preserve critical production compliance/behavior).
- If classified as `INSUFFICIENT_EVIDENCE` $\to$ **`safeToRefactor = false`** (locked for safety).
- If classified as `ACCIDENTAL_DEBT` $\to$ **`safeToRefactor = true`** ONLY when actual historical evidence is present with high confidence.

### 11. Safe Refactoring Planning
Before editing any code, design a step-by-step refactoring plan:
- Map dependencies, cycles, and logical coupling.
- Identify clean integration seams (e.g., introducing interfaces or moving cross-cutting logic to dedicated services).
- Define the correct ordering of changes to minimize intermediate compilation breakages.

### 12. Code Modification Guidance
When modifying code to resolve cycles or violations:
- Keep changes highly modular and scoped.
- Match existing code styles, indentation, and conventions.
- Do not add hypothetical features, unused shims, or premature abstractions.
- Never write destructive commands or bypass git hooks.

### 13. Test Generation & Repair
Ensure test coverage is updated and robust:
- Repair any test broken by the refactor (e.g. signature updates, new classes/interfaces).
- Generate deterministic tests for new functionality using mock fixtures or isolated directories. Never make tests depend on a developer's local environment.

### 14. Build & Test Validation
Validate all changes programmatically:
- Run the project's compilation scripts (e.g., `npm run build` or `tsc`).
- Run the test suite (e.g., `npm test` or `vitest`) and verify that all tests pass without warnings.
- Fix all compiler/test errors immediately before proceeding.

### 15. Final Review & Regression Protection
Perform a thorough final check of the codebase:
- Check `git status` and `git diff` to confirm that only intended files are modified.
- Ensure no secrets or API keys are committed.
- Verify that the final health score of the architecture analyzer has improved.
- Do NOT require that every single architectural issue be eliminated. The core goal is to safely resolve refactorable accidental debt while preserving intentional workarounds and files with insufficient historical evidence. Do not risk breaking production stability for cosmetic structural perfection.
