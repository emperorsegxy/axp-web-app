# Mortgage App Document Verification

_Started 2026-09-02 12:20 UTC_

---

## User

Design Prompt: Mortgage App — Onboarding & KYC (Borrower + Admin)

Design a document verification flow for a Nigerian mortgage application platform (AXP). Two connected experiences: borrower self-serve upload, and internal admin review queue.

Borrower flow (mobile-first, responsive web):

Identity Document — ID type selector (International Passport / Driver's Licence / National ID as radio/segmented control), file upload zone (drag-drop desktop, camera/gallery picker mobile), ID number text field, upload preview thumbnail with remove/replace option. Progress indicator showing "Step 1 of 3."
Supporting Documents — Two upload zones stacked: Work/Staff ID and Proof of Address, each with type hints (accepted formats, example of a valid document). Same upload/preview pattern as Screen 1. "Step 2 of 3."
Review & Submit — Card-based summary of all 3 uploaded documents with thumbnails, edit pencil icon per item to jump back, terms/consent checkbox, submit CTA. "Step 3 of 3."
Status screen (shown on repeat visits) — Single status card with state-based styling:
Pending: neutral/blue, "Under review, we'll notify you"
Needs correction: amber/warning, specific document flagged + admin's correction note + re-upload CTA
Approved: green, checkmark, "Continue to next step" CTA
Rejected: red, reason shown, support contact CTA

Admin flow (desktop-first, internal tool):

KYC Queue — Data table with columns: Applicant name, submitted date, status badge (color-coded per state above), risk flag icon (if any), assigned reviewer. Filter bar above table (status dropdown, date range, risk toggle). Sortable column headers. Row click opens detail view.
Request Detail — Split layout: left panel shows applicant's 3 documents as viewable/zoomable images stacked vertically with labels; right panel shows applicant metadata (name, ID number entered, submission date) and action panel with three buttons (Approve / Needs Correction / Reject), each opening a reason/note field before confirming. State change updates the queue in real time.

Visual direction: Clean, trustworthy, minimal — this is a financial compliance flow, not a marketing screen. Vuetify Material Design as the base system. Status colors should be immediately scannable at a glance in both the queue table and borrower status card. Generous whitespace on upload zones to reduce anxiety around a high-stakes task.

We are only focusing on the user for now

design guide

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

Borrower KYC flow, mobile-first on the AXP navy/gold system: Step 1 identity (ID type segmented control, real file picker with drag-drop and live preview, ID number field that relabels per type), Step 2 stacked supporting-doc zones with format hints, Step 3 summary cards with edit-jump and consent, plus all four status states.

Two notes: uploads use your actual chosen files for previews, so PDFs show as an empty thumbnail — worth adding a doc glyph if you want that case covered. The dark "Preview" panel bottom-right is a prototype control (toggleable in tweaks), not part of the UI. Admin queue is untouched per your note.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

Now the switcher: collapse it to a small pill at bottom-left that expands on tap.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Both fixed: thumbnails now paint via a resolved background-image (no unresolved-URL fetches), and the prototype switcher is a collapsed pill at bottom-left that expands only on tap.

## User

where is the onboard screen?

## Assistant

There isn't one — the brief's borrower flow started at Step 1 (Identity document), so what's built is the three upload steps plus the four status states. No intro/welcome screen exists yet.

Want me to add one before Step 1? It would sit outside the "Step X of 3" counter and cover: what the three documents are, how long review takes, and a single "Start verification" CTA. Say the word and I'll add it to the same file.

## User

using the same design system, let's design the onboarding flow for this mortgage app. sign up, sign in, forgot password and the rest

## Assistant



## Assistant

_[tool: read_file]_

_[tool: ask_user]_

Form's up — mainly need to know what an account signs up with (phone vs email), which screens to include, and whether you want one prototype or a canvas of all screens. Submit as-is and I'll pick sensible defaults.

## User

Answered — primary_credential: Email address; verification: 6-digit code by email; screens: Sign up, OTP verification, Sign in, Forgot password, Reset password; social: Google; intro_style: option_1; returning: Sign in screen; presentation: One interactive prototype

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

`Auth.dc.html` — five connected screens on the same navy/gold system, split layout that stacks on mobile:

Sign in (email + password, show/hide, keep-signed-in, Google, error state), Sign up (name, email, password with live strength meter, terms gate), Email code (6 boxes with auto-advance, 45s resend countdown), Forgot password (with the standard "we don't confirm whether an email is registered" line), Reset password (strength + match validation), and a success screen that hands off to identity verification.

Everything gates properly — CTAs stay disabled until valid. Two prototype shortcuts: password `wrong` triggers the sign-in error, code `000000` triggers the invalid-code state. The left panel has a placeholder where brand imagery goes; I can't generate that image, so send one over if you have it.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Fixed: the form column now renders first in the DOM, so narrow and mobile viewports land directly on the fields with the brand panel below; the split engages around 840px and the panel's imagery box and headline scale down when stacked. Switcher pill moved to bottom-right, clear of the footer line.

