from flask import current_app, Blueprint, request, jsonify
from models import InstrumentType

bp = Blueprint('instrument_type_bp', __name__)

@bp.get('/')
def get_all_instrument_types():
    db = current_app.config['db']
    instrument_types = db.session.query(InstrumentType).all()
    return jsonify([
        {
            "id": it.id,
            "type_name": it.type_name
        } for it in instrument_types
    ])

@bp.get('/<int:instrument_type_id>')
def get_instrument_type_by_id(instrument_type_id):
    db = current_app.config['db']
    instrument_type = db.session.query(InstrumentType).get_or_404(instrument_type_id)
    return jsonify({
        "id": instrument_type.id,
        "type_name": instrument_type.type_name
    })

@bp.post('/')
def add_instrument_type():
    type_name = request.form.get('type_name', '')
    if type_name == '':
        return jsonify({"error": "type_name is required"}), 400

    db = current_app.config['db']
    
    # Check if type_name already exists
    existing = db.session.query(InstrumentType).filter_by(type_name=type_name).first()
    if existing:
        return jsonify({"error": "type_name already exists"}), 400

    instrument_type = InstrumentType(type_name=type_name)
    db.session.add(instrument_type)
    db.session.commit()
    return jsonify({
        "id": instrument_type.id,
        "type_name": instrument_type.type_name
    }), 201

@bp.put('/<int:instrument_type_id>')
def update_instrument_type(instrument_type_id):
    db = current_app.config['db']
    instrument_type = db.session.query(InstrumentType).get_or_404(instrument_type_id)
    
    type_name = request.form.get('type_name', '')
    if type_name == '':
        return jsonify({"error": "type_name is required"}), 400

    # Check if new type_name already exists (but not the current one)
    existing = db.session.query(InstrumentType).filter_by(type_name=type_name).first()
    if existing and existing.id != instrument_type_id:
        return jsonify({"error": "type_name already exists"}), 400

    instrument_type.type_name = type_name
    db.session.commit()
    return jsonify({
        "id": instrument_type.id,
        "type_name": instrument_type.type_name
    })
