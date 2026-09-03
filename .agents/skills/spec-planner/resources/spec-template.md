# Spec: [Feature Name]

> **Roadmap Reference**: Phase X, Step X.Y — [Step Title]
> **Branch**: `verb/phase-name`
> **Spec**: NNN of MMM in phase
> **Date**: YYYY-MM-DD
> **Status**: Draft

---

## 1. Overview

_Brief description of what this feature is and why it exists. Provide context
about where it fits in the overall product and this phase._

## 2. Dependencies

_List any prior specs in this phase that must be completed before this one._

- Depends on: `specs/NNN-feature-name/` — [brief reason]
- Or: None (this is the first spec in the phase)

## 3. Functional Requirements

_Detailed list of what this feature MUST do. Be specific and unambiguous._

### 3.1 — [Requirement Group]

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] ...

### 3.2 — [Requirement Group]

- [ ] Requirement 1
- [ ] ...

## 4. Acceptance Criteria

_How do we know this feature is complete? These should be testable statements._

- [ ] AC1: ...
- [ ] AC2: ...
- [ ] AC3: ...

## 5. API Contract

_If this feature involves API endpoints, define them here._

### `METHOD /api/v1/endpoint`

**Summary**: _Short description_

**Request Body**:
```json
{
  "field": "type — description"
}
```

**Success Response** (`200`):
```json
{
  "field": "type — description"
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `ERROR_CODE` | Description |
| ... | ... | ... |

## 6. UI/UX Requirements

_If this feature has a frontend component, describe the user-facing behavior._

- **Page/Route**: `/route-path`
- **Layout**: _Description of the visual layout_
- **Interactions**: _What happens when the user clicks, submits, hovers, etc._
- **States**: Loading, empty, error, success states
- **Responsive**: _Any responsive behavior notes_

## 7. Edge Cases & Error Handling

_What could go wrong? How should the system handle it?_

| Scenario | Expected Behavior |
|----------|-------------------|
| ... | ... |

## 8. Out of Scope

_Explicitly list things this spec does NOT cover, to prevent scope creep._

- ❌ ...
- ❌ ...

## 9. Constitution Compliance

_Note any specific constitution rules that are particularly relevant to this
feature and how this spec complies with them._

- ✅ Rule: ...
- ✅ Rule: ...

## 10. Open Questions

_Any remaining questions or decisions that need to be resolved._

- ❓ ...
