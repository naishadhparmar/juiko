CREATE TABLE IF NOT EXISTS instrument_types (
    id SERIAL PRIMARY KEY,
    type_name TEXT NOT NULL
);

INSERT INTO instrument_types (type_name) VALUES
('Credit Card'),
('Checking Account'),
('Savings Account'),
('High-Yield Savings Account'),
('Investment Account');

CREATE TABLE IF NOT EXISTS instruments (
    id SERIAL PRIMARY KEY,
    financial_institution TEXT NOT NULL,
    account_name TEXT NOT NULL,
    type INTEGER NOT NULL,
    FOREIGN KEY (type) REFERENCES instrument_types(id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    posted_date DATE NOT NULL,
    description TEXT,
    amount DECIMAL(11, 2) NOT NULL,
    instrument_id INTEGER NOT NULL,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id)
);

CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (transaction_id, tag),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);