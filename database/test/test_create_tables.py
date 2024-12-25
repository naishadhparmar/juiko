import pytest
import psycopg2
from psycopg2 import sql
import os

project_root = os.path.dirname(os.path.dirname(os.getcwd()))

@pytest.fixture(scope="module")
def db_connection():
    """Set up a connection to the test database."""
    conn = psycopg2.connect(
        dbname="juikodb",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )
    conn.autocommit = True
    yield conn
    conn.close()

def test_remove_tables(db_connection):
    """Run the remove_tables.sql script."""
    with db_connection.cursor() as cursor:
        with open(project_root+"/database/sql/remove_tables.sql", "r") as f:
            cursor.execute(f.read())

def test_create_tables(db_connection):
    """Run the create_tables.sql script."""
    with db_connection.cursor() as cursor:
        with open(project_root+"/database/sql/create_tables.sql", "r") as f:
            cursor.execute(f.read())

def test_tables_exist(db_connection):
    """Check if required tables exist."""
    with db_connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = {row[0] for row in cursor.fetchall()}
        assert "wop_user" in tables
        assert "lkp_financial_statement_parsing_status" in tables
        assert "wop_financial_statement" in tables

def test_columns_in_wop_financial_statement(db_connection):
    """Verify columns in the wop_financial_statement table."""
    with db_connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'wop_financial_statement';
        """)
        columns = {row[0]: row[1] for row in cursor.fetchall()}
        print(columns["file_path"])
        assert columns["id"] == "integer"
        assert columns["uploader_id"] == "integer"
        assert columns["file_name"] == "character varying"
        assert columns["file_path"] == "text"
        assert columns["upload_date"] == "timestamp without time zone"
        assert columns["parsing_status"] == "integer"

def test_columns_in_wop_user(db_connection):
    """Verify columns in the wop_user table."""
    with db_connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'wop_user';
        """)
        columns = {row[0]: row[1] for row in cursor.fetchall()}
        assert columns["id"] == "integer"
        assert columns["user_email"] == "character varying"
        assert columns["user_password"] == "character varying"
        assert columns["created_date"] == "timestamp without time zone"