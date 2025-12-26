from flask import Flask
from sqlalchemy import select
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Session
from models import Transaction, Instrument, InstrumentType
from config import Config
import datetime
from controllers.transaction import bp as transaction_bp
from controllers.instrument import bp as instrument_bp

app = Flask(__name__)
app.register_blueprint(transaction_bp, url_prefix='/transaction')
app.register_blueprint(instrument_bp, url_prefix='/instrument')
app.config.from_object(Config)
db = SQLAlchemy(app)
app.config['db'] = db

@app.route("/")
def index():
    return '<p>Skeleton</p>'