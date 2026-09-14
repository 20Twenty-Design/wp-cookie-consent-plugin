<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Delivers plugin updates from GitHub releases through the normal WordPress
 * update UI (Dashboard → Updates, Plugins screen, auto-updates, WP-CLI).
 *
 * How it works:
 * - The plugin header's `Update URI: https://github.com/…` makes WordPress
 *   skip wordpress.org and call the `update_plugins_github.com` filter.
 * - We answer with the latest *published, non-prerelease* GitHub release whose
 *   assets include `20twenty-cookie-consent.zip` (built by the release workflow).
 * - Private repositories: define TWCC_GITHUB_TOKEN in wp-config.php (a
 *   fine-grained token with read-only "Contents" access to the repo).
 */
final class GitHub_Updater {

	const REPOSITORY = '20Twenty-Design/wp-cookie-consent-plugin';
	const ASSET_NAME = '20twenty-cookie-consent.zip';
	const CACHE_KEY  = 'twcc_github_release';
	const API        = 'https://api.github.com';

	/** @var string */
	private $plugin_file;

	/** @var string e.g. "20twenty-cookie-consent/20twenty-cookie-consent.php" */
	private $basename;

	/** @var string e.g. "20twenty-cookie-consent" */
	private $slug;

	public function __construct( string $plugin_file ) {
		$this->plugin_file = $plugin_file;
		$this->basename    = plugin_basename( $plugin_file );
		$this->slug        = dirname( $this->basename );
	}

	public function register(): void {
		add_filter( 'update_plugins_github.com', array( $this, 'filter_update' ), 10, 3 );
		add_filter( 'plugins_api', array( $this, 'filter_plugin_info' ), 20, 3 );
		add_filter( 'upgrader_pre_download', array( $this, 'download_private_asset' ), 10, 3 );
		add_filter( 'upgrader_source_selection', array( $this, 'fix_source_dir' ), 10, 4 );
		add_filter( 'plugin_row_meta', array( $this, 'row_meta' ), 10, 2 );
		add_action( 'admin_post_twcc_check_updates', array( $this, 'handle_check_now' ) );
		add_action( 'upgrader_process_complete', array( $this, 'flush_cache' ), 10, 0 );
	}

	/* ---------------------------------------------------------------------
	 * Config
	 * ------------------------------------------------------------------ */

	public static function repository(): string {
		/**
		 * GitHub "owner/repo" to pull releases from (e.g. for a fork).
		 *
		 * @param string $repository
		 */
		return (string) apply_filters( 'twcc_github_repository', self::REPOSITORY );
	}

	public static function token(): string {
		$token = defined( 'TWCC_GITHUB_TOKEN' ) ? (string) constant( 'TWCC_GITHUB_TOKEN' ) : '';

		/**
		 * GitHub token for private repositories. Never exposed to the browser.
		 *
		 * @param string $token
		 */
		return (string) apply_filters( 'twcc_github_token', $token );
	}

	public static function check_now_url(): string {
		return wp_nonce_url( admin_url( 'admin-post.php?action=twcc_check_updates' ), 'twcc_check_updates' );
	}

	/* ---------------------------------------------------------------------
	 * GitHub API
	 * ------------------------------------------------------------------ */

	private function api_headers( string $accept = 'application/vnd.github+json' ): array {
		$headers = array(
			'Accept'               => $accept,
			'User-Agent'           => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . $this->slug,
			'X-GitHub-Api-Version' => '2022-11-28',
		);
		$token   = self::token();
		if ( '' !== $token ) {
			$headers['Authorization'] = 'Bearer ' . $token;
		}
		return $headers;
	}

