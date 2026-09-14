<?php
namespace TwentyTwenty\CookieConsent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Settings → Cookie Consent screen.
 */
final class Admin {

	const PAGE = 'twenty-cookie-consent';

	/** @var string */
	private $hook_suffix = '';

	public function register(): void {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_init', array( $this, 'register_setting' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( TWCC_FILE ), array( $this, 'action_links' ) );
		add_action( 'update_option_' . Settings::OPTION, array( $this, 'settings_updated' ), 10, 2 );
	}

	public function menu(): void {
		$this->hook_suffix = (string) add_options_page(
			__( 'Cookie Consent', '20twenty-cookie-consent' ),
			__( 'Cookie Consent', '20twenty-cookie-consent' ),
			'manage_options',
			self::PAGE,
			array( $this, 'render' )
		);
	}

	public function register_setting(): void {
		register_setting(
			Settings::GROUP,
			Settings::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( Settings::class, 'sanitize' ),
				'default'           => Settings::defaults(),
				'show_in_rest'      => false,
			)
		);
	}

	public function enqueue( string $hook ): void {
		if ( $hook !== $this->hook_suffix ) {
			return;
		}
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );
		wp_add_inline_script( 'wp-color-picker', 'jQuery(function($){$(".twcc-color").wpColorPicker();});' );
		wp_add_inline_style( 'wp-color-picker', '.twcc-card{background:#fff;border:1px solid #c3c4c7;padding:4px 20px 16px;margin:20px 0;max-width:960px}.twcc-card code{user-select:all}.twcc-card pre{background:#f6f7f7;padding:12px;overflow:auto}' );
	}

	/**
	 * @param string[] $links
	 * @return string[]
	 */
	public function action_links( array $links ): array {
		array_unshift(
			$links,
			sprintf(
				'<a href="%s">%s</a>',
				esc_url( admin_url( 'options-general.php?page=' . self::PAGE ) ),
				esc_html__( 'Settings', '20twenty-cookie-consent' )
			)
		);
		return $links;
	}

	/**
	 * @param mixed $old_value
	 * @param mixed $value
	 */
	public function settings_updated( $old_value, $value ): void {
		/**
		 * Fires after the cookie consent settings are saved. Hook in to purge
		 * caches or ping a headless front end's revalidation endpoint
		 * (e.g. Next.js revalidateTag('cookie-consent')).
		 *
		 * @param array $settings  Public settings payload.
		 * @param mixed $old_value Previously stored raw value.
		 */
		do_action( 'twcc_settings_updated', Settings::public_payload(), $old_value );
	}

	private function name( string $key ): string {
		return Settings::OPTION . '[' . $key . ']';
	}

	private function text_row( array $s, string $key, string $label, string $placeholder = '', string $description = '' ): void {
		?>
		<tr>
			<th scope="row"><label for="twcc_<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td>
				<input id="twcc_<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $this->name( $key ) ); ?>" type="text" class="regular-text" value="<?php echo esc_attr( (string) $s[ $key ] ); ?>" placeholder="<?php echo esc_attr( $placeholder ); ?>">
				<?php if ( $description ) : ?>
					<p class="description"><?php echo esc_html( $description ); ?></p>
				<?php endif; ?>
			</td>
		</tr>
		<?php
	}

	private function checkbox_row( array $s, string $key, string $label, string $text, string $description = '' ): void {
		?>
		<tr>
			<th scope="row"><?php echo esc_html( $label ); ?></th>
			<td>
				<label for="twcc_<?php echo esc_attr( $key ); ?>">
					<input id="twcc_<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $this->name( $key ) ); ?>" type="checkbox" value="1" <?php checked( ! empty( $s[ $key ] ) ); ?>>
					<?php echo esc_html( $text ); ?>
				</label>
				<?php if ( $description ) : ?>
					<p class="description"><?php echo esc_html( $description ); ?></p>
				<?php endif; ?>
			</td>
		</tr>
		<?php
	}

	private function color_row( array $s, string $key, string $label, string $css_var ): void {
		?>
		<tr>
			<th scope="row"><label for="twcc_<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td>
				<input id="twcc_<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $this->name( $key ) ); ?>" type="text" class="twcc-color" value="<?php echo esc_attr( (string) $s[ $key ] ); ?>">
				<p class="description"><code><?php echo esc_html( $css_var ); ?></code></p>
			</td>
		</tr>
		<?php
	}

	public function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s        = Settings::get();
		$rest_url = rest_url( Rest::REST_NAMESPACE . Rest::ROUTE );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Cookie Consent', '20twenty-cookie-consent' ); ?></h1>

			<form method="post" action="options.php">
				<?php settings_fields( Settings::GROUP ); ?>

				<h2 class="title"><?php esc_html_e( 'Banner content', '20twenty-cookie-consent' ); ?></h2>
				<table class="form-table" role="presentation">
					<?php $this->text_row( $s, 'bannerTitle', __( 'Title', '20twenty-cookie-consent' ), '', __( 'Optional.', '20twenty-cookie-consent' ) ); ?>
					<tr>
						<th scope="row"><label for="twcc_bannerText"><?php esc_html_e( 'Text', '20twenty-cookie-consent' ); ?></label></th>
						<td><textarea id="twcc_bannerText" name="<?php echo esc_attr( $this->name( 'bannerText' ) ); ?>" rows="3" class="large-text"><?php echo esc_textarea( $s['bannerText'] ); ?></textarea></td>
					</tr>
					<?php
					$this->text_row( $s, 'acceptLabel', __( 'Accept button', '20twenty-cookie-consent' ) );
					$this->text_row( $s, 'rejectLabel', __( 'Decline button', '20twenty-cookie-consent' ) );
					$this->text_row( $s, 'policyUrl', __( 'Policy URL', '20twenty-cookie-consent' ), '/privacy-policy', __( 'Absolute URL or a site-relative path.', '20twenty-cookie-consent' ) );
					$this->text_row( $s, 'policyLabel', __( 'Policy link label', '20twenty-cookie-consent' ) );
					$this->text_row( $s, 'manageLabel', __( '"Manage cookies" link label', '20twenty-cookie-consent' ), '', __( 'Used by the [cookie_consent_manage] shortcode and headless footers. US sites often use "Do Not Sell or Share My Personal Information".', '20twenty-cookie-consent' ) );
					?>
				</table>

				<h2 class="title"><?php esc_html_e( 'Behaviour', '20twenty-cookie-consent' ); ?></h2>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="twcc_mode"><?php esc_html_e( 'Mode', '20twenty-cookie-consent' ); ?></label></th>
						<td>
							<select id="twcc_mode" name="<?php echo esc_attr( $this->name( 'mode' ) ); ?>">
								<option value="opt-in" <?php selected( $s['mode'], 'opt-in' ); ?>><?php esc_html_e( 'Opt-in (EU/UK — tracking off until accepted)', '20twenty-cookie-consent' ); ?></option>
								<option value="opt-out" <?php selected( $s['mode'], 'opt-out' ); ?>><?php esc_html_e( 'Opt-out (US — tracking on until declined)', '20twenty-cookie-consent' ); ?></option>
							</select>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Re-prompt visitors', '20twenty-cookie-consent' ); ?></th>
						<td>
							<label for="twcc_bump">
								<input id="twcc_bump" name="<?php echo esc_attr( $this->name( 'bump' ) ); ?>" type="checkbox" value="1">
								<?php esc_html_e( 'Ask every visitor for consent again on their next visit', '20twenty-cookie-consent' ); ?>
							</label>
							<p class="description">
								<?php
								printf(
									/* translators: %d: consent version number */
									esc_html__( 'Tick and save after a policy change to reset all stored choices. Current consent version: %d.', '20twenty-cookie-consent' ),
									(int) $s['version']
								);
								?>
							</p>
						</td>
					</tr>
					<?php
					$this->text_row( $s, 'cookieName', __( 'Cookie name', '20twenty-cookie-consent' ) );
					?>
					<tr>
						<th scope="row"><label for="twcc_expiryDays"><?php esc_html_e( 'Cookie lifetime (days)', '20twenty-cookie-consent' ); ?></label></th>
						<td><input id="twcc_expiryDays" name="<?php echo esc_attr( $this->name( 'expiryDays' ) ); ?>" type="number" min="1" max="3650" class="small-text" value="<?php echo esc_attr( (string) $s['expiryDays'] ); ?>"></td>
					</tr>
					<?php
					$this->text_row( $s, 'cookieDomain', __( 'Cookie domain', '20twenty-cookie-consent' ), '.example.com', __( 'Optional. Set to share the decision across subdomains (e.g. WordPress on cms.example.com and the headless site on www.example.com).', '20twenty-cookie-consent' ) );
					?>
				</table>

				<h2 class="title"><?php esc_html_e( 'This WordPress site', '20twenty-cookie-consent' ); ?></h2>
				<p><?php esc_html_e( 'Controls the banner WordPress itself renders. Headless-only installs can switch it off — the settings above are still served to the front end.', '20twenty-cookie-consent' ); ?></p>
				<table class="form-table" role="presentation">
					<?php
					$this->checkbox_row( $s, 'renderBanner', __( 'Show banner', '20twenty-cookie-consent' ), __( 'Render the cookie banner on this site\'s front end', '20twenty-cookie-consent' ) );
					$this->checkbox_row( $s, 'googleConsentMode', __( 'Google Consent Mode v2', '20twenty-cookie-consent' ), __( 'Output the consent default in <head> and send updates on every choice', '20twenty-cookie-consent' ), __( 'Works with gtag.js, Google Tag Manager and Site Kit. The default is printed before any other script.', '20twenty-cookie-consent' ) );
					$this->checkbox_row( $s, 'loadStyles', __( 'Styles', '20twenty-cookie-consent' ), __( 'Load the built-in banner stylesheet', '20twenty-cookie-consent' ), __( 'Untick to style .cc-banner entirely from your theme.', '20twenty-cookie-consent' ) );
					?>
					<tr>
						<th scope="row"><label for="twcc_position"><?php esc_html_e( 'Position', '20twenty-cookie-consent' ); ?></label></th>
						<td>
							<select id="twcc_position" name="<?php echo esc_attr( $this->name( 'position' ) ); ?>">
								<option value="bar" <?php selected( $s['position'], 'bar' ); ?>><?php esc_html_e( 'Bottom bar', '20twenty-cookie-consent' ); ?></option>
								<option value="box-left" <?php selected( $s['position'], 'box-left' ); ?>><?php esc_html_e( 'Bottom-left box', '20twenty-cookie-consent' ); ?></option>
								<option value="box-right" <?php selected( $s['position'], 'box-right' ); ?>><?php esc_html_e( 'Bottom-right box', '20twenty-cookie-consent' ); ?></option>
							</select>
						</td>
					</tr>
					<?php
					$this->color_row( $s, 'colorBackground', __( 'Background', '20twenty-cookie-consent' ), '--cc-bg' );
					$this->color_row( $s, 'colorText', __( 'Text', '20twenty-cookie-consent' ), '--cc-fg' );
					$this->color_row( $s, 'colorAccent', __( 'Accept button', '20twenty-cookie-consent' ), '--cc-accent' );
					$this->color_row( $s, 'colorAccentText', __( 'Accept button text', '20twenty-cookie-consent' ), '--cc-accent-fg' );
					?>
				</table>

				<?php submit_button(); ?>
			</form>

			<div class="twcc-card">
				<h2><?php esc_html_e( 'Reopening the banner', '20twenty-cookie-consent' ); ?></h2>
				<p><?php esc_html_e( 'Visitors must be able to change their mind. Use any of:', '20twenty-cookie-consent' ); ?></p>
				<ul class="ul-disc">
					<li><?php esc_html_e( 'Shortcode:', '20twenty-cookie-consent' ); ?> <code>[cookie_consent_manage]</code></li>
					<li><?php esc_html_e( 'A menu “Custom link” with the URL', '20twenty-cookie-consent' ); ?> <code>#cookie-settings</code></li>
					<li><?php esc_html_e( 'Any element with the attribute', '20twenty-cookie-consent' ); ?> <code>data-cc-open</code></li>
				</ul>
				<p><?php esc_html_e( 'Block non-Google trackers until consent by changing their script type:', '20twenty-cookie-consent' ); ?></p>
				<pre><code>&lt;script type="text/plain" data-cookie-consent src="https://example.com/pixel.js"&gt;&lt;/script&gt;</code></pre>
			</div>

			<div class="twcc-card">
				<h2><?php esc_html_e( 'Headless front end', '20twenty-cookie-consent' ); ?></h2>
				<p>
					<?php esc_html_e( 'REST endpoint:', '20twenty-cookie-consent' ); ?>
					<a href="<?php echo esc_url( $rest_url ); ?>" target="_blank" rel="noopener noreferrer"><code><?php echo esc_html( $rest_url ); ?></code></a>
				</p>
				<p>
					<?php esc_html_e( 'WPGraphQL:', '20twenty-cookie-consent' ); ?>
					<?php if ( class_exists( 'WPGraphQL' ) && ! Plugin::legacy_plugin_active() ) : ?>
						<code>cookieConsentSettings</code> <?php esc_html_e( 'field available.', '20twenty-cookie-consent' ); ?>
					<?php else : ?>
						<?php esc_html_e( 'not active (optional).', '20twenty-cookie-consent' ); ?>
					<?php endif; ?>
				</p>
				<p><?php esc_html_e( 'Front-end package:', '20twenty-cookie-consent' ); ?> <code>@20twenty/cookie-consent</code> — <a href="https://github.com/20Twenty-Design/wp-cookie-consent-plugin#readme" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'setup guide', '20twenty-cookie-consent' ); ?></a></p>
			</div>

			<div class="twcc-card">
				<h2><?php esc_html_e( 'Updates', '20twenty-cookie-consent' ); ?></h2>
				<p>
					<?php
					printf(
						/* translators: %s: plugin version */
						esc_html__( 'Installed version: %s. Updates are delivered from GitHub releases through the normal WordPress updates screen.', '20twenty-cookie-consent' ),
						esc_html( TWCC_VERSION )
					);
					?>
				</p>
				<p>
					<?php esc_html_e( 'GitHub token:', '20twenty-cookie-consent' ); ?>
					<?php if ( GitHub_Updater::token() ) : ?>
						<?php esc_html_e( 'configured.', '20twenty-cookie-consent' ); ?>
					<?php else : ?>
						<?php esc_html_e( 'not set — only needed if the repository is private. Add to wp-config.php:', '20twenty-cookie-consent' ); ?>
						<code>define( 'TWCC_GITHUB_TOKEN', 'github_pat_…' );</code>
					<?php endif; ?>
				</p>
				<p><a class="button" href="<?php echo esc_url( GitHub_Updater::check_now_url() ); ?>"><?php esc_html_e( 'Check for updates now', '20twenty-cookie-consent' ); ?></a></p>
			</div>
		</div>
		<?php
	}
}
