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
| 7 | **AC3 "My Bookings"** says nothing about ordering, paging, status, or what happens to a cancelled booking. `GET /bookings` is paged (10 per page by default) and the ordering is not specified. | Swagger (`PaginationMeta`, `page`, `limit`) |
| 8 | **AC4 says "cancel", the system hard-deletes.** After cancelling, the booking is gone (`GET` returns 404), so the `cancelled` status listed in the docs never appears, and there is no history or refund notion. The story also omits that seats are returned and that a confirmation dialog appears. | Live |
| 9 | **Capacity and dates are not covered:** sold-out behaviour, simultaneous bookings for the last seat, and bookings for events in the past. | Live (see 2.2) |
| 10 | **The story says nothing about how booking-form validation should present:** one error summary or one error per field, and whether leaving a field empty should behave like an invalid value or like a separate "required" state. Live, an empty field shows the exact same per-field error text as an invalid one, and all three show together when the whole form is left blank, but AC1/AC2 never say that is the intended behaviour. | Live: `tests/ui/booking.ui.spec.ts` ("form validation" describe block) |

### 2.2 Where the application does not match the story or the docs

| # | Mismatch | Evidence |
|---|---|---|
| A | **Booking reference format:** docs and service description say `EVT-XXXXXX`; the live API and UI produce `D-XXXXXX` (the prefix may depend on the event). | `D-YHE8Y3` (API), `D-OND4SL` (UI). Test: `docs-mismatch.api.spec.ts` |
| B | **`totalPrice` type:** docs example is a number, API returns a string. | Live. Test in `docs-mismatch.api.spec.ts` |
| C | **Swagger does not declare auth on the Bookings endpoints** (no lock icon), but they require a Bearer token. | Swagger vs live 401 |
| D | **Ownership responses are inconsistent and undocumented:** another user's booking gives **403** on `GET /bookings/{id}` and `GET /bookings/ref/{ref}`, but **404** on `DELETE`. The 403 also confirms that a booking exists, and ids are sequential. Neither code is in the docs. | Live, two users |
| E | **Past events can be booked, in the API and in the UI.** All three seeded events are dated April to October 2026; a booking on the 2026-10-20 event was accepted on 2026-11-11, and the UI shows a normal Book Now button for them. | Live |
| F | **Register docs promise an isolated sandbox** ("events and bookings are private to their account"), but new users all see the same seeded events (ids 283-285) with heavily drained seats (for example 8 of 500 left). Seeded events look shared. | Live, `GET /events` for fresh users |
| G | **`quantity: "2"` (string) is accepted** although the schema says integer. | Live. Test in `docs-mismatch.api.spec.ts` |
| H | **Phone rules are under-documented:** Swagger shows only `minLength: 10`; the API also rejects letters and accepts `+ - ( )` and spaces. The UI message says "Enter a valid 10-digit phone", yet a 12-character `+971...` number is accepted. | Live validation messages, UI |
| I | **Sold-out and "not enough seats" return 400**, the same code as field validation (409 is more usual), so they can only be told apart by message text. | Live |
| J | **Booking email need not match the account:** user B booked with user A's email address. Is a confirmation email sent there? | Live |
| K | **Docs copy/paste error:** the `500` example body reads "Resource not found" on every endpoint. | Swagger |
| L | **Login errors differ from the docs.** Swagger says an unknown email gives `404 "User not found"` and a wrong password `400 "Invalid credentials"`; a failed login for an unregistered account returned `400 "Invalid email or password"` (to be confirmed with a deliberate wrong-password and unknown-email pair). Wrong credentials and duplicate email both use 400 (401 / 409 are more usual). | Swagger vs live setup failure |
| M | **Docs list a `cancelled` status and a status filter, but `DELETE` removes the booking**, so the status can never be seen. Event `price` is a number in the docs and a string live. | Swagger vs live |
| N | **Undocumented "Clear all bookings" button** on My Bookings. It is not in the story or the docs, and it is destructive, so the tests never use it (the environment is shared). | UI |
| O | **UI:** the dialog's dismiss button is labelled "Cancel" in a *cancel booking* flow, which is easy to misread. The "View My Bookings" `<button>` sits inside an `<a>` (invalid HTML). The confirmation page logged 43 console errors (not investigated). | UI / DevTools |

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
    apiFixtures.ts           firstUser, secondUser, noUser (and the worker-scoped sessions fixture)
    dataFixtures.ts          customer, bookableEvent, almostSoldOutEvent, privateEvent
    pageFixtures.ts          loginPage, eventsPage, eventDetailsPage, myBookingsPage
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
- **Existing events first, own events only where unavoidable.** The story is about booking, not about managing events, so tests use the seeded events: `bookableEvent` is the first event with at least 10 seats, and `almostSoldOutEvent` is the seeded event with fewer than 10 seats (World Tech Summit, 8 seats), used for the "more tickets than seats left" cases in the UI and the API.
- **The one exception:** four seat-count tests (`bookings.seats.api.spec.ts`: booking reduces seats, cancel restores them, booking exactly the remaining seats, sold out). They need an event nobody else is booking in parallel, so they create a 10-seat event through the `privateEvent` fixture and delete it afterwards.
- **UI tests use no API in their flow.** They open Events, take the first card, read the price from the page and book through the form. The API is used only for login in setup and for cleanup.
- **Cleanup by customer email.** Every test gets a unique customer (`customer.<run>-<n>@example.com`). After the test, the fixture lists all bookings (paged, see assumptions) and cancels those with that email, even if the test failed. A cleanup problem is a warning, not a test failure. "Clear all bookings" is never used.
- **Layering:** clients and page objects contain no assertions; specs own all assertions. Money is compared as numbers (`parsePrice`), not strings.
- **Plain code over clever code.** Locators use ids, test ids, or button and heading names; `exact: true` only where one label sits inside another. The only regex-like check is the documented `EVT-` format test.
- **Known issues are executable.** `docs-mismatch.api.spec.ts` asserts what the docs promise and is marked `test.fail`, so CI stays green while the mismatch exists and goes red when it is fixed, which is the cue to promote the test.

