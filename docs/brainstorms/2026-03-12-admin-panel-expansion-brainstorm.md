---
date: 2026-03-12
topic: admin-panel-expansion
---

# Admin Panel Expansion

## What We're Building

A richer admin panel that serves as a one-stop shop for club operations. The target users are the club owner and 1–2 staff members. No role-based permissions needed within admin — all admins see everything.

## Scope

### 1. Admin Dashboard (landing page)
- Today's bay bookings — timeline view across all bays
- Quick stats: active members, bookings this week, open bays right now
- Recent membership requests needing action
- Quick links: Send invite, Block a bay, Find a member

### 2. Member Search + Profile Page
- Searchable member list (by name, email)
- Individual member profile showing:
  - Contact info (name, email, phone, discord)
  - Member since, active/inactive status
  - Upcoming + past booking history
  - Guest history (who they've brought, how often)
  - Staff notes — freeform text field for internal context
  - Shopify order history (deferred — read-only when ready)

### 3. Book on Behalf of a Member
- From the reservations/admin view, admin can create a booking assigned to any member
- Useful for phone-in requests, VIP arrangements

## Out of Scope
- Communications / announcements — handled by Mailchimp
- Discord bot integration — deferred
- Billing integration — Shopify read-only, deferred
- Role-based admin permissions — not needed at this scale

## Next Steps
→ `/workflows:plan` for implementation details
