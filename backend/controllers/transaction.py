from flask import current_app, Blueprint, request, jsonify
from models import Transaction, Instrument, TransactionTag
from services.transaction import create_transaction, parse_date, parse_amount, parse_instrument_id

bp = Blueprint('transaction_bp', __name__)


@bp.get('/')
def get_all_transactions():
    db = current_app.config['db']
    transactions = db.session.query(Transaction).all()
    instruments = db.session.query(Instrument).all()

    instrument_lookup = {str(i.id): i.json() for i in instruments}

    return jsonify({
        "transactions": [t.json() for t in transactions],
        "lookup": {"instrument": instrument_lookup}
    })


@bp.get('/<int:transaction_id>')
def get_transaction_by_id(transaction_id):
    db = current_app.config['db']
    transaction = db.session.query(Transaction).get_or_404(transaction_id)
    return jsonify(transaction.json())


@bp.post('/')
def add_transaction():
    transaction_date = request.form.get('transaction_date', '').strip()
    if not transaction_date:
        return jsonify({"error": "transaction_date is required"}), 400

    posted_date = request.form.get('posted_date', '').strip()
    if not posted_date:
        return jsonify({"error": "posted_date is required"}), 400

    description = request.form.get('description', '').strip()
    if not description:
        return jsonify({"error": "description is required"}), 400

    amount = request.form.get('amount', '').strip()
    if not amount:
        return jsonify({"error": "amount is required"}), 400

    instrument_id = request.form.get('instrument_id', '').strip()
    if not instrument_id:
        return jsonify({"error": "instrument_id is required"}), 400

    db = current_app.config['db']
    try:
        transaction = create_transaction(
            db,
            transaction_date_str=transaction_date,
            description=description,
            amount_str=amount,
            instrument_id=instrument_id,
            posted_date_str=posted_date
        )
        db.session.commit()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    raw_tags = request.form.get('tags', '').strip()
    if raw_tags:
        for tag in raw_tags.split(','):
            tag = tag.strip()
            if tag:
                db.session.add(TransactionTag(transaction_id=transaction.id, tag=tag))
        db.session.commit()

    return jsonify(transaction.json()), 201


@bp.put('/<int:transaction_id>')
def update_transaction(transaction_id):
    db = current_app.config['db']
    transaction = db.session.query(Transaction).get_or_404(transaction_id)

    transaction_date = request.form.get('transaction_date', '').strip()
    if not transaction_date:
        return jsonify({"error": "transaction_date is required"}), 400

    posted_date = request.form.get('posted_date', '').strip()
    if not posted_date:
        return jsonify({"error": "posted_date is required"}), 400

    description = request.form.get('description', '').strip()
    if not description:
        return jsonify({"error": "description is required"}), 400

    amount = request.form.get('amount', '').strip()
    if not amount:
        return jsonify({"error": "amount is required"}), 400

    instrument_id = request.form.get('instrument_id', '').strip()
    if not instrument_id:
        return jsonify({"error": "instrument_id is required"}), 400

    try:
        transaction.transaction_date = parse_date(transaction_date)
        transaction.posted_date = parse_date(posted_date)
        transaction.amount = parse_amount(amount)
        transaction.instrument_id = parse_instrument_id(db, instrument_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    transaction.description = description
    db.session.commit()
    return jsonify(transaction.json()), 200


@bp.delete('/<int:transaction_id>')
def delete_transaction(transaction_id):
    db = current_app.config['db']
    transaction = db.session.query(Transaction).get_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transaction deleted"}), 200


@bp.post('/tag/')
def add_tag_to_transaction():
    db = current_app.config['db']

    transaction_id = request.form.get('transaction_id', '').strip()
    if not transaction_id:
        return jsonify({"error": "transaction_id is required"}), 400
    try:
        transaction_id = int(transaction_id)
        db.session.query(Transaction).get_or_404(transaction_id)
    except ValueError:
        return jsonify({"error": "Invalid transaction_id"}), 400

    tag = request.form.get('tag', '').strip()
    if not tag:
        return jsonify({"error": "tag is required"}), 400

    transaction_tag = TransactionTag(transaction_id=transaction_id, tag=tag)
    db.session.add(transaction_tag)
    db.session.commit()
    return jsonify(transaction_tag.json()), 201


@bp.delete('/tag/')
def remove_tag_from_transaction():
    db = current_app.config['db']

    transaction_id = request.args.get('transaction_id', '').strip()
    if not transaction_id:
        return jsonify({"error": "transaction_id is required"}), 400
    try:
        transaction_id = int(transaction_id)
        db.session.query(Transaction).get_or_404(transaction_id)
    except ValueError:
        return jsonify({"error": "Invalid transaction_id"}), 400

    tag = request.args.get('tag', '').strip()
    if not tag:
        return jsonify({"error": "tag is required"}), 400

    transaction_tag = db.session.query(TransactionTag).filter_by(
        transaction_id=transaction_id, tag=tag
    ).first()
    if transaction_tag is None:
        return jsonify({"error": "Tag not found"}), 404

    db.session.delete(transaction_tag)
    db.session.commit()
    return jsonify({"message": "Tag removed"}), 200
