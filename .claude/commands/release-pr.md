Tag `main` for a production release.

Pushing a `v*` tag triggers two things automatically:
1. Railway deploys the tagged commit to the production environment
2. The `migrate-prod.yml` workflow runs Supabase migrations against the production DB

Steps:
1. Run `git fetch origin --tags` to get the latest state
2. Check that main is clean and CI is passing: `gh run list --branch main --limit 3`
3. Find the latest tag to determine the next version: `git tag --sort=-v:refname | grep '^v' | head -5`
   - Default to bumping the patch version (e.g. v1.0.1 → v1.0.2)
   - If the release includes new features, bump minor (v1.0.1 → v1.1.0)
   - If breaking changes, bump major (v1.0.1 → v2.0.0)
   - Ask the user which bump to use if unclear
4. Show what will be released: `git log <latest-tag>..origin/main --oneline`
   - If there's nothing new since the last tag, stop — nothing to release
5. Confirm the version with the user before tagging
6. Create and push the tag:
   ```
   git tag <version> origin/main
   git push origin <version>
   ```
7. Confirm the tag was pushed and tell the user to watch:
   - GitHub Actions → "Migrate Production" workflow for DB migrations
   - Railway production environment for the deploy

Version format: `v<major>.<minor>.<patch>` (e.g. `v1.2.0`)
