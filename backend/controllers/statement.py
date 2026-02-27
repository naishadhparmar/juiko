import csv
import os
import threading
from datetime import datetime
from flask import current_app, Blueprint, request, jsonify
from models import Statement, Instrument, TransactionTag
from services.transaction import create_transaction
from services.tagging import build_examples, suggest_tag

bp = Blueprint('statement_bp', __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'statements')

DATE_COLS   = ['transaction_date', 'transaction date', 'trans date', 'trans. date', 'date']
POSTED_COLS = ['posted_date', 'posted date', 'post date', 'posting date', 'settlement date', 'settled date']
DESC_COLS   = ['description', 'transaction description', 'desc', 'memo', 'narrative', 'details']
AMOUNT_COLS = ['amount', 'transaction amount', 'debit/credit', 'value']


def _find_col(header_map, candidates):
    for name in candidates:
        if name in header_map:
            return header_map[name]
    return None


def _process_statement(app, statement_id, rows, col_indices, instrument_id):
    with app.app_context():
        db = app.config['db']
        try:
            statement = db.session.get(Statement, statement_id)
            statement.status = 'processing'
            db.session.commit()

            date_idx   = col_indices['date']
            posted_idx = col_indices['posted']
            desc_idx   = col_indices['desc']
            amount_idx = col_indices['amount']

            instrument = db.session.get(Instrument, instrument_id)
            instrument_name = instrument.account_name if instrument else ''
            examples = build_examples(db)

            imported = 0
            for i, row in enumerate(rows, start=2):
                if not any(cell.strip() for cell in row):
                    continue
                try:
                    transaction = create_transaction(
                        db,
                        transaction_date_str=row[date_idx],
                        description=row[desc_idx],
                        amount_str=row[amount_idx],
                        instrument_id=instrument_id,
                        posted_date_str=row[posted_idx] if posted_idx is not None else None,
                        statement_id=statement_id
                    )
                    db.session.commit()
                    imported += 1
                except Exception:
                    db.session.rollback()
                    continue

                try:
                    tag = suggest_tag(
                        description=row[desc_idx],
                        amount=float(transaction.amount),
                        instrument_name=instrument_name,
                        examples=examples
                    )
                    if tag:
                        db.session.add(TransactionTag(
                            transaction_id=transaction.id,
                            tag=tag,
                            source='ai'
                        ))
                        db.session.commit()
                except Exception:
                    db.session.rollback()

            statement = db.session.get(Statement, statement_id)
            statement.row_count = imported
            statement.status = 'completed'
            db.session.commit()

        except Exception:
            db.session.rollback()
            try:
                statement = db.session.get(Statement, statement_id)
                statement.status = 'failed'
                db.session.commit()
            except Exception:
                pass


@bp.get('/')
def get_all_statements():
    db = current_app.config['db']
    statements = db.session.query(Statement).all()
    instruments = db.session.query(Instrument).all()

    instrument_lookup = {str(i.id): i.json() for i in instruments}

    return jsonify({
        "statements": [s.json() for s in statements],
        "lookup": {"instrument": instrument_lookup}
    })


@bp.post('/')
def upload_statement():
    db = current_app.config['db']

    instrument_id = request.form.get('instrument_id', '').strip()
    if not instrument_id:
        return jsonify({"error": "instrument_id is required"}), 400
    try:
        instrument_id = int(instrument_id)
        if db.session.get(Instrument, instrument_id) is None:
            return jsonify({"error": "Instrument not found"}), 404
    except ValueError:
        return jsonify({"error": "Invalid instrument_id"}), 400

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Only CSV files are supported"}), 400

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    filepath = os.path.join(UPLOAD_DIR, f"{timestamp}_{file.filename}")
    file.save(filepath)

    try:
        with open(filepath, newline='', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            raw_headers = next(reader)
            header_map = {h.strip().lower(): i for i, h in enumerate(raw_headers)}

            date_idx   = _find_col(header_map, DATE_COLS)
            posted_idx = _find_col(header_map, POSTED_COLS)
            desc_idx   = _find_col(header_map, DESC_COLS)
            amount_idx = _find_col(header_map, AMOUNT_COLS)

            missing = [name for name, idx in [
                ('transaction_date', date_idx),
                ('description', desc_idx),
                ('amount', amount_idx)
            ] if idx is None]

            if missing:
                os.remove(filepath)
                return jsonify({
                    "error": f"Could not find required columns: {', '.join(missing)}. "
                             f"Columns found: {', '.join(raw_headers)}"
                }), 400

            rows = list(reader)

    except Exception as e:
        os.remove(filepath)
        return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 400

    statement = Statement(
        original_filename=file.filename,
        filepath=filepath,
        instrument_id=instrument_id,
        row_count=0,
        status='pending'
    )
    db.session.add(statement)
    db.session.commit()

    col_indices = {
        'date': date_idx, 'posted': posted_idx,
        'desc': desc_idx, 'amount': amount_idx
    }
    app = current_app._get_current_object()
    threading.Thread(
        target=_process_statement,
        args=(app, statement.id, rows, col_indices, instrument_id),
        daemon=True
    ).start()

    return jsonify(statement.json()), 202
