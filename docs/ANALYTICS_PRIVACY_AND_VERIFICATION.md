# V2 Google Analytics – shared GA4 measurement, private reporting

The original **TorMT/FolkNettside** uses Google Analytics 4 measurement ID
`G-BJ41MZJP0L`. The **V2 preview** uses the **same ID**, configured in
`index.html`. This is a public **measurement identifier**, not a secret,
private key, OAuth credential or access to the Analytics property.

The V1 homepage additionally embedded a publicly visible Looker Studio
report. **Do not copy that iframe to V2.** V2 has no visible visitor
statistics: results stay in the owner's existing Google Analytics account.

## Consent and data collection

- GA4 **measurement is off by default**. The external Google tag library loads on entry with analytics consent denied. The site displays an optional,
  compact **Allow analytics / No thanks** choice on first visit.
- **Before opt-in, `gtag.js` is requested from Google.** Analytics consent is defaulted to `denied` before the request; GA4 configuration and manual page views do not occur until opt-in. Loading a third-party script itself discloses connection metadata, potentially including an IP address.
- Choices are saved in the browser at `folk.analytics.consent.v1`.
  The current preference and toggle are in **Settings → Privacy & data**;
  consent may be revoked at any time. The website works without analytics.
- On acceptance, the already-loaded GA4 tag is configured and a manual page-view event is
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
2. **Before choosing or on Decline**: confirm that `gtag.js` may load, but no consented GA4 `config` or manual `page_view` events are generated. Google Consent Mode might send cookieless signals depending on Google's implementation.
3. **Accept**: confirm one preloaded `gtag.js` request and a GA4 configuration, then navigate between
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

**Compliance note:** A third-party tag loaded before consent is not network-silent. Check the use of advanced Consent Mode against Norwegian/EU ePrivacy and GDPR obligations, including notice and processor documentation. A stricter configuration would defer loading Google code until a visitor opts in.
