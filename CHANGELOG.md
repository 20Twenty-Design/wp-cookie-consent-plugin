# Changelog

All notable changes. One version covers both the WordPress plugin and the
`@twenty-twenty/cookie-consent` npm package. The section for a version is used
as its GitHub release notes (shown in the WordPress "View details" modal).

## [Unreleased]

## [1.2.0] - 2026-09-14

- Google Consent Mode v2 setting now applies to headless front ends (REST/GraphQL `googleConsentMode`);
  moved to the shared "Behaviour" section in WordPress. `disableGoogleConsent` still forces it off from code.
- `ManageConsentButton` shows the "Manage cookies" label from WordPress automatically (new `useManageLabel()` hook).

## [1.1.0] - 2026-09-14

- Appearance settings (position and colours) now apply to headless front ends too: exposed via REST and
  WPGraphQL (`colorBackground`, `colorText`, `colorAccent`, `colorAccentText`) and applied by the React,
  Next.js and vanilla banners as `--cc-*` variables. Empty colours keep the site's own CSS.
- Admin screen: "Appearance" (all sites) is separated from "WordPress front end only" switches.
- Fix: with a custom text colour, muted body text, borders and the Decline button hover are derived from it,
  so dark-on-light colour schemes stay readable.

## [1.0.1] - 2026-09-14

- npm package is now published to npmjs.com (public, no token needed) instead of GitHub Packages. Releases are staged and go live after approval on npmjs.com.

## [1.0.0] - 2026-09-14

- WordPress plugin: banner on classic sites, Google Consent Mode v2 default in `<head>`,
  opt-in/opt-out modes, re-prompt checkbox, colours and position, `[cookie_consent_manage]`
  shortcode, `#cookie-settings` menu links, script blocking via `data-cookie-consent`,
  WP Consent API support.
- REST endpoint `/wp-json/20twenty-cookie-consent/v1/settings` and WPGraphQL
  `cookieConsentSettings` field (WPGraphQL now optional).
- GitHub release updater (public or private repository).
- npm package: core, vanilla, React and Next.js entries sharing one stylesheet.
- Fix: Google Consent Mode updates are pushed as `arguments` (gtag.js ignores plain arrays).
