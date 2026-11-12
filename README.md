# EventHub QA: US-114 "Book tickets for an event"

Playwright + TypeScript framework covering the booking flow through the **UI and the REST API**, with a GitHub Actions pipeline.

> Built with AI assistance (as the brief allows). I explored the live API and UI myself, ran the probes, and I can walk through every file.

## 1. Quick start

```bash
npm ci
npx playwright install chromium
cp .env.example .env        # then fill in two disposable test accounts
npm test                    # everything
npm run test:api            # API project only
npm run test:ui             # UI + e2e project only
npm run test:smoke          # tests tagged @smoke
npm run report              # open the HTML report
```

Credentials for reviewers are supplied in the submission form (see `.env.example` for the variable names). Both accounts are registered automatically on the first run if they do not exist yet.

## 2. Story review (US-114)

### 2.1 What is missing, unclear or wrong in the story

| # | Observation | Evidence |
|---|---|---|
| 1 | **"As a visitor" is wrong.** A visitor cannot book. Every endpoint returns `401 Unauthorized` without a token, and the UI is an authenticated app (user email and Logout in the nav). The story never mentions registering or logging in. | Probed live: `GET /events`, `GET /bookings`, `POST /bookings` without a token all return 401 |
| 2 | **AC1 skips the real entry path:** log in, open Events, pick an event, then the booking form. The story starts at "choose the number of tickets". | UI walkthrough |
| 3 | **AC5 is unclear.** In the brief it reads as cut off ("The same works through the API using ... POST /api/bookings"), most likely a copy/paste artefact. Even read charitably, "the same works" does not say which of create, price, list and cancel must match, or what an API failure must look like. The Swagger docs fill most of this in. | Brief, Swagger |
| 4 | **Input rules are not in the story:** quantity 1-10, name at least 2 characters, phone at least 10 characters with digits and `+ - ( )` and spaces only, valid email. They exist only in code and Swagger. | Swagger + live validation errors |
| 5 | **AC2 has no currency or rounding rule.** The UI shows `$`; the API has no currency field. Money is returned as a **string** (`"300"`). The total is computed server-side and shown live in the UI before confirming. | Live responses, UI |
| 6 | **"Booking reference" is undefined:** format, uniqueness and whether it is emailed. | Live: `D-XXXXXX` |
| 7 | **AC3 "My Bookings"** says nothing about ordering, paging, status, or what happens to a cancelled booking. | Swagger (`PaginationMeta` exists) |
| 8 | **AC4 says "cancel", the system hard-deletes.** After cancelling, the booking is gone (`GET` returns 404), there is no `cancelled` status, no history, no refund notion. The story also omits that seats are returned and that a confirmation dialog appears. | Live |
| 9 | **Capacity and dates are not covered:** sold-out behaviour, simultaneous bookings for the last seat, and bookings for events in the past. | Live (see 2.2) |

### 2.2 Where the application does not match the story or the docs

| # | Mismatch | Evidence |
|---|---|---|
| A | **Booking reference format:** docs and service description say `EVT-XXXXXX`; the live API and UI produce `D-XXXXXX` (the prefix may depend on the event). | `D-YHE8Y3` (API), `D-OND4SL` (UI). Test: `docs-mismatch.api.spec.ts` |
| B | **`totalPrice` type:** docs example is a number, API returns a string. | Live. Test in `docs-mismatch.api.spec.ts` |
| C | **Swagger does not declare auth on the Bookings endpoints** (no lock icon), but they require a Bearer token. | Swagger vs live 401 |
| D | **Ownership responses are inconsistent and undocumented:** another user's booking gives **403** on `GET /bookings/{id}` and `GET /bookings/ref/{ref}`, but **404** on `DELETE`. The 403 also confirms that a booking exists, and ids are sequential. Neither code is in the docs. | Live, two users |
| E | **Past events can be booked.** All three seeded events are dated April to October 2026; a booking on the 2026-10-20 event was accepted on 2026-11-11. | Live |
| F | **Register docs promise an isolated sandbox** ("events and bookings are private to their account"), but new users all see the same seeded events (ids 283-285) with heavily drained seats (for example 8 of 500 left). Seeded events look shared. | Live, `GET /events` for fresh users |
| G | **`quantity: "2"` (string) is accepted** although the schema says integer. | Live. Test in `docs-mismatch.api.spec.ts` |
| H | **Phone rules are under-documented:** Swagger shows only `minLength: 10`; the API also rejects letters. | Live validation messages |
| I | **Sold-out and "not enough seats" return 400**, the same code as field validation (409 is more usual), so they can only be told apart by message text. | Live |
| J | **Booking email need not match the account:** user B booked with user A's email address. Is a confirmation email sent there? | Live |
| K | **Docs copy/paste error:** the `500` example body reads "Resource not found" on every endpoint. | Swagger |
| L | **Login errors differ from the docs.** Swagger says an unknown email gives `404 "User not found"` and a wrong password `400 "Invalid credentials"`; a failed login for an unregistered account returned `400 "Invalid email or password"` (to be confirmed with a deliberate wrong-password and unknown-email pair). Wrong credentials and duplicate email both use 400 (401 / 409 are more usual). | Swagger vs live setup failure |
| M | **UI:** the dialog's dismiss button is labelled "Cancel" in a *cancel booking* flow, which is easy to misread. The "View My Bookings" `<button>` sits inside an `<a>` (invalid HTML). The confirmation page logged 43 console errors (not investigated). | UI / DevTools |

