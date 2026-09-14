<?php
/**
 * Plugin Name:       20Twenty Cookie Consent
 * Plugin URI:        https://github.com/20Twenty-Design/wp-cookie-consent-plugin
 * Description:       Cookie consent banner with Google Consent Mode v2. Renders on classic WordPress sites and exposes its settings to headless front ends via REST and WPGraphQL.
 * Version:           1.0.1
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            20Twenty Design
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       20twenty-cookie-consent
 * Update URI:        https://github.com/20Twenty-Design/wp-cookie-consent-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TWCC_VERSION', '1.0.1' );
define( 'TWCC_FILE', __FILE__ );
define( 'TWCC_PATH', plugin_dir_path( __FILE__ ) );
define( 'TWCC_URL', plugin_dir_url( __FILE__ ) );

require_once TWCC_PATH . 'includes/class-settings.php';
require_once TWCC_PATH . 'includes/class-admin.php';
require_once TWCC_PATH . 'includes/class-frontend.php';
require_once TWCC_PATH . 'includes/class-rest.php';
require_once TWCC_PATH . 'includes/class-graphql.php';
require_once TWCC_PATH . 'includes/class-github-updater.php';
require_once TWCC_PATH . 'includes/class-plugin.php';

TwentyTwenty\CookieConsent\Plugin::instance()->boot();
