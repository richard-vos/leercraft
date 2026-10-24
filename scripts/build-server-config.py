"""Generate deployment-only PHP configuration without printing credentials."""
import base64
import os
from pathlib import Path
import sys


def build_config(environment):
    required = ('DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'OTP_PEPPER')
    missing = [name for name in required if not environment.get(name)]
    if missing:
        raise ValueError('Ontbrekende GitHub secrets: ' + ', '.join(name.lower() for name in missing))
    if len(environment['OTP_PEPPER']) < 32:
        raise ValueError('Secret otp_pepper moet minimaal 32 tekens bevatten.')
    mail_from = environment.get('MAIL_FROM') or 'inlog@leercraft.nl'
    if any(char in mail_from for char in '\r\n'):
        raise ValueError('Secret mail_from bevat een ongeldige regelovergang.')
    values = {'DB_DRIVER': 'mysql', **{name: environment[name] for name in required},
              'MAIL_FROM': mail_from,
              'MAIL_FROM_NAME': 'LeerCraft'}
    lines = ['<?php', 'declare(strict_types=1);', '// Gegenereerd tijdens deployment.']
    for name, value in values.items():
        # Encoded strings preserve quotes, backslashes, newlines and Unicode in PHP.
        encoded = base64.b64encode(value.encode('utf-8')).decode('ascii')
        lines.append(f"define('{name}', base64_decode('{encoded}'));")
    lines.extend(["define('COOKIE_SECURE', true);", "define('MAIL_DISABLED', false);", ''])
    return '\n'.join(lines)


if __name__ == '__main__':
    try:
        config = build_config(os.environ)
    except ValueError as error:
        sys.exit(str(error))
    target = Path(sys.argv[1])
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(config, encoding='utf-8')
    target.chmod(0o600)