	/**
	 * Latest release, normalised. Cached for 6 hours (1 hour after a failure).
	 *
	 * @return array{version:string,tag:string,package:string,url:string,notes:string,published:string}|null
	 */
	public function get_release( bool $force = false ): ?array {
		if ( ! $force ) {
			$cached = get_site_transient( self::CACHE_KEY );
			if ( is_array( $cached ) ) {
				return empty( $cached['version'] ) ? null : $cached;
			}
		}

		$response = wp_remote_get(
			self::API . '/repos/' . self::repository() . '/releases/latest',
			array(
				'timeout' => 10,
				'headers' => $this->api_headers(),
			)
		);

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( is_wp_error( $response ) || 200 !== $code || ! is_array( $body ) || empty( $body['tag_name'] ) ) {
			// Negative cache so a missing token / rate limit doesn't hammer the API.
			set_site_transient( self::CACHE_KEY, array( 'version' => '' ), HOUR_IN_SECONDS );
			return null;
		}

		$package = '';
		foreach ( (array) ( $body['assets'] ?? array() ) as $asset ) {
			if ( isset( $asset['name'] ) && self::ASSET_NAME === $asset['name'] ) {
				// Private repos need the API asset URL (downloaded with the token
				// in download_private_asset); public ones use the direct link.
				$package = '' !== self::token() ? (string) $asset['url'] : (string) $asset['browser_download_url'];
				break;
			}
		}

		$release = array(
			'version'   => ltrim( (string) $body['tag_name'], 'vV' ),
			'tag'       => (string) $body['tag_name'],
			'package'   => $package,
			'url'       => (string) ( $body['html_url'] ?? 'https://github.com/' . self::repository() ),
			'notes'     => (string) ( $body['body'] ?? '' ),
			'published' => (string) ( $body['published_at'] ?? '' ),
		);

		set_site_transient( self::CACHE_KEY, $release, 6 * HOUR_IN_SECONDS );
		return $release;
	}

	public function flush_cache(): void {
		delete_site_transient( self::CACHE_KEY );
	}

	/* ---------------------------------------------------------------------
	 * WordPress update hooks
	 * ------------------------------------------------------------------ */

	/**
	 * @param array|false $update      Update data from earlier filters.
	 * @param array       $plugin_data Plugin headers.
	 * @param string      $plugin_file Plugin basename.
	 * @return array|false
	 */
	public function filter_update( $update, $plugin_data, $plugin_file ) {
		if ( $plugin_file !== $this->basename ) {
			return $update;
		}

		// "Check again" on Dashboard → Updates bypasses our cache too.
		$force   = is_admin() && isset( $_GET['force-check'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$release = $this->get_release( $force );
		if ( ! $release || '' === $release['package'] ) {
			return $update;
		}

		// WordPress core compares `version` with the installed one.
		return array(
			'slug'         => $this->slug,
			'version'      => $release['version'],
			'url'          => $release['url'],
			'package'      => $release['package'],
			'requires_php' => (string) ( $plugin_data['RequiresPHP'] ?? '' ),
			'requires'     => (string) ( $plugin_data['RequiresWP'] ?? '' ),
			'tested'       => '',
			'icons'        => array(),
			'banners'      => array(),
		);
	}

	/**
	 * "View details" modal.
	 *
	 * @param false|object|array $result
	 * @param string             $action
	 * @param object             $args
	 * @return false|object|array
	 */
	public function filter_plugin_info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action || empty( $args->slug ) || $args->slug !== $this->slug ) {
			return $result;
		}

		$release = $this->get_release();
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$data = get_plugin_data( $this->plugin_file, false, false );

		return (object) array(
			'name'          => $data['Name'],
			'slug'          => $this->slug,
			'version'       => $release ? $release['version'] : $data['Version'],
			'author'        => $data['Author'],
			'homepage'      => 'https://github.com/' . self::repository(),
			'requires'      => $data['RequiresWP'],
			'requires_php'  => $data['RequiresPHP'],
			'last_updated'  => $release ? $release['published'] : '',
			'download_link' => $release ? $release['package'] : '',
			'sections'      => array(
				'description' => wpautop( esc_html( $data['Description'] ) ),
				'changelog'   => $release && '' !== $release['notes']
					? wpautop( esc_html( $release['notes'] ) )
					: '<p>' . esc_html__( 'See the GitHub releases page.', '20twenty-cookie-consent' ) . '</p>',
			),
		);
	}

