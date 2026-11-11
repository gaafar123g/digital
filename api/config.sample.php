<?php
/* Copy this file to config.php and fill it in. config.php is blocked from the web by api/.htaccess */
return [
  'to_email'   => '',   // where requests are delivered, e.g. 'info@yourdomain.com'  (REQUIRED for the form to work)
  'from_email' => '',   // an address on YOUR domain, e.g. 'no-reply@yourdomain.com' (improves delivery)
  'webhook_url' => '',  // optional: also/instead POST the request to Make / Zapier / n8n / your CRM
  'turnstile_secret' => '', // optional Cloudflare Turnstile secret (and set the site key in assets/js/config.js)
  'min_fill_seconds' => 3,
  'rate_limit_per_hour' => 5,
];
