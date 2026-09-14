<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings storage, defaults and sanitisation.
 *
 * The option name is shared with the legacy "Cookie Consent Settings for
 * WPGraphQL" plugin so existing sites keep their copy when switching.
 */
final class Settings {

	const OPTION = 'cookie_consent_settings';
	const GROUP  = 'twcc_settings';

	const MODES     = array( 'opt-in', 'opt-out' );
	const POSITIONS = array( 'bar', 'box-left', 'box-right' );

	/**
	 * Defaults — also what REST/GraphQL return before anything is saved.
	 * Keep in sync with src/core/config.ts.
	 */
	public static function defaults(): array {
		return array(
			// Content.
			'bannerTitle'       => '',
			'bannerText'        => 'We use cookies to analyze traffic and improve your experience.',
			'acceptLabel'       => 'Accept',
			'rejectLabel'       => 'Decline',
			'policyUrl'         => '',
			'policyLabel'       => 'Privacy Policy',
			'manageLabel'       => 'Cookie settings',
			// Behaviour.
			'mode'              => 'opt-in',
			'version'           => 1,
			'cookieName'        => 'cookie_consent',
			'expiryDays'        => 365,
			'cookieDomain'      => '',
			// WordPress front end.
			'renderBanner'      => true,
			'googleConsentMode' => true,
			'loadStyles'        => true,
			'position'          => 'bar',
			'colorBackground'   => '',
			'colorText'         => '',
			'colorAccent'       => '',
			'colorAccentText'   => '',
		);
	}

	/**
	 * Saved settings merged over defaults, with types normalised.
	 */
	public static function get(): array {
		$saved = get_option( self::OPTION, array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}
		$s = array_merge( self::defaults(), $saved );

		$s['version']           = max( 1, (int) $s['version'] );
		$s['expiryDays']        = max( 1, (int) $s['expiryDays'] );
		$s['renderBanner']      = (bool) $s['renderBanner'];
		$s['googleConsentMode'] = (bool) $s['googleConsentMode'];
		$s['loadStyles']        = (bool) $s['loadStyles'];

		return $s;
	}

	/**
	 * Fields exposed publicly (REST, GraphQL, front-end JS). Matches the
	 * `WpConsentSettings` type in the npm package.
	 */
	public static function public_payload(): array {
		$s = self::get();

		$payload = array(
			'bannerTitle'  => (string) $s['bannerTitle'],
			'bannerText'   => (string) $s['bannerText'],
			'acceptLabel'  => (string) $s['acceptLabel'],
			'rejectLabel'  => (string) $s['rejectLabel'],
			'policyUrl'    => (string) $s['policyUrl'],
			'policyLabel'  => (string) $s['policyLabel'],
			'manageLabel'  => (string) $s['manageLabel'],
			'mode'         => (string) $s['mode'],
			'version'      => (int) $s['version'],
			'cookieName'   => (string) $s['cookieName'],
			'expiryDays'   => (int) $s['expiryDays'],
			'cookieDomain' => (string) $s['cookieDomain'],
			'position'     => (string) $s['position'],
			'googleConsentMode' => (bool) $s['googleConsentMode'],
			// Appearance — empty string means "use the site's own CSS".
			'colorBackground' => (string) sanitize_hex_color( $s['colorBackground'] ),
			'colorText'       => (string) sanitize_hex_color( $s['colorText'] ),
			'colorAccent'     => (string) sanitize_hex_color( $s['colorAccent'] ),
			'colorAccentText' => (string) sanitize_hex_color( $s['colorAccentText'] ),
		);

		/**
		 * Filter the settings exposed to front ends (REST, GraphQL, WordPress JS).
		 *
		 * @param array $payload Public settings.
		 */
		return apply_filters( 'twcc_public_settings', $payload );
	}

