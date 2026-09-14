<?php
/**
 * Uninstall: remove cached update data only.
 *
 * The settings option is intentionally kept — it is shared with the legacy
 * plugin and reinstalling (e.g. from a fresh zip) should not wipe the copy.
 * Delete the `cookie_consent_settings` option manually to remove it for good.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_site_transient( 'twcc_github_release' );
