from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey, TypeDecorator, CHAR, ARRAY, \
    insert, select, UniqueConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from enums import SOURCES
import datetime
import config
import uuid


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses Postgresql's UUID type, otherwise uses
    CHAR(32), storing as stringified hex values.

    """
    impl = CHAR

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                # hexstring
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            return uuid.UUID(value)


db_config = {
    'username': config.get('DB_USER'),
    'password': config.get('DB_PASSWORD'),
    'host': config.get('DB_HOST'),
    'port': config.get('DB_PORT'),
    'database': config.get('DB_NAME')
}

print("Connecting to database with the following credentials:", db_config)

engine = create_engine('postgres://{username}:{password}@{host}:{port}/{database}'.format(**db_config), echo=True)

metadata = MetaData()

application = Table('application', metadata,
                    Column('id', GUID, primary_key=True))

source = Table('source', metadata,
               Column('id', String, primary_key=True))

account = Table('account', metadata,
                Column('id', Integer, primary_key=True),
                Column('name', String, nullable=False),
                Column('source', String, ForeignKey('source.id'), nullable=False),
                Column('application', GUID, ForeignKey('application.id'), nullable=False),
                Column('since_id', String, nullable=True),
                UniqueConstraint('name', 'source', 'application', name='uix_1'))

topic = Table('topic', metadata,
              Column('id', Integer, primary_key=True),
              Column('result', ARRAY(String), nullable=False),
              Column('date', DateTime, nullable=False, default=datetime.datetime.now()),
              Column('words', ARRAY(Integer), nullable=False),
              Column('topic_group', Integer, ForeignKey('topic_group.id'), nullable=False),
              Column('account', Integer, ForeignKey('account.id'), nullable=False))

topic_group = Table('topic_group', metadata,
                    Column('id', Integer, primary_key=True),
                    Column('application', GUID, ForeignKey('application.id'), nullable=False, unique=True),
                    Column('wordvec', ARRAY(String), nullable=False))

metadata.create_all(engine)

with engine.begin() as conn:
    select_stmt = select([source]).where(source.c.id == SOURCES['TWITTER'])
    if not conn.execute(select_stmt).fetchall():
        insert_stmt = insert(source, values={'id': SOURCES['TWITTER']})
        conn.execute(insert_stmt)
