-- Eenmalig uitvoeren voor een bestaande database.
CREATE INDEX idx_otp_ip_created ON otp_codes (ip_address, created_at);
