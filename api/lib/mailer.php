<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

/**
 * Stelt de inlogmail samen en verstuurt die via PHP's ingebouwde mail()
 * (geen SMTP-bibliotheek nodig — Strato's mailserver handelt de rest af).
 *
 * Geeft altijd de samengestelde velden terug (ook als MAIL_DISABLED aan
 * staat), zodat dit los van een echte mailserver te testen is.
 */
function send_otp_mail(string $toEmail, string $code): array
{
    $subject = 'Je inlogcode voor LeerCraft';
    $body = "Hallo,\n\n"
        . "Je inlogcode voor LeerCraft is: {$code}\n\n"
        . "Deze code is 10 minuten geldig. Heb je deze code niet zelf aangevraagd?\n"
        . "Dan kun je deze e-mail gewoon negeren.\n\n"
        . "Groetjes,\nLeerCraft\n";

    $headers = [
        'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . '>',
        'Content-Type: text/plain; charset=UTF-8',
    ];
    $headerStr = implode("\r\n", $headers);

    $sent = false;
    if (!defined('MAIL_DISABLED') || !MAIL_DISABLED) {
        $sent = @mail($toEmail, $subject, $body, $headerStr);
    }

    return [
        'to' => $toEmail,
        'subject' => $subject,
        'body' => $body,
        'headers' => $headerStr,
        'sent' => $sent,
    ];
}
