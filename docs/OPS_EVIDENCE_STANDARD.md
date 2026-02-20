# OPS EVIDENCE STANDARD

**Status:** ACTIVE  
**Purpose:** Establish immutable evidence tracking rules for system mutations.

## 1. Minimal Evidence Rules (What Proof is Required?)

**ALATI (Kõik muudatused):**
- **Commit SHA:** Kohustuslik. Tõestab matematiiliselt, et muudatus on repojäljes olemas.

**KUI rakendub (spetsiifilised muudatused):**
- **Workflow `run_id`:** Lisa see, kui tegevus hõlmas GitHub Actions käivitust (nt deploy, scheduled run või spetsiifiline andmepuhastus workflow).
- **SQL Output Snippet:** Lisa see ainult siis, kui jooksutasid SQL käsku (read-only query või migration).

### Näited
- **"Docs-only change" (Dokumentatsiooni muudatus):** Ainult Commit SHA.
- **"Deploy change" (Koodi/funktsionaalsuse muudatus produktsiooni):** Commit SHA + `run_id`.

## 2. Where Does Evidence Live?

- Evidence artifacts must be stored chronologically inside the repository: `artifacts/<date>_evidence.md`.
- Historical evidence files act as system integrity rollback context.
