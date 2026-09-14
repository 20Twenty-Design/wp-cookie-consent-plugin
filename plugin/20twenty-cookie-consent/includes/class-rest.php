<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * GET /wp-json/20twenty-cookie-consent/v1/settings — public banner settings for
 * headless front ends. No WPGraphQL required.
 */
final class Rest {

	const REST_NAMESPACE = '20twenty-cookie-consent/v1';
	const ROUTE     = '/settings';

	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'routes' ) );
	}

	public function routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public function get_settings(): \WP_REST_Response {
		$response = new \WP_REST_Response( Settings::public_payload() );
		$response->header( 'Cache-Control', 'public, max-age=300' );
		return $response;
	}
}
