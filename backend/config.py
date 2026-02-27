import os

class Config:
    _url = os.environ.get('DATABASE_URL')
    if _url is None:
        import getpass
        _username = getpass.getpass(prompt='Postgres username: ')
        _password = getpass.getpass(prompt='Postgres password: ')
        _url = f'postgresql://{_username}:{_password}@localhost:5430/juiko_db'
        del _username, _password
    SQLALCHEMY_DATABASE_URI = _url
    del _url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
