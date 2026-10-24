"""Exercise the actual OTP verification SQL against a disposable SQLite database."""
from pathlib import Path
import re
import sqlite3

source = Path('api/auth/verify-otp.php').read_text(encoding='utf-8')
queries = re.findall(r"prepare\(\s*'([^']+)'\s*\)", source)
reserve = next(query for query in queries if query.startswith('UPDATE otp_codes SET attempts'))
consume = next(query for query in queries if query.startswith('UPDATE otp_codes SET consumed_at'))
select = next(query for query in queries if 'SELECT * FROM otp_codes' in query)
db = sqlite3.connect(':memory:')
db.execute('CREATE TABLE otp_codes (id INTEGER PRIMARY KEY, email TEXT, attempts INT, consumed_at TEXT, expires_at TEXT)')
db.execute("INSERT INTO otp_codes VALUES (1, 'test@example.com', 0, NULL, '2030-01-01 00:00:00')")
params = {'id': 1, 'now': '2026-10-24 12:00:00'}
for _ in range(5):
    assert db.execute(reserve, params).rowcount == 1
assert db.execute(reserve, params).rowcount == 0, 'Sixth verification must be blocked'
assert db.execute(consume, {**params, 'now_exp': params['now']}).rowcount == 1, 'Fifth reserved attempt can succeed'
assert db.execute(consume, {**params, 'now_exp': params['now']}).rowcount == 0, 'Code must be single use'
db.execute("INSERT INTO otp_codes VALUES (2, 'test@example.com', 0, NULL, '2020-01-01 00:00:00')")
assert db.execute(select, {'email': 'test@example.com'}).fetchone()[0] == 2, 'Never fall back to older OTPs'
assert db.execute(reserve, {**params, 'id': 2}).rowcount == 0, 'Expired OTP must not reserve attempts'
print('Passed: attempt cap, fifth attempt, single use, latest OTP only, expiry.')
