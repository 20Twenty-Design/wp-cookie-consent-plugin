<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Wires the plugin together.
 */
final class Plugin {

	/** @var Plugin|null */
	private static $instance = null;

	public static function instance(): Plugin {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function boot(): void {
		( new GitHub_Updater( TWCC_FILE ) )->register();
		( new Rest() )->register();
		( new GraphQL() )->register();
		( new Frontend() )->register();

		if ( is_admin() ) {
			( new Admin() )->register();
		}

		add_action( 'admin_notices', array( $this, 'legacy_plugin_notice' ) );

		// Let consent-aware plugins (Site Kit, WooCommerce, …) know we speak the WP Consent API.
		add_filter( 'wp_consent_api_registered_' . plugin_basename( TWCC_FILE ), '__return_true' );
	}

	/**
	 * The predecessor "Cookie Consent Settings for WPGraphQL" plugin uses the
	 * same option and GraphQL type. Settings carry over; it just must not run
	 * alongside this one.
	 */
	public static function legacy_plugin_active(): bool {
		return function_exists( 'ccs_get_settings' );
	}

	public function legacy_plugin_notice(): void {
		if ( ! self::legacy_plugin_active() || ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__( '20Twenty Cookie Consent replaces the old "Cookie Consent Settings for WPGraphQL" plugin. Your saved settings are kept — please deactivate and delete the old plugin.', '20twenty-cookie-consent' )
		);
	}
}
