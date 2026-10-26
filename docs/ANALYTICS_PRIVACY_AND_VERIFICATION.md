# V2 Google Analytics — transparent optional measurement

The original **TorMT/FolkNettside** uses public GA4 measurement ID
`G-BJ41MZJP0L`. V2 shares this ID, but **never** embeds V1's public Looker
statistics dashboard. Reports are accessible only through the owner's GA
account. A measurement ID is **not** an authentication credential.

## Three choices — do not misrepresent a refusal

The first-visit notice and Settings → Privacy & data offer **three** distinct choices.

| Choice | Saved value | Analytics cookies | Google Analytics connection / outgoing manual page views |
| --- | --- | --- | --- |
| **Full analytics** | `granted` | Allowed for GA (ads stay denied) | GA4 loads after the choice; coarse page views and manifest-verified public `course_code` and `course_semester` |
| **Limited — no analytics cookies** | `limited` | Denied | GA4 loads **after explicitly choosing limited**. Google Consent Mode sends cookieless signals; V2's manual events contain coarse public route groups **without course-level dimensions**. |
| **No statistics** | `denied` | Denied | On a fresh visit, **no Google Analytics script loads or events are sent**. If a tag was loaded earlier in the same document, V2 stops its own manual page views and sends a denied consent update; the already-executed third-party runtime cannot literally be unloaded without a full page reload. |

Until the person makes a choice (`unset`), there is **no Google Analytics
script request**. A returning user with a stored `granted` or `limited`
choice initializes that mode on page load. An existing stored `denied` value
continues to represent **no statistics** and is never silently converted
into `limited`. The selection is stored under
`folk.analytics.consent.v1` and remains editable in Privacy settings.

**Limited does not mean that Google receives no personal data.** Google may
receive IP address transiently as part of HTTP communication, user-agent and
other browser/device metadata even with `analytics_storage: "denied"`.
According to Google's documentation, no Google Analytics cookies are
read/written for those cookieless pings. It must **not** be described as
completely anonymous or as equivalent to opting out of measurement.

Official documentation:
- [Google consent mode — basic vs advanced](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Consent mode reference](https://support.google.com/analytics/answer/13802165)
- [Nkom: ekomloven §3-15 and consent](https://nkom.no/informasjonskapsler)

**Compliance prerequisite:** Cookie-free Google measurement still transmits
data to Google. Using it without cookie consent may require a documented
legitimate-interest/legal-basis assessment, transparency, processor
documentation and separate consideration under Norwegian ePrivacy law. The
three-button interface alone is **not** proof of legal compliance. Do not
represent this as a blanket permission to track people who declined
**all** statistics. If the legal assessment does not support cookieless
Google Analytics, disable the `limited` option and keep the fully consented
version only.

## Sanitized event boundaries

The only manual event is GA4 `page_view`, sent for approved top-level route
groups such as `#/engineering/cad`, `#/courses/course`,
`#/courses/viewer`. It never contains raw file paths, search terms, hash
parameters, document contents, uploaded names, identifiable page titles or
credentials.

- Private routes under `diverse/medisin`, `diverse/diving`,
  `diverse/dive-map`, `diverse/brewing`, `tools/vault` and
  `settings/connections` emit no manual events.
- **Full** mode alone can attach `course_code` and `course_semester`, and
  only when the public V2 content manifest explicitly lists the code.
- **Limited** mode does not attach those dimensions, even for valid courses.
- No ad storage, ad-user-data consent or ad-personalization consent is ever
  granted. `allow_google_signals` and personalization signals are off.
  `send_page_view:false` disables the default initial config event.
- The GA4 web stream's **Enhanced Measurement/history-change page views** may
  still require owner-side configuration. Verify these are not separately
  sending raw SPA URLs. Because V1 shares the same property, avoid globally
  disabling V1 features without owner review; a separate V2 stream is an option.

Visitor settings alter **future** manual page views; they do not retroactively
erase historical GA4 data or guarantee that a third-party JS runtime already
loaded earlier in that document sends no network requests after revocation.

## Owner acceptance steps

1. Fresh private session: open V2 DevTools → Network and confirm **no**
   `gtag/js`, `google-analytics.com` or GA page-view requests until a choice.
2. Select **No statistics**: confirm same network-silent state on reload and
   no page-view events on public-route navigation.
3. Select **Limited — no analytics cookies**: confirm exactly one Google tag
   script load, `analytics_storage=denied`, and coarse sanitized public
   `page_view` events without `course_code`. Inspect cookies and request
   parameters; do not assume Google never processes IP/device metadata.
4. Switch to **Full analytics**: confirm cookie consent update and
   manifest-verified public-course dimensions, without raw paths/files.
5. Navigate to MedisinTimer, Dive, Brewing and account settings: confirm no
   **manual** events on those routes. Inspect Network for any automatically
   measured raw URLs from stream-level Enhanced Measurement.
6. Switch to **No statistics** and reload: confirm no further tag loads or
   new Google Analytics events.
7. If authorized, check [Google Analytics Realtime/DebugView](https://analytics.google.com/analytics/web/)
   for V2 events. Live collection and modelled totals are **not verified by
   GitHub CI** and depend on GA4 processing and consent mode thresholds.

To distinguish V1 from V2 in GA4, use the published V2 route prefix and
the `site_version=v2` parameter. Add optional event-scoped custom
dimensions `site_version`, `site_area`, and in full mode
`course_code` and `course_semester` to the GA property as needed.

## Automated regressions

`tests/analytics-privacy.test.mjs` covers no initial requests, full refusal,
limited cookieless mode, full mode, course-dimension restrictions, private
route exclusion and revocation. The real Chrome
`tests/browser/settings-app-smoke.html` covers consent notice, no-network
fresh rejection and switching to cookie-free statistics inside Settings.

CI does **not** certify live GA4 receipt, browser-specific cookie handling,
privacy-law compliance or real device traffic. No new tracking endpoint, user
identifier, key, medical record or GA credential is created.
