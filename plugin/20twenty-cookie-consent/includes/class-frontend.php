<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Banner output on classic (non-headless) WordPress sites.
 *
 * Everything is decided in the browser from the consent cookie, so pages stay
 * fully cacheable — PHP never reads the cookie.
 */
final class Frontend {

	const HANDLE = 'twenty-cookie-consent';

	public function register(): void {
		add_action( 'wp_head', array( $this, 'print_head_script' ), 1 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ) );
		add_shortcode( 'cookie_consent_manage', array( $this, 'manage_shortcode' ) );
	}

	private function enabled(): bool {
		$settings = Settings::get();

		/**
		 * Whether WordPress renders the banner on this request.
		 *
		 * @param bool  $enabled  From the "Show banner" setting.
		 * @param array $settings All settings.
		 */
		return (bool) apply_filters( 'twcc_render_banner', $settings['renderBanner'], $settings );
	}

	/**
	 * Data handed to the front-end bundle as window.TwentyCookieConsent.
	 */
	private function boot_data(): array {
		$s = Settings::get();
		$p = Settings::public_payload();

		$config = array(
			'cookieName' => $p['cookieName'],
			'mode'       => $p['mode'],
			'version'    => $p['version'],
			'expiryDays' => $p['expiryDays'],
		);
		if ( '' !== $p['cookieDomain'] ) {
			$config['cookieDomain'] = $p['cookieDomain'];
		}

		$content = array(
			'body'        => '' !== trim( $p['bannerText'] ) ? $p['bannerText'] : Settings::defaults()['bannerText'],
			'acceptLabel' => '' !== trim( $p['acceptLabel'] ) ? $p['acceptLabel'] : Settings::defaults()['acceptLabel'],
			'rejectLabel' => '' !== trim( $p['rejectLabel'] ) ? $p['rejectLabel'] : Settings::defaults()['rejectLabel'],
		);
		foreach ( array(
			'title'       => 'bannerTitle',
			'policyLabel' => 'policyLabel',
			'manageLabel' => 'manageLabel',
		) as $js_key => $key ) {
			if ( '' !== trim( $p[ $key ] ) ) {
				$content[ $js_key ] = $p[ $key ];
			}
		}
		if ( '' !== $p['policyUrl'] ) {
			$content['policyUrl'] = $p['policyUrl'];
		}

		$data = array(
			'config'        => $config,
			'content'       => $content,
			'position'      => $p['position'],
			'googleConsent' => (bool) $s['googleConsentMode'],
			'wpConsentApi'  => function_exists( 'wp_has_consent' ),
		);

		/**
		 * Filter the boot data for the WordPress front-end banner.
		 *
		 * @param array $data
		 */
		return apply_filters( 'twcc_boot_data', $data );
	}

	/**
	 * Boot data + Consent Mode default, inlined as the very first script in
	 * <head> so Google tags loaded later see the default.
	 */
	public function print_head_script(): void {
		if ( ! $this->enabled() ) {
			return;
		}

		$default_file = TWCC_PATH . 'assets/dist/consent-default.js';
		$default_js   = is_readable( $default_file ) ? (string) file_get_contents( $default_file ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		$js = 'window.TwentyCookieConsent=' . wp_json_encode( $this->boot_data(), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ';' . $default_js;

		wp_print_inline_script_tag(
			$js,
			array(
				'id'                => 'twenty-cookie-consent-default',
				// Keep optimisation plugins (Rocket Loader, WP Rocket, LiteSpeed,
				// Autoptimize) from deferring the consent default.
				'data-cfasync'      => 'false',
				'data-no-optimize'  => '1',
				'data-no-defer'     => '1',
				'data-no-minify'    => '1',
				'data-pagespeed-no-defer' => '',
			)
		);
	}

	public function enqueue(): void {
		if ( ! $this->enabled() ) {
			return;
		}

		$s = Settings::get();

		$js = 'assets/dist/cookie-consent.js';
		if ( is_readable( TWCC_PATH . $js ) ) {
			wp_enqueue_script(
				self::HANDLE,
				TWCC_URL . $js,
				array(),
				TWCC_VERSION,
				array(
					'in_footer' => true,
					'strategy'  => 'defer',
				)
			);
		}

		$css = 'assets/dist/cookie-consent.css';
		if ( $s['loadStyles'] && is_readable( TWCC_PATH . $css ) ) {
			wp_enqueue_style( self::HANDLE, TWCC_URL . $css, array(), TWCC_VERSION );
			$vars = $this->css_vars( $s );
			if ( '' !== $vars ) {
				wp_add_inline_style( self::HANDLE, ':root{' . $vars . '}' );
			}
		}
	}

	private function css_vars( array $s ): string {
		$map = array(
			'colorBackground' => '--cc-bg',
			'colorText'       => '--cc-fg',
			'colorAccent'     => '--cc-accent',
			'colorAccentText' => '--cc-accent-fg',
		);
		$out = '';
		foreach ( $map as $key => $var ) {
			$color = sanitize_hex_color( $s[ $key ] );
			if ( $color ) {
				$out .= $var . ':' . $color . ';';
				if ( 'colorText' === $key ) {
					$out .= '--cc-link:' . $color . ';';
				}
			}
		}
		return $out;
	}

	/**
	 * [cookie_consent_manage label="Cookie settings" class="my-class"]
	 *
	 * @param array|string $atts
	 */
	public function manage_shortcode( $atts ): string {
		$settings = Settings::get();
		$atts     = shortcode_atts(
			array(
				'label' => '' !== trim( $settings['manageLabel'] ) ? $settings['manageLabel'] : Settings::defaults()['manageLabel'],
				'class' => '',
			),
			$atts,
			'cookie_consent_manage'
		);

		return sprintf(
			'<button type="button" class="%s" data-cc-open>%s</button>',
			esc_attr( trim( 'cc-manage ' . $atts['class'] ) ),
			esc_html( $atts['label'] )
		);
	}
}