### 2.3 Questions I would ask the Product Owner

1. **Who can book?** Is login required (it is today)? Should the story and AC1 include registration and login?
2. **Cancellation:** is a hard delete intended? Do we need a `cancelled` status for history, refunds or support? Is there a cut-off, for example no cancelling after the event?
3. **Past events:** should they be bookable? If not, where is that enforced, and what should the user see?
4. **Booking reference:** what is the official format, and is it emailed? The docs say `EVT-`, the system says `D-`.
5. **Price:** which currency, and are taxes or fees ever added? Should `totalPrice` be a number or a string in the API?
6. **Limits:** is the 10-ticket cap per booking, or per user per event? Can a user book the same event twice?
7. **Access control:** what should user B get when asking for user A's booking, 403 or 404? Should the docs list it?
8. **My Bookings:** default ordering, paging, and should it show cancelled bookings?
9. **Customer details:** must the booking email match the account? What are the real phone and name rules (the API accepts a numeric name)?
10. **Sold-out and concurrency:** what is the expected error for the last seat being taken, and which status code?
11. **Shared seed data:** is it intentional that all users see and drain the same seeded events?

## 3. Architecture and key decisions

```
src/
  config/env.ts            all configuration + credentials (env vars only)
  api/
    context.ts             the ONLY place that attaches the Bearer token
    clients/               AuthClient, EventsClient, BookingsClient (thin, typed, no assertions)
    models.ts, response.ts response types (from live responses) + one small helper
  auth/session.ts          where setup stores tokens / browser state
  data/builders.ts         event, customer and booking builders, unique data per run
  fixtures/                api / otherApi / anonApi / testData (create data + cleanup after each test)
  ui/
    pages/                 LoginPage, EventDetailsPage, MyBookingsPage
    components/            BookingForm, BookingConfirmation, CancelDialog
tests/
  global.setup.ts          health check, sessions for both users, one real UI login -> storage state
  api/  ui/  e2e/          specs (every test is an explicit `test(...)`, no loops generating tests)
```

**Decisions and why**

- **Playwright for both UI and API (TypeScript only).** One language, one runner, one report, and the UI and API tests share auth, config and fixtures. A second stack (RestAssured) would double the tooling for a team that grows this suite. The trade-off is giving up RestAssured's fluent assertions; the typed clients and small helpers make up for it.
- **Authorization lives in the framework, never in tests.** `global.setup.ts` authenticates once per run; fixtures give each test an already-authorised API client (`api`), a second user (`otherApi`) and an anonymous one (`anonApi`). UI tests start from a saved browser state. Only the login-form test touches credentials.
- **UI state comes from a real login.** The setup logs in through the actual form once and saves the browser state, rather than guessing which `localStorage` keys the app needs. Swapping this for "API login + injected token" later is a one-file change.
- **Every test owns its data.** Each test creates its own event (known price and capacity) through the API, so totals and seat counts are exact and parallel-safe, and the shared, drained seeded events are never asserted on.
- **Cleanup is a fixture, not a habit.** `testData` cancels the bookings on the test's events, then deletes the events, even when the test fails. A cleanup problem is logged as a warning. Seeded data is never touched.
- **Layering:** clients and page objects contain no assertions; specs own all assertions. Money is compared as numbers, not strings.
- **Plain code over clever code.** Response types are simple (no unions or unwrap helpers), locators use ids, test ids or plain button/heading names, and `exact: true` is used only where one label sits inside another (`+`, and `Cancel` vs `Cancel Booking`).
- **Known issues are executable.** `docs-mismatch.api.spec.ts` asserts what the docs promise and is marked `test.fail`, so CI stays green while the mismatch exists and goes red when it is fixed, which is the cue to promote the test.

