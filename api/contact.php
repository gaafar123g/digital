<?php
/**
 * Digital Marketing Pro — contact form endpoint (PHP 7.4+).
 * Receives JSON from the website form, validates it, and e-mails it to you.
 * Setup: copy config.sample.php to config.php and fill in your e-mail.
 * It NEVER reports success unless the message was really handed to the mail system.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out(int $code, array $body): void { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); out(405, ['ok' => false, 'error' => 'method']); }

$cfgFile = __DIR__ . '/config.php';
$cfg = is_file($cfgFile) ? (require $cfgFile) : [];
$to = trim((string)($cfg['to_email'] ?? ''));
$webhook = trim((string)($cfg['webhook_url'] ?? ''));
if ($to === '' && $webhook === '') out(503, ['ok' => false, 'error' => 'not_configured']);

/* same-origin check (blocks other sites posting to your form) */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $oh = parse_url($origin, PHP_URL_HOST);
    $hh = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
    if (!$oh || strcasecmp((string)$oh, (string)$hh) !== 0) out(403, ['ok' => false, 'error' => 'origin']);
}

$raw = file_get_contents('php://input', false, null, 0, 20001);
if ($raw === false || strlen($raw) > 20000) out(413, ['ok' => false, 'error' => 'too_large']);
$d = json_decode($raw, true);
if (!is_array($d)) out(400, ['ok' => false, 'error' => 'bad_json']);

/* anti-spam: honeypot + minimum fill time */
if (!empty($d['website'])) out(200, ['ok' => true]);               // bots get a silent "ok" and nothing is sent
$minFill = (int)($cfg['min_fill_seconds'] ?? 3);
$started = (int)($d['startedAt'] ?? 0);
if ($started > 0 && (time() - intdiv($started, 1000)) < $minFill) out(400, ['ok' => false, 'error' => 'too_fast']);

/* rate limit per IP (file based) */
$limit = (int)($cfg['rate_limit_per_hour'] ?? 5);
if ($limit > 0) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
    $f = sys_get_temp_dir() . '/ms_rl_' . md5($ip);
    $hits = is_file($f) ? array_filter(array_map('intval', explode(',', (string)file_get_contents($f))), fn($t) => $t > time() - 3600) : [];
    if (count($hits) >= $limit) out(429, ['ok' => false, 'error' => 'rate_limited']);
    $hits[] = time();
    @file_put_contents($f, implode(',', $hits), LOCK_EX);
}

/* optional Cloudflare Turnstile */
$secret = trim((string)($cfg['turnstile_secret'] ?? ''));
if ($secret !== '') {
    $tok = (string)($d['turnstileToken'] ?? '');
    if ($tok === '') out(400, ['ok' => false, 'error' => 'captcha']);
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 8, 'header' => "Content-type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query(['secret' => $secret, 'response' => $tok, 'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''])]]);
    $r = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $ctx);
    $j = $r ? json_decode($r, true) : null;
    if (!is_array($j) || empty($j['success'])) out(400, ['ok' => false, 'error' => 'captcha']);
}

/* validation */
function s($v, int $max): string { $v = is_string($v) ? trim($v) : ''; $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $v); return mb_substr($v, 0, $max); }
$phoneRaw = strtr(s($d['phone'] ?? '', 40), ['٠'=>'0','١'=>'1','٢'=>'2','٣'=>'3','٤'=>'4','٥'=>'5','٦'=>'6','٧'=>'7','٨'=>'8','٩'=>'9']);
$digits = preg_replace('/\D/', '', $phoneRaw);
$v = [
  'name' => s($d['name'] ?? '', 120), 'company' => s($d['company'] ?? '', 160), 'phone' => $phoneRaw,
  'email' => s($d['email'] ?? '', 200), 'country' => s($d['country'] ?? '', 80), 'city' => s($d['city'] ?? '', 80),
  'service' => s($d['service'] ?? '', 80), 'budget' => s($d['budget'] ?? '', 20), 'details' => s($d['details'] ?? '', 3000),
  'method' => s($d['contactMethod'] ?? '', 20), 'locale' => (($d['locale'] ?? '') === 'en') ? 'en' : 'ar',
];
$bad = [];
if (mb_strlen($v['name']) < 2) $bad[] = 'name';
if (!preg_match('/^\+?[0-9\s\-()]{7,24}$/', $v['phone']) || strlen($digits) < 7 || strlen($digits) > 15) $bad[] = 'phone';
if (!filter_var($v['email'], FILTER_VALIDATE_EMAIL)) $bad[] = 'email';
if (mb_strlen($v['country']) < 2) $bad[] = 'country';
if (mb_strlen($v['city']) < 2) $bad[] = 'city';
if ($v['service'] === '') $bad[] = 'service';
if (mb_strlen($v['details']) < 10) $bad[] = 'details';
if (empty($d['consent'])) $bad[] = 'consent';
if ($bad) out(400, ['ok' => false, 'error' => 'validation', 'fields' => $bad]);

$lines = [
  'New consultation request — Digital Marketing Pro website', str_repeat('-', 44),
  'Name: ' . $v['name'], 'Company: ' . $v['company'], 'Phone/WhatsApp: ' . $v['phone'], 'Email: ' . $v['email'],
  'Country / City: ' . $v['country'] . ' / ' . $v['city'], 'Service: ' . $v['service'], 'Budget: ' . $v['budget'],
  'Preferred contact: ' . $v['method'], 'Site language: ' . $v['locale'], '', 'Details:', $v['details'], '',
  'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? ''), 'Time: ' . gmdate('c'),
];
$text = implode("\n", $lines);
$sent = false;

if ($to !== '') {
    $from = trim((string)($cfg['from_email'] ?? '')) ?: ('no-reply@' . preg_replace('/^www\./', '', preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'))));
    $subject = '=?UTF-8?B?' . base64_encode('طلب استشارة جديد — ' . $v['name']) . '?=';
    $headers = "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nFrom: Digital Marketing Pro <" . str_replace(["\r", "\n"], '', $from) . ">\r\nReply-To: " . str_replace(["\r", "\n"], '', $v['email']) . "\r\n";
    $sent = @mail($to, $subject, $text, $headers);
}
if ($webhook !== '') {
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 10, 'ignore_errors' => true, 'header' => "Content-Type: application/json\r\n", 'content' => json_encode($v + ['receivedAt' => gmdate('c')], JSON_UNESCAPED_UNICODE)]]);
    $res = @file_get_contents($webhook, false, $ctx);
    $code = 0; if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $code = (int)$m[1];
    if ($res !== false && $code >= 200 && $code < 300) $sent = true;
}

if (!$sent) out(502, ['ok' => false, 'error' => 'delivery_failed']);
out(200, ['ok' => true]);
