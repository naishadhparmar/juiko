import os
import getpass

class Config:

    postgres_username = getpass.getpass(prompt='Postgres username: ')
    postgres_password = getpass.getpass(prompt='Postgres password: ')
    DB_NAME = 'juiko_db'
    URL = 'localhost'
    PORT = 5432
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'postgresql://{postgres_username}:{postgres_password}@{URL}:{PORT}/{DB_NAME}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False # Recommended: turns off feature that uses extra memory
    del postgres_username
    del postgres_password