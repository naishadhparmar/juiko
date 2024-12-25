ALTER TABLE wop_financial_statement DROP CONSTRAINT IF EXISTS financial_statement_uploader_fk_wop_user;
ALTER TABLE wop_financial_statement DROP CONSTRAINT IF EXISTS financial_statement_fk_lkp_parsing_status;
DROP TABLE IF EXISTS wop_financial_statement;
DROP TABLE IF EXISTS lkp_financial_statement_parsing_status;
DROP TABLE IF EXISTS wop_user;