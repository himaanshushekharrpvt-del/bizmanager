# BizManager Backend

A multi-tenant Spring Boot backend for businesses that sell tickets, run a small shop, and manage staff attendance/payroll — built from scratch (not a fork of anything else).

## Quick start

**Zero-setup (H2 in-memory, resets on restart):**
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**Real run (MySQL):** create a database, set `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` (or edit `application.properties` directly), then:
```bash
./mvnw spring-boot:run
```

App listens on `:8080` by default (override with `PORT`).

> **Honest disclaimer:** I don't have a Java/Maven toolchain with internet access to Maven Central in the sandbox this was built in, so I could not run an actual `mvn compile`. I reviewed every file by hand and caught/fixed several real bugs in the process (most notably: plain Lombok `@Builder` silently drops inherited fields — every entity that needed `businessId` from `TenantEntity` had to be switched to `@SuperBuilder` instead). Run `mvn compile` yourself as a first step; if anything's off it's most likely a small thing like this, not a structural problem.

## How the pieces fit together

```
business/    Business (tenant) entity
role/        Dynamic roles - 4 seeded defaults + MasterAdmin-created custom ones
user/        Login accounts (every role, including Staff/StockManager, is a User)
auth/        Register a new business (creates tenant + MasterAdmin), login (JWT)
security/    JWT issue/verify, AuthContext (the permission-check helper every service uses)
ticket/      Ticket pricing, ribbon stock, daily ticket sales
expense/     Expense categories + daily logged amounts
staff/       Staff HR profiles, attendance, salary accrual/payment
stock/       Shop item catalogue + daily sale entries
alert/       Low-stock alerts (ribbons + stock items), pluggable notifier
analytics/   Dashboard, revenue-by-range, insights, audit log viewer
common/      Shared base entities, the Permission enum, audit log, exceptions
```

## The permission model

Four roles are seeded automatically when a business registers: **MasterAdmin**, **Admin**, **Staff**, **StockManager**. But under the hood, none of the authorization logic checks role *names* (except the two MasterAdmin-only actions below) — it checks **permissions**, and a Role is just a named bundle of permissions (see `Permission.java` for the full list). That's what makes "MasterAdmin can create more roles" actually work: a new role is just a new bundle, and every `@PreAuthorize`-style check in the codebase (`authContext.require(Permission.X)`) keeps working against it automatically.

Two checks ARE hardcoded to MasterAdmin specifically, because they're not really "permission bundle" decisions:
- Creating/removing an **Admin** account (`authContext.requireMasterAdmin()`)
- Creating a **custom role** (same)

Default bundles:
- **MasterAdmin** — every permission
- **Admin** — every permission except `MANAGE_ADMINS` and `MANAGE_ROLES`
- **Staff** — none (staff use the `/api/staff/me/*` self-service endpoints instead, gated by "is this your own profile", not a permission)
- **StockManager** — `ENTER_STOCK_SALE` only

## Running through the flow once, end to end

```bash
# 1. Register a business - this also logs you in as MasterAdmin
curl -X POST localhost:8080/api/auth/register-business -H "Content-Type: application/json" -d '{
  "businessName": "Riverside Water Park", "businessType": "Water Park",
  "masterAdminName": "Asha Rao", "email": "asha@riverside.test", "phone": "9999999999", "password": "secret123"
}'
# -> returns { "token": "...", ... } - save the token

TOKEN="<paste it>"

# 2. Set ticket prices (use the token as a Bearer header from here on)
curl -X POST localhost:8080/api/tickets/pricing -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"dayType":"WEEKDAY","category":"ADULT","price":500}'
curl -X POST localhost:8080/api/tickets/pricing -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"dayType":"WEEKDAY","category":"CHILD","price":300}'
# ...repeat for WEEKEND/ADULT and WEEKEND/CHILD

# 3. Stock ribbons
curl -X POST localhost:8080/api/ribbons/restock -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"ADULT","quantity":1000}'

# 4. Log today's ticket sales (auto-detects weekday/weekend, decrements ribbons, computes revenue)
curl -X POST localhost:8080/api/tickets/sales -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"saleDate":"2026-06-28","adultSold":120,"childSold":40}'

# 5. Check the dashboard
curl localhost:8080/api/analytics/dashboard -H "Authorization: Bearer $TOKEN"
```

## Notable design decisions

- **"Remove" means deactivate, never hard-delete.** Users are referenced by years of sales/attendance/audit rows — deleting them would orphan history. `DELETE /api/users/{id}` sets `active=false`.
- **Same-day re-submission is a correction, not a duplicate.** Ticket sales, stock sales, expenses, and attendance are all upserted by their natural key (date, or date+item). Re-entering today's numbers adjusts ribbon/item stock by the *delta* and writes an audit entry showing old → new, rather than double-counting.
- **Salary "resets" without zeroing anything out.** `StaffProfile.lastPaidAt` is the only state that changes when MasaterAdmin/Admin marks salary paid. Cumulative salary is always computed as "sum of present-day pay since `lastPaidAt`" — so there's nothing to reset, the calculation naturally starts fresh.
- **Price/salary changes keep history, not just a current value.** `TicketPricing` rows are never edited in place — a new active row is inserted and the old one flagged inactive, so `GET /api/tickets/pricing/history` shows the full timeline. Attendance snapshots the per-day salary at the time it's marked, so a later salary change doesn't rewrite past months.
- **One revenue endpoint covers daily/weekly/monthly/yearly/custom.** `GET /api/analytics/revenue?from=&to=` takes any date range — your frontend just computes the right `from`/`to` for whichever preset the user picked.
- **The "extra" feature I added beyond the spec:** a true net-profit figure (`revenueAfterExpenses - staffCost`) alongside the ticket/expense-only revenue figure you asked for, plus `/api/analytics/insights` (best-selling items, expense breakdown by category, busiest/slowest ticket day, average daily revenue) and a full audit log viewer at `/api/audit-log`.

## What's intentionally left as a TODO

- **Refresh tokens.** JWTs are long-lived (12h default, see `app.jwt.expiration-ms`) with no refresh flow. Fine for a v1; add refresh tokens before this matters for a real all-day shift.
- **Holiday calendar.** `DayType.forDate()` treats Saturday/Sunday as the only weekend days. If a business needs holiday-specific pricing, that's a one-method change.
- **Real alert delivery.** `LoggingAlertNotifier` just logs. Implement `AlertNotifier` with a real email/SMS/push provider when you're ready — every alert is persisted regardless, so nothing is lost in the meantime.
- **CORS is wide open (`*`).** Restrict `SecurityConfig.corsConfigurationSource()` to your actual frontend origin before deploying anywhere public.

## Frontend integration notes

Every endpoint expects `Authorization: Bearer <token>` except `/api/auth/**`. The token (from login/register) carries the user's permissions as JWT claims — your React app can decode it (or just keep the fields returned alongside the token in the login response) to decide what UI to show without an extra round-trip. `GET /api/roles/assignable` is what you'd populate a "create staff account" role dropdown from (it excludes Admin/MasterAdmin on purpose).