	/**
	 * Colour settings as banner CSS custom properties. Mirrors
	 * themeToCssVars() in src/core/theme.ts. Secondary tones (muted body text,
	 * borders, hover) are derived from the text colour so a light background
	 * with dark text stays readable.
	 *
	 * @return array<string,string> e.g. [ '--cc-bg' => '#ffffff' ]
	 */
	public static function css_vars( array $s ): array {
		$vars = array();

		$bg = sanitize_hex_color( $s['colorBackground'] ?? '' );
		if ( $bg ) {
			$vars['--cc-bg'] = $bg;
		}

		$text = sanitize_hex_color( $s['colorText'] ?? '' );
		if ( $text ) {
			$vars['--cc-fg']            = $text;
			$vars['--cc-link']          = $text;
			$vars['--cc-muted']         = 'color-mix(in srgb, ' . $text . ' 72%, transparent)';
			$vars['--cc-border']        = 'color-mix(in srgb, ' . $text . ' 12%, transparent)';
			$vars['--cc-border-strong'] = 'color-mix(in srgb, ' . $text . ' 28%, transparent)';
			$vars['--cc-reject-hover']  = 'color-mix(in srgb, ' . $text . ' 8%, transparent)';
		}

		$accent = sanitize_hex_color( $s['colorAccent'] ?? '' );
		if ( $accent ) {
			$vars['--cc-accent'] = $accent;
		}

		$accent_text = sanitize_hex_color( $s['colorAccentText'] ?? '' );
		if ( $accent_text ) {
			$vars['--cc-accent-fg'] = $accent_text;
		}

		return $vars;
	}

	/**
	 * @param mixed $input Raw form input.
	 */
	public static function sanitize( $input ): array {
		// options.php has already unslashed $_POST.
		$d       = self::defaults();
		$current = self::get();
		$in      = is_array( $input ) ? $input : array();
		$out     = array();

		foreach ( array( 'bannerTitle', 'acceptLabel', 'rejectLabel', 'policyLabel', 'manageLabel' ) as $key ) {
			$out[ $key ] = sanitize_text_field( (string) ( $in[ $key ] ?? $d[ $key ] ) );
		}
		$out['bannerText'] = sanitize_textarea_field( (string) ( $in['bannerText'] ?? $d['bannerText'] ) );
		$out['policyUrl']  = self::sanitize_url( (string) ( $in['policyUrl'] ?? '' ) );

		$out['mode']     = in_array( $in['mode'] ?? '', self::MODES, true ) ? $in['mode'] : $d['mode'];
		$out['position'] = in_array( $in['position'] ?? '', self::POSITIONS, true ) ? $in['position'] : $d['position'];

		$cookie_name       = preg_replace( '/[^A-Za-z0-9_\-]/', '', (string) ( $in['cookieName'] ?? '' ) );
		$out['cookieName'] = '' !== $cookie_name ? $cookie_name : $d['cookieName'];

		$out['expiryDays'] = min( 3650, max( 1, (int) ( $in['expiryDays'] ?? $d['expiryDays'] ) ) );

		$out['cookieDomain'] = strtolower( preg_replace( '/[^A-Za-z0-9.\-]/', '', (string) ( $in['cookieDomain'] ?? '' ) ) );

		foreach ( array( 'renderBanner', 'googleConsentMode', 'loadStyles' ) as $key ) {
			$out[ $key ] = ! empty( $in[ $key ] );
		}

		foreach ( array( 'colorBackground', 'colorText', 'colorAccent', 'colorAccentText' ) as $key ) {
			$out[ $key ] = (string) sanitize_hex_color( $in[ $key ] ?? '' );
		}

		// The version is never edited by hand: it only goes up when the editor
		// ticks "re-prompt visitors". Taking the max with any incoming version
		// keeps the bump when WordPress runs this callback twice on first save
		// (add_option re-sanitises the already-sanitised value).
		$version        = max( 1, (int) $current['version'], (int) ( $in['version'] ?? 0 ) );
		$out['version'] = $version + ( empty( $in['bump'] ) ? 0 : 1 );

		return $out;
	}

	/**
	 * Accepts absolute http(s) URLs and site-relative paths ("/privacy-policy").
	 */
	private static function sanitize_url( string $url ): string {
		$url = trim( $url );
		return '' === $url ? '' : esc_url_raw( $url, array( 'http', 'https' ) );
	}
}
