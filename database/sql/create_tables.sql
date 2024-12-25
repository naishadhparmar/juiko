/*
Create table for all users of the platform.
This will describe all  users of the platform.  Doing this for academic purposes however currently only anticipating one.
*/
CREATE TABLE wop_user (
    id SERIAL PRIMARY KEY,                              -- Unique identifier for each user
    user_email VARCHAR(255) NOT NULL,                            -- Email to identify individual user
    user_password VARCHAR(255) NOT NULL,                -- Password stored in hash form
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- When the user was created
);

/*
Create table for financial statement/document parsing status lookup.
*/
CREATE TABLE lkp_financial_statement_parsing_status (
    id SERIAL PRIMARY KEY,
    label VARCHAR(16) NOT NULL
);

/*
Create table for all financial statements/documents uploaded by the user.
This will describe all the uploads done by users
*/
CREATE TABLE wop_financial_statement (
    id SERIAL PRIMARY KEY,                -- Unique identifier for each file
    uploader_id INT NOT NULL,             -- ID of the user who uploaded the file
    file_name VARCHAR(255) NOT NULL,      -- Original file name
    file_path TEXT NOT NULL,              -- Location of the file on the local machine
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When the file was uploaded
    parsing_status INT DEFAULT 0 NOT NULL,         -- Parsing status ('pending', 'success', 'error')
    CONSTRAINT financial_statement_uploader_fk_wop_user FOREIGN KEY (uploader_id) REFERENCES wop_user (id) ON DELETE CASCADE,
    CONSTRAINT financial_statement_fk_lkp_parsing_status FOREIGN KEY (parsing_status) REFERENCES lkp_financial_statement_parsing_status(id)
);

