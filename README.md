# EventHub QA: US-114 "Book tickets for an event"

[![Playwright Tests](https://github.com/n0krashy/eventhub-playwright-ts/actions/workflows/playwright.yml/badge.svg)](https://github.com/n0krashy/eventhub-playwright-ts/actions/workflows/playwright.yml)

**Latest test report (main branch):** https://n0krashy.github.io/eventhub-playwright-ts/

Playwright + TypeScript framework covering the booking flow through the **UI and the REST API**, with a GitHub Actions pipeline.

> Built with AI assistance (as the brief allows). I explored the live API and UI myself and I can walk through every file.

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
| 2 | **The story has no preconditions.** Booking needs a logged-in user (row 1) and an event that is open for booking (future date, seats left). These belong in the story as preconditions, for example *"Given I am logged in and viewing an event that has seats available"*, so AC1 can rightly start at choosing the number of tickets. As written, it is not clear how the user reaches the form or which events can be booked. | UI walkthrough |
| 3 | **AC5 is unclear.** "The same works through the API using `POST /api/bookings`" names only the create endpoint, but "the same" covers AC1-AC4, which also need listing (`GET /bookings`) and cancelling (`DELETE /bookings/{id}`). It does not say which fields must match the UI, or what an API failure must look like. The Swagger docs fill most of this in. | Brief, Swagger |
| 4 | **Input rules are not in the story:** quantity 1-10, name at least 2 characters, phone at least 10 characters with digits and `+ - ( )` and spaces only, valid email. They exist only in code and Swagger. | Swagger + live validation errors |
| 5 | **AC2 has no currency or rounding rule.** The UI shows `$`; the API has no currency field. Money is returned as a **string** (`"300"`). The total is computed server-side and shown live in the UI before confirming. | Live responses, UI |
| 6 | **"Booking reference" is undefined:** format, uniqueness and whether it is emailed. | Live: `D-XXXXXX` |
| 7 | **AC3 "My Bookings"** says nothing about ordering, paging, status, or what happens to a cancelled booking. `GET /bookings` is paged (10 per page by default) and the ordering is not specified. | Swagger (`PaginationMeta`, `page`, `limit`) |
| 8 | **AC4 says "cancel", the system hard-deletes.** After cancelling, the booking is gone (`GET` returns 404), so the `cancelled` status listed in the docs never appears, and there is no history or refund notion. The story also omits that seats are returned and that a confirmation dialog appears. | Live |
| 9 | **Capacity and dates are not covered:** sold-out behaviour, simultaneous bookings for the last seat, and bookings for events in the past. | Live (see 2.2) |
| 10 | **The story says nothing about how booking-form validation should present:** one error summary or one error per field, and whether leaving a field empty should behave like an invalid value or like a separate "required" state. Live, an empty field shows the exact same per-field error text as an invalid one, and all three show together when the whole form is left blank, but AC1/AC2 never say that is the intended behaviour. | Live: `tests/ui/booking.ui.spec.ts` ("form validation" describe block) |
| 11 | **Who may delete an event is not stated** in the story or the docs. It matters for testing: the exact seat-count tests create their own event and must remove it afterwards, because the environment is shared. Live, a user can delete an event they created: `DELETE /events/{id}` returns 200 and the event is then gone (404). The cleanup relies on this; if a delete ever fails, it logs a warning and the event is left behind. | Live: create, delete, then `GET` returns 404 |

### 2.2 Where the application does not match the story or the docs

| # | Mismatch | Evidence |
|---|---|---|
| A | **Booking reference format:** the docs (booking schema and the `POST /bookings` description) say `EVT-XXXXXX`; the live API and UI produce the first letter of the event title as the prefix: `D-` for Dilli Diwali Mela, `W-` for World Tech Summit, `Q-` for a test event titled "QA Event ...". | `D-YHE8Y3` (API), `D-OND4SL` (UI), `W-QNE63L`, `Q-H42LO9`. Test: `docs-mismatch.api.spec.ts` |
| B | **`totalPrice` type:** docs example is a number, API returns a string. | Live. Test in `docs-mismatch.api.spec.ts` |
| C | **Swagger does not declare auth on the Bookings or Events endpoints** (no lock icon; only `GET /auth/me` has one), but they all require a Bearer token. | Swagger vs live 401 |
| D | **Ownership responses are inconsistent and undocumented:** another user's booking gives **403** on `GET /bookings/{id}` and `GET /bookings/ref/{ref}`, but **404** on `DELETE`. The 403 also confirms that a booking exists, and ids are sequential. Neither code is in the docs. | Live, two users |
| E | **Past events can be booked, in the API and in the UI.** All three seeded events are dated April to October 2026; a booking on the 2026-10-20 event was accepted on 2026-11-11, and the UI shows a normal Book Now button for them. | Live |
| F | **Register docs promise an isolated sandbox** ("events and bookings are private to their account"). The reality is a mix: every user sees the same seeded events (ids 283-285, marked `isStatic`) with heavily drained seats (for example 8 of 500 left), and those counts drop over time without any action of ours, so they are shared. Yet a user's own bookings lower only the seats that user sees: with 5 open bookings, account 1 saw 30 seats on event 285 while account 2 saw 35; after cancelling them both saw 35. Bookings themselves are private. | Live, `GET /events` with two accounts |
| G | **`quantity: "2"` (string) is accepted** although the schema says integer. | Live. Test in `docs-mismatch.api.spec.ts` |
| H | **Phone rules are under-documented:** Swagger shows only `minLength: 10`; the API also rejects letters and accepts `+ - ( )` and spaces. The UI message says "Enter a valid 10-digit phone", yet a 12-character `+971...` number is accepted. | Live validation messages, UI |
| I | **Sold-out and "not enough seats" return 400**, the same code as field validation (409 is more usual), so they can only be told apart by message text. | Live |
| J | **Booking email need not match the account:** user B booked with user A's email address. Is a confirmation email sent there? | Live |
| K | **Docs copy/paste error:** the `500` example body reads "Resource not found" on every endpoint. | Swagger |
| L | **Login errors differ from the docs.** Swagger says an unknown email gives `404 "User not found"` and a wrong password `400 "Invalid credentials"`; live, both an unknown email and a wrong password return `400 "Invalid email or password"`, so the client cannot tell them apart (good for security, but not what the docs say). Wrong credentials and duplicate email both use 400 (401 / 409 are more usual). | Swagger vs live setup failure |
| M | **Docs list a `cancelled` status and a status filter, but `DELETE` removes the booking**, so the status can never be seen. Event `price` is a number in the docs and a string live. | Swagger vs live |
| N | **Undocumented "Clear all bookings" button** on My Bookings. It is not in the story or the docs, and it is destructive, so the tests never use it (the environment is shared). | UI |
| O | **UI:** the dialog's dismiss button is labelled "Cancel" in a *cancel booking* flow, which is easy to misread. Some `<button>`s sit inside `<a>` tags (invalid HTML), for example "View My Bookings" on the confirmation card and "Add New Event" on the Events page. The cancel dialog has a button with no accessible name (probably the close icon). | UI / DOM |
| P | **The seat counter on the event page does not update after a booking.** After booking 2 of 10 seats, the event page still shows "10 / 10 seats" next to the confirmation, while the card on Events correctly shows "8 seats left!". | Live, own 10-seat event |

### 2.3 Questions I would ask the Product Owner

1. **Who can book?** Login is required today. Should the story state "logged-in user" as a precondition (and say "user" instead of "visitor")? Is registration in scope or a separate story?
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
  config/env.ts              all configuration + credentials (env vars only)
  api/
    context.ts               the ONLY place that attaches the Bearer token
    clients/                 AuthClient, EventsClient, BookingsClient (thin, typed, no assertions)
    models/                  one file per resource: common, auth, event, booking
    response.ts              ApiResponse + small helpers
  auth/session.ts            where setup stores tokens / browser state
  data/
    builders.ts              unique customer, booking and event inputs
    price.ts                 "$1,500" <-> 1500
  fixtures/
    apiFixtures.ts           firstUser, secondUser, noUser (worker-scoped; the only readers of the saved tokens)
    dataFixtures.ts          customer, bookableEvent, privateEvent, fiveSeatEvent
    pageFixtures.ts          eventsPage, eventDetailsPage, myBookingsPage
    index.ts                 merges the three above via mergeTests; every spec imports from here
    bookingHelpers.ts        createBooking, cancelBookingsOf (cleanup)
  ui/pages/                  LoginPage, EventsPage, EventDetailsPage, MyBookingsPage
                             (one class per page; areas such as the booking form, the
                             confirmation card and the cancel dialog are locator groups inside it)
tests/
  global.setup.ts            health check, sessions for both users, one real UI login
  api/  ui/  e2e/            specs (every test is an explicit `test(...)`, no loops generating tests)
```

**Decisions and why**

- **Playwright for both UI and API (TypeScript only).** One language, one runner, one report; UI and API tests share auth, config and fixtures. A second stack would double the tooling for a team growing this suite.
- **Authorization lives in the framework, never in tests.** `global.setup.ts` authenticates once per run. Fixtures give each test an authorised API client (`firstUser`), a second user (`secondUser`) and an anonymous one (`noUser`). UI tests start from a saved browser state obtained through one real UI login.
- **Login and registration are setup, not tests.** They are not part of US-114. If logging in with the credentials from `.env` does not return 200, setup treats the account as not existing yet and creates it through `POST /auth/register` with the same credentials. Any two new email/password pairs are therefore enough to run the suite. If registering fails too (for example a wrong password for an existing account, since the login error is the same for both, see 2.2 row L), setup stops with a message naming the account.
- **Existing events first, own events only where seats are counted.** The story is about booking, not about managing events, so most tests use the seeded events: `bookableEvent` is the first event with at least 10 seats, and the UI tests book the first card on Events.
- **The exception: tests that check exact seat numbers.** Other people book the seeded events at the same time, so their seat counts can change in the middle of a test. Seven tests therefore create their own event through the API and delete it afterwards: the five in `bookings.seats.api.spec.ts`, and two UI tests (the plus button stops at the seats left; the card's "seats left" drops after a booking). `privateEvent` has 10 seats; `fiveSeatEvent` has 5, fewer than the 10-ticket limit, so the seats left are what stops a bigger booking.
- **Events are created through the API, even for the UI tests.** Any user can create events in the UI ("Add New Event"), but creating events is not part of US-114: a broken event form should not fail a booking test, and the API is faster and more stable for setup. The booking itself is always done through the website.
- **UI tests use the API only for setup and cleanup.** They open Events, read the price from the page and book through the form. The API is used for the login in setup, for the two own events above, and for cleanup.
- **Cleanup by customer email.** Every test gets a unique customer (`customer.<run>-<n>@example.com`). After the test, the fixture lists all bookings (paged, see assumptions) and cancels those with that email, even if the test failed. A cleanup problem is a warning, not a test failure. "Clear all bookings" is never used.
- **Layering:** clients and page objects contain no assertions; specs own all assertions. Prices are read from the page as numbers (`parsePrice`), the expected total is computed as a number, and only then formatted back (`formatPrice`) to compare with the text on screen.
- **Plain code over clever code.** Locators prefer ids, test ids, and button and heading names; where the app offers none, they use the visible text (error messages, row labels) or the `.booking-ref` class. `exact: true` only where one label sits inside another. The only regex in a test is the documented `EVT-` format check.
- **Known issues are executable.** `docs-mismatch.api.spec.ts` asserts what the docs promise and is marked `test.fail`, so CI stays green while the mismatch exists and goes red when it is fixed, which is the cue to promote the test.

**The 62 tests**

| Group | Count | Covers |
|---|---|---|
| setup | 3 | API reachable, both users logged in, UI login saved |
| `api/bookings.create` | 6 | confirmed booking and ref, total = price x quantity, fetch by id and by ref, listed |
| `api/bookings.validation` | 13 | quantity 0/1/10/11/negative/fractional, name 1/2 chars, email, phone rules, unknown event |
| `api/bookings.seats` | 5 | more tickets than seats left, seats reduced, restored on cancel, exact remaining seats, sold out (own events) |
| `api/bookings.cancel` | 5 | cancel, gone afterwards, cancel twice, unknown id |
| `api/bookings.access` | 7 | 401 without token, other user gets 403/403/not listed/404 |
| `api/docs-mismatch` | 3 | ref format, `totalPrice` type, string quantity (all `test.fail`) |
| `ui/auth` | 1 | saved login state keeps the user logged in (the form itself is used by setup) |
| `ui/booking` | 14 | stepper limits (10 tickets, seats left), live total, field errors (including empty form), confirmation, seats left drop on the card, appears in My Bookings |
| `ui/cancel` | 3 | dialog text, keep booking, confirm cancel (also after reload) |
| `e2e/ui-api-consistency` | 2 | UI booking matches API; API booking shows in My Bookings |

Tests are independent of each other; the only ordering is the `setup` project that the others depend on.

**Why these tests, and why this many**

- **Every acceptance criterion is checked through the UI and through the API.** AC1-AC4 are what a user sees, so each has at least one UI test. AC5 says "the same works through the API", so AC1-AC4 are repeated through the API.
- **Most of the tests are API tests (39 of 59, not counting setup).** Rules such as quantity limits, field validation, seat counts and access control are enforced by the server. Checking them through the API is fast and stable, and it gives a clear failure message. Each one is an edge case of the same request, so it is cheap to add.
- **The UI tests check what only the UI can show:** the plus/minus stepper limits, the total updating live, the per-field error messages, the confirmation card, My Bookings and the cancel dialog. The UI tests do not repeat every validation rule. They check that an error is shown for each field, and the API tests check the exact rules.
- **Risk decided the edge cases.** The cases with the highest risk got the most tests: money (total = price x quantity), overbooking (seats left, sold out), cancelling (seats are returned and the booking is gone) and privacy (another user cannot read or cancel my booking).
- **Two e2e tests connect the two layers:** a booking made in the UI matches what the API returns, and a booking made through the API shows up in the UI.
- **Known bugs are kept as tests** (`docs-mismatch`), so they are tracked in the suite instead of being forgotten.
- **Eight tests are tagged `@smoke`:** the main path of each acceptance criterion, in the UI, through the API and one e2e test. They are a quick check after a deploy (`npm run test:smoke`).

**How to add to the framework**

- **A new API endpoint:** add the types to `src/api/models/<resource>.ts`, add a client in `src/api/clients/` (one method per endpoint, it returns `toApiResponse(...)`, no assertions) and register it in `createApiClients` (`src/api/clients/index.ts`). Every user fixture (`firstUser`, `secondUser`, `noUser`) then has it, already authorised.
- **A new page:** add a class in `src/ui/pages/` (locators and actions only) and a fixture for it in `src/fixtures/pageFixtures.ts`.
- **New test data:** add a builder in `src/data/builders.ts`. If the data needs cleanup, add a fixture in `src/fixtures/dataFixtures.ts` that removes it after `use(...)`, so a test can never forget to clean up.
- **A new spec:** put it in `tests/api`, `tests/ui` or `tests/e2e`. The Playwright projects pick it up by folder. Import `test` and `expect` from `src/fixtures`, never from `@playwright/test`.
- **A new environment:** set `BASE_URL` / `API_URL`. No code changes are needed.

**Deliberately not covered:** admin pages, "Clear all bookings", cross-browser runs (Chromium only).

## 4. CI, configuration and secrets

`.github/workflows/playwright.yml` runs on every push to any branch, and manually: checkout, Node LTS with npm cache, `npm ci`, typecheck, install Chromium, run the tests, upload the HTML report as an artifact (`if: !cancelled()`, so failed runs keep their evidence). The report has screenshots of failed tests and traces of retried tests.

- **Published report:** https://n0krashy.github.io/eventhub-playwright-ts/ (latest `main` run). On `main`, a second job deploys the HTML report to GitHub Pages, also when tests fail. The site is public, so the trace files are removed from that copy first: traces record typed values and request headers (the test password and Bearer token). The full report with traces stays in the run's artifact. Pages must be set to *Settings → Pages → Source: GitHub Actions*.

- **Configuration:** everything comes from environment variables, read in one file (`src/config/env.ts`). Locally they come from a git-ignored `.env`; `.env.example` documents the names.
- **Non-sensitive values** (`BASE_URL`, `API_URL`) are optional repository **variables**; the code has defaults.
- **Sensitive values**, the credentials of the two test accounts (`EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`, `EVENTHUB_EMAIL_2`, `EVENTHUB_PASSWORD_2`), are repository **secrets** mapped to environment variables. Nothing is hardcoded; passwords and tokens are never printed (a setup failure names the account email only). Tokens exist only in the git-ignored `.auth/` folder.
- **The accounts are disposable** and used nowhere else, because the target is a shared public environment.
- Retries: 1 in CI, 0 locally. Traces on first retry. Workers: 2 in CI, because the environment is shared.
- A test that fails and then passes on the retry is marked "flaky" in the report, and the run stays green. Flaky tests should be checked in the report, not ignored.

## 5. Assumptions

- The first event card is bookable. The seeded events are shared and drain over time (event 285 had 35 of 10,000 seats left). `bookableEvent` fails with a clear message when no event has 10 seats left; the UI tests have no such check and would fail on the booking itself.

## 6. What I would do with more time

- Run on a nightly schedule, and track flaky tests over a few weeks. The whole suite already passes against the live site in CI; the shared seed data (seats drained by other users) is the most likely cause of future flakiness.
- Ask for `data-testid` attributes on the booking form and the confirmation rows.
- Contract checks against the OpenAPI schema.
- Run the UI tests on WebKit as well (Safari and every iOS browser use it), then Firefox.
- Concurrency tests (two users racing for the last seat) once the PO defines the expected result.
- Listen to browser console errors in the UI tests and fail on unexpected ones (none were logged on the booking pages during the live check).
