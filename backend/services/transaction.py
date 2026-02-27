from datetime import datetime
from models import Transaction, Instrument


def parse_date(value):
    """Parse a date string in several common formats. Raises ValueError if unrecognised."""
    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(str(value).strip(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Unrecognised date format: '{value}'")


def parse_amount(value):
    """Parse an amount string, stripping commas. Raises ValueError if invalid."""
    try:
        return float(str(value).replace(',', '').strip())
    except (ValueError, AttributeError):
        raise ValueError(f"Invalid amount: '{value}'")


def parse_instrument_id(db, value):
    """Parse, cast, and verify an instrument_id. Raises ValueError if invalid or not found."""
    try:
        instrument_id = int(str(value).strip())
    except (ValueError, TypeError):
        raise ValueError(f"Invalid instrument_id: '{value}'")
    if db.session.get(Instrument, instrument_id) is None:
        raise ValueError(f"Instrument {instrument_id} not found")
    return instrument_id


def create_transaction(db, transaction_date_str, description, amount_str,
                       instrument_id, posted_date_str=None, statement_id=None):
    """
    Validates inputs, creates a Transaction and adds it to db.session.
    Does NOT commit — the caller controls the commit.
    Raises ValueError on any validation error.

    posted_date_str: optional — falls back to transaction_date when absent.
    instrument_id:   int, already validated by the caller (re-checked internally
                     as a safety net for background-thread callers).
    """
    transaction_date = parse_date(transaction_date_str)

    posted_date = parse_date(posted_date_str) \
        if posted_date_str and str(posted_date_str).strip() \
        else transaction_date

    if not description or not str(description).strip():
        raise ValueError("description is required")

    amount = parse_amount(amount_str)

    parse_instrument_id(db, instrument_id)  # existence check

    transaction = Transaction(
        transaction_date=transaction_date,
        posted_date=posted_date,
        description=str(description).strip(),
        amount=amount,
        instrument_id=instrument_id,
        statement_id=statement_id
    )
    db.session.add(transaction)
    return transaction
