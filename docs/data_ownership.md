# Data Ownership & Mutation Rules (MVP)

Purpose:
Define who and what is allowed to create, modify,
or delete data in the system.
This prevents silent corruption and manual fixes.

────────────────────────────────
## System Stage
(Applies to: MVP)
Status: ACTIVE

────────────────────────────────
## Ownership Rules

- All production data is owned by the system
- Humans MUST NOT directly modify production data
- Data changes MUST occur through:
  - application logic
  - controlled scripts
  - governed workflows

────────────────────────────────
## Forbidden Actions

- Manual SQL changes in production
- “Quick fixes” directly in the database
- Deleting or editing data without auditability

────────────────────────────────
## Exception Rule

If an emergency data fix is required:
- It MUST be treated as an incident
- It MUST be documented
- It MUST be reversible
