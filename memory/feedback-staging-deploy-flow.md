---
name: staging-deploy-flow
description: How to deploy to staging — always via PR, never direct push
type: feedback
---

Always open a pull request from the feature branch targeting `staging`. Never push directly to `staging`.

**Why:** The user was explicit: "I never ever ever mean push it directly to staging." Branch protection requires CI to pass anyway, but more importantly this is a hard preference.

**How to apply:** When the user says "get this up on staging", "push to staging", "deploy to staging", or anything similar — the correct action is always: push the feature branch, open a PR targeting `staging`, and let CI + the user merge it. Never attempt `git push origin staging` directly.
