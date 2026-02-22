from flask import Flask
from sqlalchemy import select
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Session
from models import Transaction, Instrument, InstrumentType
from config import Config
import datetime
from controllers.transaction import bp as transaction_bp
from controllers.instrument import bp as instrument_bp
from controllers.instrument_type import bp as instrument_type_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.register_blueprint(transaction_bp, url_prefix='/transaction')
app.register_blueprint(instrument_bp, url_prefix='/instrument')
app.register_blueprint(instrument_type_bp, url_prefix='/instrument_type')
app.config.from_object(Config)
db = SQLAlchemy(app)
app.config['db'] = db

@app.route("/")
def index():
    return '<p>Skeleton</p>'