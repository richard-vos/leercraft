-- Alleen voor een bestaande database. Voor een nieuwe database: schema.mysql.sql.
ALTER TABLE scores ADD COLUMN run_id VARCHAR(36) NULL;
CREATE UNIQUE INDEX idx_scores_run ON scores (user_id, run_id);
