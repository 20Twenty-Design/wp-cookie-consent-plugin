# 20Twenty Cookie Consent

A cookie consent banner with **Google Consent Mode v2**. It works in two setups:

| Setup | What you use |
| --- | --- |
| **Classic WordPress site** | Install the plugin. The banner renders on its own. |
| **Headless site** (Next.js, React, Astro, Nuxt, …) | Install the plugin on the CMS and the `@twenty-twenty/cookie-consent` npm package on the front end. |

Both setups share one codebase, one stylesheet and one version number. A single git tag releases both:
the WordPress plugin updates from GitHub releases, and the npm package is published to [npmjs.com](https://www.npmjs.com/package/@twenty-twenty/cookie-consent).

```
.
├── src/                          TypeScript source (single source of truth)
│   ├── core/                     cookie, Consent Mode, settings, fetch — no framework
│   ├── vanilla/                  DOM banner (used by WordPress + non-React sites)
│   ├── react/                    ConsentProvider, CookieBanner, ManageConsentButton
│   ├── next/                     CookieConsent (RSC), ConsentModeScript, readServerConsent
│   ├── wp/                       browser bundles shipped inside the plugin
│   └── styles/consent.css
├── plugin/20twenty-cookie-consent/   WordPress plugin (PHP)
├── scripts/                      build, version sync, packaging
└── .github/workflows/            CI + release
```

---

## 1. Classic WordPress site

1. Download `20twenty-cookie-consent.zip` from the [latest release](https://github.com/20Twenty-Design/wp-cookie-consent-plugin/releases/latest).
2. In WordPress, go to **Plugins → Add New → Upload Plugin**, upload the zip and activate it.
3. Go to **Settings → Cookie Consent** and set the copy, mode, position and colours.

What you get:

- The Consent Mode default is printed as the first script in `<head>`. It works with gtag.js, GTM and Site Kit.
- The banner is rendered by JavaScript from the cookie, so full-page caching is safe.
- Visitors can reopen the banner through any of these:
  - the shortcode `[cookie_consent_manage]` (optional `label="…"` and `class="…"`)
  - a menu **Custom Link** with the URL `#cookie-settings`
  - any element with the `data-cc-open` attribute
  - `window.twentyCookieConsent.open()`
- To hold back non-Google trackers until consent, change their script type:
  ```html
  <script type="text/plain" data-cookie-consent src="https://example.com/pixel.js"></script>
  ```
- If the WP Consent API plugin is active, the plugin syncs with it, so Site Kit, WooCommerce and similar plugins follow the visitor's choice.

### Updates

Updates come from GitHub releases and show up on the normal **Dashboard → Updates** screen. Auto-updates and WP-CLI work too.
The plugin row also has a **Check for updates** link.

If the repository is **private**, each site needs a read-only token. Add it to `wp-config.php`:

```php
// Fine-grained PAT → Repository access: wp-cookie-consent-plugin → Permissions: Contents (read-only)
define( 'TWCC_GITHUB_TOKEN', 'github_pat_…' );
```

### PHP hooks

| Hook | Use |
| --- | --- |
| `twcc_render_banner` (filter) | Return `false` to hide the banner on some requests. |
| `twcc_boot_data` (filter) | Change the data passed to the front-end bundle. |
| `twcc_public_settings` (filter) | Change what REST, GraphQL and the JS bundle expose. |
| `twcc_settings_updated` (action) | Runs after settings are saved. Use it to purge caches or trigger headless revalidation. |
| `twcc_github_repository` / `twcc_github_token` (filters) | Point the updater at a fork, or supply the token from somewhere other than `wp-config.php`. |

---

## 2. Headless site

### WordPress side

Install the plugin on the CMS as described above. If WordPress should not render a banner itself, untick **Show banner**.
The settings are available at:

- REST: `GET https://cms.example.com/wp-json/20twenty-cookie-consent/v1/settings`. No extra plugin is needed.
- WPGraphQL (optional): the `cookieConsentSettings` field. It is compatible with the old plugin's query.

To share the decision between `cms.example.com` and `www.example.com`, set **Cookie domain** to `.example.com`.

### Install the package

The package is public on npmjs.com. No token or `.npmrc` is needed.

```bash
npm install @twenty-twenty/cookie-consent
npm update @twenty-twenty/cookie-consent   # pull new releases
```

#### Automatic update PRs (optional)

Add `.github/dependabot.yml` to the front-end repo. Dependabot opens a PR when a new version is released;
merge it and Vercel deploys.

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    allow:
      - dependency-name: "@twenty-twenty/cookie-consent"   # only this package
    cooldown:
      default-days: 3                                       # skip brand-new versions
    open-pull-requests-limit: 2
```

### Next.js (App Router) — drop-in

```tsx
// app/layout.tsx
import "@twenty-twenty/cookie-consent/styles.css";
import { CookieConsent } from "@twenty-twenty/cookie-consent/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Before your GA/GTM tag */}
        <CookieConsent wordpressUrl={process.env.WORDPRESS_URL} />
      </body>
    </html>
  );
}
```

`CookieConsent` is an async Server Component. It fetches the settings (cached as `revalidate: 3600, tags: ["cookie-consent"]`),
renders the Consent Mode default script and mounts the banner. If WordPress can't be reached, it falls back to the built-in defaults.

Props: `transport="graphql"`, `endpoint`, `settings` (skips the fetch when you already have the data), `fallbacks`,
`fetchInit`, `LinkComponent`, `className`, `disableGoogleConsent`, `unlockScripts`, `nonce`.

```tsx
// Use your own GraphQL client + router links
const data = await fetchGraphQL(COOKIE_CONSENT_GRAPHQL_QUERY);
<CookieConsent
  settings={data?.cookieConsentSettings}
  fallbacks={{ config: { mode: "opt-out" } }}
  LinkComponent={PolicyLink}