	/**
	 * Private repositories: GitHub answers the authenticated asset request with
	 * a redirect to a short-lived signed URL. Follow it ourselves so the token
	 * is never sent to the storage host.
	 *
	 * @param false|string|\WP_Error $reply
	 * @param string                 $package
	 * @param \WP_Upgrader           $upgrader
	 * @return false|string|\WP_Error
	 */
	public function download_private_asset( $reply, $package, $upgrader ) {
		$asset_prefix = self::API . '/repos/' . self::repository() . '/releases/assets/';
		if ( false !== $reply || '' === self::token() || 0 !== stripos( (string) $package, $asset_prefix ) ) {
			return $reply;
		}

		if ( isset( $upgrader->skin ) ) {
			$upgrader->skin->feedback( 'downloading_package', $package );
		}

		$response = wp_remote_get(
			$package,
			array(
				'timeout'     => 30,
				'redirection' => 0,
				'headers'     => $this->api_headers( 'application/octet-stream' ),
			)
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code     = (int) wp_remote_retrieve_response_code( $response );
		$location = (string) wp_remote_retrieve_header( $response, 'location' );

		if ( $code >= 300 && $code < 400 && '' !== $location ) {
			if ( ! function_exists( 'download_url' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}
			return download_url( $location, 300 );
		}

		return new \WP_Error(
			'twcc_download_failed',
			sprintf(
				/* translators: %d: HTTP status code */
				__( 'Could not download the update from GitHub (HTTP %d). Check TWCC_GITHUB_TOKEN.', '20twenty-cookie-consent' ),
				$code
			)
		);
	}

	/**
	 * Make sure the extracted folder is named after the installed plugin, so
	 * an update never installs as a second copy.
	 *
	 * @param string|\WP_Error $source
	 * @param string           $remote_source
	 * @param \WP_Upgrader     $upgrader
	 * @param array            $hook_extra
	 * @return string|\WP_Error
	 */
	public function fix_source_dir( $source, $remote_source, $upgrader, $hook_extra = array() ) {
		global $wp_filesystem;

		if ( is_wp_error( $source ) || ( $hook_extra['plugin'] ?? '' ) !== $this->basename ) {
			return $source;
		}

		$desired = trailingslashit( $remote_source ) . $this->slug . '/';
		if ( trailingslashit( $source ) === $desired ) {
			return $source;
		}

		if ( $wp_filesystem && $wp_filesystem->move( untrailingslashit( $source ), untrailingslashit( $desired ), true ) ) {
			return $desired;
		}

		return new \WP_Error( 'twcc_rename_failed', __( 'Could not rename the update folder.', '20twenty-cookie-consent' ) );
	}

	/* ---------------------------------------------------------------------
	 * Admin UI
	 * ------------------------------------------------------------------ */

	/**
	 * @param string[] $links
	 * @param string   $file
	 * @return string[]
	 */
	public function row_meta( $links, $file ) {
		if ( $file !== $this->basename || ! current_user_can( 'update_plugins' ) ) {
			return $links;
		}
		$links[] = sprintf( '<a href="%s">%s</a>', esc_url( self::check_now_url() ), esc_html__( 'Check for updates', '20twenty-cookie-consent' ) );
		$links[] = sprintf( '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>', esc_url( 'https://github.com/' . self::repository() . '/releases' ), esc_html__( 'Releases', '20twenty-cookie-consent' ) );
		return $links;
	}

	public function handle_check_now(): void {
		if ( ! current_user_can( 'update_plugins' ) ) {
			wp_die( esc_html__( 'Sorry, you are not allowed to update plugins.', '20twenty-cookie-consent' ), 403 );
		}
		check_admin_referer( 'twcc_check_updates' );

		$this->flush_cache();
		delete_site_transient( 'update_plugins' );
		wp_update_plugins();

		wp_safe_redirect( self_admin_url( 'update-core.php' ) );
		exit;
	}
}