**The 62 tests**

| Group | Count | Covers |
|---|---|---|
| setup | 3 | API reachable, both users logged in, UI login saved |
| `api/bookings.create` | 6 | confirmed booking and ref, total = price x quantity, fetch by id and by ref, listed |
| `api/bookings.validation` | 14 | quantity 0/1/10/11/negative/fractional, name 1/2 chars, email, phone rules, unknown event, more than seats left |
| `api/bookings.seats` | 4 | seats reduced, restored on cancel, exact remaining seats, sold out |
| `api/bookings.cancel` | 5 | cancel, gone afterwards, cancel twice, unknown id |
| `api/bookings.access` | 7 | 401 without token, other user gets 403/403/not listed/404 |
| `api/docs-mismatch` | 3 | ref format, `totalPrice` type, string quantity (all `test.fail`) |
| `ui/auth` | 2 | login form |
| `ui/booking` | 13 | stepper limits, live total, field errors (including empty form), confirmation, appears in My Bookings |
| `ui/cancel` | 3 | dialog text, keep booking, confirm cancel (also after reload) |
| `e2e/ui-api-consistency` | 2 | UI booking matches API; API booking shows in My Bookings |

Tests are independent of each other; the only ordering is the `setup` project that the others depend on.

**Deliberately not covered:** the Events list and search, admin pages, "Clear all bookings", cross-browser runs (Chromium only).

## 4. CI, configuration and secrets

`.github/workflows/playwright.yml` runs on every push and pull request (and manually): checkout, Node LTS with npm cache, `npm ci`, typecheck, install Chromium, run the tests, upload the HTML report (with traces and screenshots) as an artifact (`if: !cancelled()`, so failed runs keep their evidence).

- **Published report:** on `main`, a second job deploys the HTML report to GitHub Pages, also when tests fail. The site is public, so the trace files are removed from that copy first: traces record typed values and request headers (the test password and Bearer token). The full report with traces stays in the run's artifact. Pages must be set to *Settings → Pages → Source: GitHub Actions*.

- **Configuration:** everything comes from environment variables, read in one file (`src/config/env.ts`). Locally they come from a git-ignored `.env`; `.env.example` documents the names.
- **Non-sensitive values** (`BASE_URL`, `API_URL`) are optional repository **variables**; the code has defaults.
- **Sensitive values**, the credentials of the two test accounts (`EVENTHUB_EMAIL`, `EVENTHUB_PASSWORD`, `EVENTHUB_EMAIL_2`, `EVENTHUB_PASSWORD_2`), are repository **secrets** mapped to environment variables. Nothing is hardcoded or printed; tokens exist only in the git-ignored `.auth/` folder.
- **The accounts are disposable** and used nowhere else, because the target is a shared public environment.
- **Forked pull requests** do not receive secrets, so the suite cannot authenticate there. That is intended.
- Retries: 1 in CI, 0 locally. Traces on first retry. Workers: 2 in CI, because the environment is shared.

## 5. Assumptions (not all verified against the live site)

- Login and registration are not part of US-114, so they are covered only as setup. An account is registered automatically when login fails.
- `GET /bookings` is paged. The cleanup reads pages until an empty page; this **assumes a page past the last one returns an empty 200**, not an error (the helper fails loudly on any non-200).
- The first event card is bookable. The seeded events are shared and drain over time, so `bookableEvent` and the first card can run out; the fixture then fails with a clear message.
- `GET /events` is not paged.
- The "N seats left" text on an event card exists only while the event has fewer than 10 seats.
- Validation errors in the booking form appear after clicking Confirm Booking.
- The minus button label is the true minus sign (U+2212), as in the page markup.
- Confirmation rows are found by their label text and the last `span` in the row, which assumes the labels are unique on the card.
- Parallel runs share the same seeded events, so seat counts on them are only checked with tolerance-free logic where we own the booking (the `privateEvent` tests).
- Cleanup assumes the API lets a user delete events they created.

## 6. What I would do with more time

- Run against the live site in CI for a few weeks and track flakiness; fix any locator that does not match the real DOM.
- Ask for `data-testid` attributes on the booking form and the confirmation rows.
- Cover the Events list and search, and the keyboard and accessibility path of the form and the dialog.
- Contract checks against the OpenAPI schema, and a second browser project.
- Concurrency tests (two users racing for the last seat) once the PO defines the expected result.
- Inspect the 43 console errors on the confirmation page and fail tests on unexpected ones.
- Move the exploration probes into an `exploration/` folder.
