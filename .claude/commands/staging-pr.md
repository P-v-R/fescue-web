Create a PR from the current feature branch → `main`.

When merged, main auto-deploys to the Railway staging environment and runs staging DB migrations automatically.

Steps:
1. Run `git fetch origin`
2. Identify the current branch with `git branch --show-current`. If already on `main`, stop and tell the user to run this from a feature branch.
3. Check what commits are on the current branch but not on `main` using `git log origin/main..HEAD --oneline`. If there are none, stop — nothing new to merge.
4. Check for merge conflicts using `git merge-tree $(git merge-base origin/main HEAD) origin/main HEAD`. If conflicts exist, resolve them first:
   - Merge origin/main into the current branch: `git merge origin/main`
   - Resolve all conflict markers, keeping the current branch's version of changed files (it has the newer work)
   - Commit the resolution: `git commit -m "fix: resolve merge conflicts with main"`
   - Push the branch: `git push origin HEAD`
5. Check if an open PR already exists: `gh pr list --head <branch> --base main --state open`. If one exists, return its URL instead of creating a duplicate.
6. Push the branch if not already pushed: `git push -u origin HEAD`
7. Summarize the commits into a short description
8. Create the PR: `gh pr create --base main --head <current-branch>` with a clear title and body listing what's included
9. Return the PR URL

PR title format: `<type>: <short summary>` (e.g. `feat: member directory search`, `fix: bulletin formatting`)
The body should list the changes as bullet points sourced from the commit log.
