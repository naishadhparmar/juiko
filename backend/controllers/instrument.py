from flask import current_app, Blueprint, request, jsonify
from models import Instrument, InstrumentType
from sqlalchemy import insert
from datetime import datetime

bp = Blueprint('instrument_bp', __name__)

@bp.get('/')
def get_all_instruments():
    db = current_app.config['db']
    instruments = db.session.query(Instrument).all()
    return jsonify([instrument.json() for instrument in instruments])

@bp.get('/<int:instrument_id>')
def get_instrument_by_id(instrument_id):
    db = current_app.config['db']
    instrument = db.session.query(Instrument).get_or_404(instrument_id)
    return jsonify(instrument.json())

@bp.post('/')
def add_instrument():
    financial_institution = request.form.get('financial_institution', '')
    if financial_institution == '':
        return jsonify({"error": "financial_institution is required"}), 400

    account_name = request.form.get('account_name', '')
    if account_name == '':
        return jsonify({"error": "account_name is required"}), 400

    db = current_app.config['db']
    instrument_type = request.form.get('instrument_type', '')
    if instrument_type == '':
        return jsonify({"error": "instrument_type is required"}), 400
    else:
        try:
            instrument_type = int(instrument_type)
            db.session.query(InstrumentType).get_or_404(instrument_type)
        except ValueError:
            return jsonify({"error": "Invalid instrument type"}), 400

    instrument = Instrument(financial_institution=financial_institution, account_name=account_name, type=instrument_type)
    db.session.add(instrument)
    db.session.commit()
    return jsonify(instrument.json()), 201