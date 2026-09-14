<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WPGraphQL: `cookieConsentSettings` root field. The graphql_register_types
 * action only fires when WPGraphQL is active, so this is inherently optional.
 */
final class GraphQL {

	public function register(): void {
		add_action( 'graphql_register_types', array( $this, 'register_types' ) );
	}

	public function register_types(): void {
		// The legacy plugin registers the same type/field; don't collide.
		if ( Plugin::legacy_plugin_active() ) {
			return;
		}

		register_graphql_object_type(
			'CookieConsentSettings',
			array(
				'description' => __( 'Cookie consent banner settings', '20twenty-cookie-consent' ),
				'fields'      => array(
					'bannerTitle'  => array( 'type' => 'String' ),
					'bannerText'   => array( 'type' => 'String' ),
					'acceptLabel'  => array( 'type' => 'String' ),
					'rejectLabel'  => array( 'type' => 'String' ),
					'policyUrl'    => array( 'type' => 'String' ),
					'policyLabel'  => array( 'type' => 'String' ),
					'manageLabel'  => array( 'type' => 'String' ),
					'mode'         => array(
						'type'        => 'String',
						'description' => '"opt-in" or "opt-out"',
					),
					'version'      => array(
						'type'        => 'Int',
						'description' => 'Consent version. Stored decisions with another version are ignored.',
					),
					'cookieName'   => array( 'type' => 'String' ),
					'expiryDays'   => array( 'type' => 'Int' ),
					'cookieDomain' => array( 'type' => 'String' ),
					'position'     => array(
						'type'        => 'String',
						'description' => '"bar", "box-left" or "box-right"',
					),
					'colorBackground' => array(
						'type'        => 'String',
						'description' => 'Hex colour, empty = site default',
					),
					'colorText'       => array(
						'type'        => 'String',
						'description' => 'Hex colour, empty = site default',
					),
					'colorAccent'     => array(
						'type'        => 'String',
						'description' => 'Hex colour, empty = site default',
					),
					'colorAccentText' => array(
						'type'        => 'String',
						'description' => 'Hex colour, empty = site default',
					),
				),
			)
		);

		register_graphql_field(
			'RootQuery',
			'cookieConsentSettings',
			array(
				'type'        => 'CookieConsentSettings',
				'description' => __( 'Global cookie consent settings', '20twenty-cookie-consent' ),
				'resolve'     => static function () {
					return Settings::public_payload();
				},
			)
		);
	}
}
