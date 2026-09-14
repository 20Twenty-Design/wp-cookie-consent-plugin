# Changelog

All notable changes. One version covers both the WordPress plugin and the
`@20twenty/cookie-consent` npm package. The section for a version is used
as its GitHub release notes (shown in the WordPress "View details" modal).

## [Unreleased]

- npm package is now published to npmjs.com (public, no token needed) with provenance, instead of GitHub Packages.

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