**Why these tests (and not more)**

- **API-heavy.** Validation boundaries, capacity, ownership and cancellation are fast and stable at the API (about 40 tests). Boundaries are separate tests, so a failure names the exact rule.
- **UI-thin.** The UI covers what only the UI can break: live price and total, the confirmation panel, My Bookings, the cancel dialog and its two outcomes (about 12 tests).
- **One e2e test** checks that a booking made in the UI is the same booking the API returns (reference, quantity, total, seats).
- `@smoke` marks one fast test per acceptance criterion.
- **Deliberately not covered:** field validation messages in the UI (not yet inspected), the Events list and search, admin pages, and cross-browser runs (Chromium only).

## 4. CI, configuration and secrets

`.github/workflows/playwright.yml` runs on every push and pull request (and manually): checkout, Node 20 with npm cache, `npm ci`, typecheck, install Chromium, run the tests, upload the HTML report and the traces/screenshots as artifacts (`if: !cancelled()`, so failed runs keep their evidence).

- **Configuration:** everything comes from environment variables, read in one file (`src/config/env.ts`). Locally they come from a git-ignored `.env`; `.env.example` documents the names.
- **Non-sensitive values** (`BASE_URL`, `API_URL`) are optional repository **variables**. The code has sensible defaults.
- **Sensitive values**, the credentials of the two test accounts (`EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`, `EVENTHUB_EMAIL_2`, `EVENTHUB_PASSWORD_2`), are repository **secrets** mapped to environment variables. Nothing is hardcoded and nothing is printed; tokens exist only in the git-ignored `.auth/` folder.
- **The accounts are disposable** test accounts used nowhere else, because the target is a shared public environment.
- **Forked pull requests** do not receive secrets, so the suite cannot authenticate there. That is intended.
- Retries: 1 in CI, 0 locally. Traces are captured on the first retry. Workers: 2 in CI, because the environment is shared.

## 5. Assumptions

- Login and registration are not part of US-114, so they are covered only as setup. Each account is registered automatically on first use (register is tried when login returns 400 or 404; if registering also fails, the setup reports that the password in `.env` is probably wrong).
- The Swagger `POST /events` body was inferred from a live call (it worked); events are created with a future date and a price under 1000, so the UI never shows a thousands separator.
- `GET /bookings` is assumed to return a recent user's bookings on the first page. I have not yet checked its paging parameters. This affects the cleanup lookup and the "appears in list" test only if a user accumulates many bookings.
- The confirmation card has no ids, so its rows are found by label text and the value is the element next to it (one XPath in `BookingConfirmation`). The booking form's total uses the row markup captured from the page.
- Event pages are opened directly by id (`/events/{id}`), which is the same id the API returns.
- Cleanup assumes the API allows deleting events created by the same user.

## 6. What I would do with more time

- Verify the confirmation-panel locators and add `data-testid` requests for the booking form.
- Cover the Events list and search, UI field validation messages, and the full keyboard and accessibility path of the booking form and the dialog.
- Add contract checks against the OpenAPI schema (and fix the doc gaps found here), and a second browser project.
- Test concurrency properly (two users racing for the last seat) once the PO defines the expected result.
- Inspect the 43 console errors on the confirmation page and fail tests on unexpected ones.
- Publish the HTML report to GitHub Pages and add a flaky-test dashboard.
- Move the two probe scripts into the repo as an `exploration/` folder, and retire the test accounts' leftover data with an admin cleanup job if the environment ever offers one.
