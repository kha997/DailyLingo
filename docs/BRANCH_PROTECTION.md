# Branch Protection Recommendation

**Current state (checked with `gh api`):** `main` is **not protected**, and the
repository is **public** (`has_pages: false`). No protection rules were changed by
this work; changing repository settings requires the Owner.

Recommended for Beta: protect `main` so an unreviewed or red build cannot become
the release baseline.

## Recommended rules for `main`

| Rule | Value | Why |
|---|---|---|
| Require a pull request before merging | On | Prevents direct pushes to the release branch |
| Required approvals | 1 | Owner/independent reviewer; the author cannot self-approve |
| Dismiss stale approvals on new commits | On | Approval must match the reviewed SHA |
| Require review from Code Owners | Only if `CODEOWNERS` is added | Keeps ownership explicit |
| Require status checks | `typecheck`, `test`, `build`, `e2e` | Matches the four CI jobs in `.github/workflows/ci.yml` |
| Require branches to be up to date | On | The checked commit is the one that merges |
| Require conversation resolution | On | No unresolved review threads at merge |
| Require linear history | Optional | Avoids merge commits; use squash/rebase |
| Block force pushes | On | Protects history and the baseline |
| Restrict deletions | On | `main` cannot be deleted |
| Allow bypass | Nobody / Owner only | Avoid silent red merges |

If rulesets are preferred over classic protection, apply the same rules as a
branch ruleset targeting `main` with the four CI checks as required workflows.

## Owner commands (do not run without authorization)

Classic branch protection:

```bash
gh api -X PUT repos/kha997/DailyLingo/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks[strict]=true \
  -f 'required_status_checks[contexts][]=typecheck' \
  -f 'required_status_checks[contexts][]=test' \
  -f 'required_status_checks[contexts][]=build' \
  -f 'required_status_checks[contexts][]=e2e' \
  -f enforce_admins=true \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f required_conversation_resolution=true \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

Note: the status-check contexts must match the **job names** shown on a real PR
run. If the workflow or job names change, update the protection rule in the same
PR.

Ruleset alternative (UI): Settings → Rules → Rulesets → New branch ruleset →
target `main` → require PR, 1 approval, the four checks, no force push, no
deletion.

## Release-branch convention

- `main` = verified baseline only.
- `beta-readiness` (or one branch per issue) = all work; merge via PR.
- Tags/releases should point at commits whose CI run is green and whose acceptance
  report is updated.
- No direct pushes to `main`; no `git push --force` on shared branches.
- The staging workflow is manual; it does not bypass branch protection.

## Public-repository caveat

Because the repository is public:

- A GitHub Pages staging site is **publicly reachable** even when deployment is
  owner-approved. Do not publish learner data, private feedback, or internal
  notes. The app itself stores nothing server-side.
- CI logs and artifacts are public. Coverage and Playwright artifacts must not
  contain secrets or learner backups. The current artifacts are build output,
  coverage HTML/JSON, and failure traces only.
- If a private staging site is required, use a private repository or a host with
  access control; that is a separate Owner decision and budget.

## Verification after enabling

1. Open a throwaway PR that changes one line.
2. Confirm the four checks appear and are required.
3. Confirm a direct push to `main` is rejected.
4. Confirm a red check blocks merge.
5. Confirm force-push and deletion are rejected.
6. Record the result in [`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md).
