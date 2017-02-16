from sqlalchemy import create_engine, insert, select
from enums import SOURCES
from models.schema import metadata, source
import config

db_config = {
    'username': config.get('DB_USER'),
    'password': config.get('DB_PASSWORD'),
    'host': config.get('DB_HOST'),
    'port': config.get('DB_PORT'),
    'database': config.get('DB_NAME')
}

print("Connecting to database with the following credentials:", db_config)

engine = create_engine('postgres://{username}:{password}@{host}:{port}/{database}'.format(**db_config), echo=True)

metadata.create_all(engine)

engine.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

with engine.begin() as conn:
    select_stmt = select([source]).where(source.c.id == SOURCES['TWITTER'])
    if not conn.execute(select_stmt).fetchall():
        insert_stmt = insert(source, values={'id': SOURCES['TWITTER']})
        conn.execute(insert_stmt)