/>
```

Footer "manage" link. It works outside the provider:

```tsx
"use client";
import { ManageConsentButton } from "@twenty-twenty/cookie-consent/react";

<ManageConsentButton className="footer-link">Cookie settings</ManageConsentButton>;
```

Revalidate instantly when an editor saves. In WordPress:

```php
add_action( 'twcc_settings_updated', function () {
	wp_remote_post( 'https://www.example.com/api/revalidate', array(
		'body' => array( 'tag' => 'cookie-consent', 'secret' => REVALIDATE_SECRET ),
	) );
} );
```

### Next.js — build it yourself

```tsx
import { ConsentModeScript, fetchConsentSettings, resolveConsentSettings } from "@twenty-twenty/cookie-consent/next";
import { ConsentProvider, CookieBanner } from "@twenty-twenty/cookie-consent/react";

const raw = await fetchConsentSettings({ wordpressUrl, init: { next: { revalidate: 3600 } } });
const { config, content, position } = resolveConsentSettings(raw);

<>
  <ConsentModeScript config={config} />
  <ConsentProvider config={config} onChange={(s) => console.log(s)}>
    <CookieBanner content={content} position={position} />
  </ConsentProvider>
</>;
```

Inside the provider, `useConsent()` returns `{ state, decided, granted, bannerOpen, accept, reject, reopen }`.
If you'd rather render server-side consent state (which makes the route dynamic), use `readServerConsent(name, version)` from `@twenty-twenty/cookie-consent/next/server`.

### Any other framework (vanilla)

```ts
import "@twenty-twenty/cookie-consent/styles.css";
import { consentDefaultInlineScript, fetchConsentSettings, resolveConsentSettings } from "@twenty-twenty/cookie-consent";
import { createCookieConsent } from "@twenty-twenty/cookie-consent/vanilla";

