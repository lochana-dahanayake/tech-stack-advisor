# Working in Claude Code cloud sessions

The owner builds this project in Claude Code on the web (cloud sessions), not on their PC. Each session runs on a fresh, temporary machine that clones this repo from GitHub. Plan work around that.

| Limit | What to do |
|---|---|
| **Fresh machine each time.** Nothing survives except what you push. | Commit and push often. Update `ROADMAP.md` "Next up" before stopping. |
| **No access to the owner's PC.** No local files or PDFs unless committed. | Everything needed must be in the repo (`references/`) or online. |
| **No browser automation** (Claude in Chrome is local only). | Use web search/fetch. For JS-heavy pages, look for the docs' GitHub source or raw markdown instead. |
| **Network may be limited** to an allowlist (package registries, GitHub, common docs). | If a site is blocked, try its GitHub repo, npm page or another source. Note anything you couldn't verify in `OPEN_QUESTIONS.md`. Don't guess. |
| **Git identity isn't set.** | First thing: `git config user.name "Lochana Dahanayake"` and `git config user.email "loch214@gmail.com"`. |
| **No secrets** unless the owner adds them in the cloud environment settings. | Never ask for keys in chat. The app must run fully without AI keys (rules-only). Test AI code with mocks. |
| **Dependencies aren't preinstalled.** | Run `npm ci` at the start (once `package.json` exists). |
| **Limited time and credits per session.** | One roadmap item per session: finish, test, document, push, merge. |
| **The sibling repo isn't there by default.** | Shallow-clone it to `/tmp` (see `SIBLING_PROJECT.md`). |

## Session checklist
1. Set git identity.
2. Read `CLAUDE.md`, then `ROADMAP.md` "Next up".
3. Create a feature branch.
4. Do the task. Test. Update docs.
5. Push, open the PR, merge it, update "Next up".
