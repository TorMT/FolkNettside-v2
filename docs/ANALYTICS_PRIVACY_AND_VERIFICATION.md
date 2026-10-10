# V2 Google Analytics – shared GA4 measurement, private reporting

The original **TorMT/FolkNettside** uses Google Analytics 4 measurement ID
`G-BJ41MZJP0L`. The **V2 preview** uses the **same ID**, configured in
`index.html`. This is a public **measurement identifier**, not a secret,
private key, OAuth credential or access to the Analytics property.

The V1 homepage additionally embedded a publicly visible Looker Studio
report. **Do not copy that iframe to V2.** V2 has no visible visitor
statistics: results stay in the owner's existing Google Analytics account.

## Consent and data collection

- Google Analytics is **off by default**. The site displays an optional,
  compact **Allow analytics / No thanks** choice on first visit.
- Before explicit opt-in, no `gtag.js` tag is requested or page_view emitted.
- Choices are saved in the browser at `folk.analytics.consent.v1`.
  The current preference and toggle are in **Settings → Privacy & data**;
  consent may be revoked at any time. The website works without analytics.
- On acceptance, the GA4 script loads once and a manual page-view event is
  sent for each navigation to an approved V2 route. A repeated page-view
  at the same route is not sent twice.
- V2's outbound **manual events** use coarse, canonical categories
  (`#/engineering/cad`, `#/courses/course`, `#/courses/viewer`, etc.).
  They omit search terms, source filenames, detailed course routes,
  document contents and URL query strings.
- Potentially personal `diverse/medisin`, Dive, Brewing, Vault and Google
  account-settings routes are excluded from manual page-view reporting.
- Advertising storage, user data and personalization stay denied in Google
  Consent Mode. Google Signals and Google ad-personalization signals are
  disabled. User identities and Google Drive credentials are not sent as
  GA event parameters.
- GA4 remains a **third-party service**. Even with a sanitized page-view
  event, it can process browser/device data after consent. Do not describe
  GA4 collection as fully anonymous or claim it cannot process personal data.
- The site's default preview is under the GitHub Pages path
  `/FolkNettside-v2/`. V1 and V2 share a GA4 property; use that path and
  the optional `site_version=v2` event parameter to distinguish traffic.

**GA4 administration note:** Disable automatic/enhanced *page views on browser
history changes* for this shared data stream if they cause unfiltered SPA
route URLs to be collected. If the legacy V1 homepage relies on automatic
page views, changing stream-wide GA settings may affect V1; create a
separate GA4 web data stream instead if strict V2-only configuration is
needed. The application uses `send_page_view: false` and sends sanitized
manual page views with `page_referrer` blank.

## Check the connection (owner)

1. Open the V2 preview in a fresh browser/private window.
2. **Decline**: confirm there are no requests to
   `googletagmanager.com/gtag/js` or GA collect endpoints.
3. **Accept**: confirm one `gtag.js` request, then navigate between
   Courses, Engineering, Tools and CV. Inspect that outbound manual
   `page_view` events contain only category-like page paths.
4. In the owner's [Google Analytics](https://analytics.google.com/analytics/web/)
   **Realtime** or **DebugView**, check whether those events arrive in the
   existing property (allow for provider processing delays).
5. Optionally register event-scoped custom dimensions
   `site_version` and `site_area` in GA4 Admin → Custom definitions, so
   reports can distinguish V2 from V1 using those parameters.
6. Disable analytics under Settings → Privacy & data and verify no further
   manual page-view events are sent.

This repository can verify the tracking code, consent gating and static
deployment. **Live GA4 receipt is not confirmed by CI**: that requires access
to the owner's GA account and a consented, real browser session. Do not
claim the dashboard is receiving measurements until confirmed there.
