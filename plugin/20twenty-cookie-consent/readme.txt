=== 20Twenty Cookie Consent ===
Contributors: 20twentydesign
Tags: cookie consent, gdpr, ccpa, consent mode, headless
Requires at least: 6.3
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Cookie consent banner with Google Consent Mode v2 for classic and headless WordPress sites.

== Description ==

* Lightweight banner (no jQuery, ~4 KB) rendered in the browser — fully page-cache safe.
* Google Consent Mode v2 default printed first in <head>; updates on every choice.
* Opt-in (EU/UK) or opt-out (US) mode, re-prompt everyone with one checkbox.
* Blocks any other tracker until consent: `<script type="text/plain" data-cookie-consent>`.
* WP Consent API support (Site Kit, WooCommerce, …).
* Headless: settings at `/wp-json/20twenty-cookie-consent/v1/settings` and the WPGraphQL `cookieConsentSettings` field, consumed by the `@20twenty/cookie-consent` npm package.
* Updates straight from GitHub releases.

Reopen the banner with the `[cookie_consent_manage]` shortcode, a menu link to `#cookie-settings`, or any element with `data-cc-open`.

== Installation ==

1. Download `20twenty-cookie-consent.zip` from the latest GitHub release.
2. Plugins → Add New → Upload Plugin, then activate.
3. Configure under Settings → Cookie Consent.

Private repository? Add `define( 'TWCC_GITHUB_TOKEN', 'github_pat_…' );` to wp-config.php so updates can be fetched.

== Changelog ==

See https://github.com/20Twenty-Design/wp-cookie-consent-plugin/releases