// Server: put consentDefaultInlineScript(config) in an inline <script> in <head>, before Google tags.
// Browser:
const { config, content, position } = resolveConsentSettings(await fetchConsentSettings({ wordpressUrl }));
const consent = createCookieConsent({ config, content, position });
consent.open(); // accept(), reject(), getState(), isGranted(), destroy()
```

---

## Theming

The banner is styled entirely through CSS custom properties. Override them in `:root` or on a wrapper:

```css
:root {
  --cc-bg: #111114;
  --cc-fg: #fff;
  --cc-muted: rgba(255, 255, 255, 0.72);
  --cc-link: #fff;
  --cc-accent: #193eff;
  --cc-accent-fg: #fff;
  --cc-border: rgba(255, 255, 255, 0.12);
  --cc-border-strong: rgba(255, 255, 255, 0.28);
  --cc-radius: 14px;
  --cc-btn-radius: 999px;
  --cc-max-width: 1232px;
  --cc-box-width: 420px;
  --cc-offset: 16px;
  --cc-z: 99999;
  --cc-font: inherit;
}
```

Markup: `.cc-banner.cc-banner--{bar|box-left|box-right} > .cc-text (.cc-title, .cc-body > .cc-policy) + .cc-actions (.cc-btn--reject, .cc-btn--accept)`.

## Modes & versioning

- `opt-in` (EU/UK): tracking stays off until the visitor accepts.
- `opt-out` (US): tracking is on by default, and **Decline** turns it off.
- To re-prompt everyone, tick **Re-prompt visitors** in WordPress, or bump `config.version`.

Once a tracker blocked with `data-cookie-consent` has run, it can't be unloaded. If a visitor later declines, those scripts stay off from the next page load onwards.

---

## Development

```bash
npm install
npm run build        # dist/ (npm) + plugin/…/assets/dist (WordPress)
npm test             # vitest (jsdom)
npm run typecheck
npm run lint:php
npm run package:plugin   # build/20twenty-cookie-consent.zip
```

To try the plugin locally, run [WordPress Playground](https://wordpress.github.io/wordpress-playground/):

```bash
npm run build
npx @wp-playground/cli server --mount="$PWD/plugin/20twenty-cookie-consent:/wordpress/wp-content/plugins/20twenty-cookie-consent" --login
```

## Releasing

```bash
# 1. Add a "## [x.y.z]" section to CHANGELOG.md and commit it
# 2. Bump everywhere (package.json, plugin header, TWCC_VERSION, readme.txt), commit + tag:
npm version patch        # or minor / major / 1.4.0
# 3. Push — the Release workflow does the rest
git push --follow-tags
```

The **Release** workflow checks that every version matches the tag, then runs the tests and builds everything. It publishes a GitHub release
with `20twenty-cookie-consent.zip`, using the CHANGELOG section as release notes, and publishes the npm package to npmjs.com.

npm publishing uses [trusted publishing](https://docs.npmjs.com/trusted-publishers): GitHub Actions authenticates to npm directly,
so no npm token is stored anywhere and every version gets a provenance attestation linking it to its git tag.
Configured on npmjs.com → package → Settings → Trusted publisher (GitHub Actions, `20Twenty-Design/wp-cookie-consent-plugin`, workflow `release.yml`).
WordPress sites see the update within 12 hours, or right away via **Check for updates**. Front ends pick it up with `npm update`.

Tags with a pre-release suffix (`v1.2.0-beta.1`) become GitHub pre-releases, which WordPress ignores, and are published to npm under the `next` dist-tag.

## Migrating from the old setup

- **WordPress:** activate this plugin and delete "Cookie Consent Settings for WPGraphQL". The option name is the same, so saved copy carries over.
  The `cookieConsentSettings` GraphQL query keeps working and gains `cookieName`, `expiryDays`, `cookieDomain` and `position`.
- **Front end:** swap `@/cookie-consent/client` for `@twenty-twenty/cookie-consent/react` and `@/cookie-consent/server` for `@twenty-twenty/cookie-consent/next`.
  `CookieBanner` is now a named export, and CSS is imported once via `@twenty-twenty/cookie-consent/styles.css`.
