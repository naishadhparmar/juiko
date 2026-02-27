from flask import current_app, Blueprint, request, jsonify, url_for
import requests
from models import Transaction, Instrument, TransactionTag
from sqlalchemy import insert
from datetime import datetime

bp = Blueprint('transaction_bp', __name__)

@bp.get('/')
def get_all_transactions():
    db = current_app.config['db']
    transactions = db.session.query(Transaction).all()
    instruments = db.session.query(Instrument).all()
    
    # Build instrument lookup
    instrument_lookup = {}
    for instrument in instruments:
        instrument_lookup[str(instrument.id)] = instrument.json()
    
    return jsonify({
        "transactions": [transaction.json() for transaction in transactions],
        "lookup": {
            "instrument": instrument_lookup
        }
    })

@bp.get('/<int:transaction_id>')
def get_transaction_by_id(transaction_id):
    db = current_app.config['db']
    transaction = db.session.query(Transaction).get_or_404(transaction_id)
    return jsonify(transaction.json())

@bp.post('/')
def add_transaction():
    transaction_date = request.form.get('transaction_date', '')
    if transaction_date == '':
        return jsonify({"error": "transaction_date is required"}), 400
    else:
        try:
            transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Invalid transaction_date format. Use YYYY-MM-DD."}), 400

    posted_date = request.form.get('posted_date', '')
    if posted_date == '':
        return jsonify({"error": "posted_date is required"}), 400
    else:
        try:
            posted_date = datetime.strptime(posted_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Invalid posted_date format. Use YYYY-MM-DD."}), 400

    description = request.form.get('description', '')
    if description == '':
        return jsonify({"error": "description is required"}), 400

    amount = request.form.get('amount', '')
    if amount == '':
        return jsonify({"error": "amount is required"}), 400
    else:
        try:
            amount = float(amount)
        except ValueError:
            return jsonify({"error": "Invalid amount format. Use a number."}), 400

    db = current_app.config['db']
    instrument_id = request.form.get('instrument_id', '')
    if instrument_id == '':
        return jsonify({"error": "instrument_id is required"}), 400
    else:
        try:
            instrument_id = int(instrument_id)
            db.session.query(Instrument).get_or_404(instrument_id)
        except ValueError:
            return jsonify({"error": "Invalid instrument id"}), 400

    transaction = Transaction(transaction_date = transaction_date, posted_date = posted_date, description = description,
                              amount = amount, instrument_id = instrument_id)
    db.session.add(transaction)
    db.session.commit()
    print("Transaction committed", transaction.id)
    if request.form.get('tags', '') != '':
        tags = request.form.get('tags', '').split(',')
        for tag in tags:
            tag = tag.strip()
            if tag != '':
                url = url_for('transaction_bp.add_tag_to_transaction', _external=True)
                print(url)
                response = requests.post(url, data={'transaction_id': transaction.id, 'tag': tag})
                print(response.text)
    return jsonify(transaction.json()), 201

@bp.put('/<int:transaction_id>')
def update_transaction(transaction_id):
    db = current_app.config['db']
    transaction = db.session.query(Transaction).get_or_404(transaction_id)

    transaction_date = request.form.get('transaction_date', '')
    if transaction_date == '':
        return jsonify({"error": "transaction_date is required"}), 400
    else:
        try:
            transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Invalid transaction_date format. Use YYYY-MM-DD."}), 400

    posted_date = request.form.get('posted_date', '')
    if posted_date == '':
        return jsonify({"error": "posted_date is required"}), 400
    else:
        try:
            posted_date = datetime.strptime(posted_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"error": "Invalid posted_date format. Use YYYY-MM-DD."}), 400

    description = request.form.get('description', '')
    if description == '':
        return jsonify({"error": "description is required"}), 400

    amount = request.form.get('amount', '')
    if amount == '':
        return jsonify({"error": "amount is required"}), 400
    else:
        try:
            amount = float(amount)
        except ValueError:
            return jsonify({"error": "Invalid amount format. Use a number."}), 400

    instrument_id = request.form.get('instrument_id', '')
    if instrument_id == '':
        return jsonify({"error": "instrument_id is required"}), 400
    else:
        try:
            instrument_id = int(instrument_id)
            db.session.query(Instrument).get_or_404(instrument_id)
        except ValueError:
            return jsonify({"error": "Invalid instrument id"}), 400

    transaction.transaction_date = transaction_date
    transaction.posted_date = posted_date
    transaction.description = description
    transaction.amount = amount
    transaction.instrument_id = instrument_id
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
    transaction_id = request.form.get('transaction_id', '')
    db = current_app.config['db']
    if transaction_id == '':
        return jsonify({"error": "transaction_id is required"}), 400
    else:
        try:
            transaction_id = int(transaction_id)
            db.session.query(Transaction).get_or_404(transaction_id)
        except ValueError:
            return jsonify({"error": "Invalid transaction id"}), 400

    tag = request.form.get('tag', '')
    if tag == '':
        return jsonify({"error": "tag is required"}), 400

    db = current_app.config['db']
    transaction_tag = TransactionTag(transaction_id=transaction_id, tag=tag)
    db.session.add(transaction_tag)
    db.session.commit()
    return jsonify(transaction_tag.json()), 201

@bp.delete('/tag/')
def remove_tag_from_transaction():
    db = current_app.config['db']

    transaction_id = request.args.get('transaction_id', '')
    if transaction_id == '':
        return jsonify({"error": "transaction_id is required"}), 400
    else:
        try:
            transaction_id = int(transaction_id)
            db.session.query(Transaction).get_or_404(transaction_id)
        except ValueError:
            return jsonify({"error": "Invalid transaction id"}), 400

    tag = request.args.get('tag', '')
    if tag == '':
        return jsonify({"error": "tag is required"}), 400

    transaction_tag = db.session.query(TransactionTag).filter_by(transaction_id=transaction_id, tag=tag).first()
    if transaction_tag is None:
        return jsonify({"error": "Tag not found"}), 404

    db.session.delete(transaction_tag)
    db.session.commit()
    return jsonify({"message": "Tag removed"}), 200