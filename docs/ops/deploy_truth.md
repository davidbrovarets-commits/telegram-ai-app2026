# Deployment Truth & Verification

This document is the source of truth for verifying deployments.

## 1. Confirm GitHub Actions Status
**Goal:** Ensure the CI/CD pipeline succeeded.
- Go to GitHub Repository -> **Actions** tab.
- Select the `main` branch.
- Check the latest workflow status (Green Checkmark ✅).
- **Note:** If `gh` CLI is installed, us: `gh run list --limit 1`

## 2. Confirm Firebase Hosting (Production)
**Goal:** Ensure the live site matches the code.
- Open: `https://claude-vertex-prod.web.app` (or configured prod URL).
- **Hard Refresh:** `Ctrl + F5`.
- **Verify Version:** Check console logs or UI markers for latest changes (e.g., new feature presence).

## 3. PowerShell Best Practices
- **Command Separator:** On Windows PowerShell, ALWAYS use `;` instead of `&&`.
  - Correct: `git add . ; git commit -m "msg"`
  - Incorrect: `git add . && git commit -m "msg"`

## 4. Installed Tools Checklist
- [ ] Node.js & npm
- [ ] Git
- [ ] Firebase CLI (optional, manual deploys discouraged)
- [ ] GitHub CLI (`gh`) (Recommended for status checks)
