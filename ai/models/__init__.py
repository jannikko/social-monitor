from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey, TypeDecorator, CHAR, \
    insert, select, UniqueConstraint, Boolean, BIGINT, CheckConstraint, DateTime, ARRAY, Float
from sqlalchemy.sql.expression import func, text
from sqlalchemy.dialects.postgresql import UUID
from enums import SOURCES
import config
import uuid


class GUID(TypeDecorator):
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

engine.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

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
                Column('isMain', Boolean, nullable=False),
                Column('isComplete', Boolean, default=False, nullable=False),
                Column('next_cursor', BIGINT, default=-1, nullable=False),
                UniqueConstraint('name', 'source', 'application'))

timeline = Table('timeline', metadata,
                 Column('id', BIGINT),
                 Column('account', Integer, ForeignKey('account.id'), nullable=False),
                 Column('text', String, nullable=False),
                 Column('date', DateTime, nullable=False),
                 Column('processed', Boolean, nullable=False, default=False),
                 UniqueConstraint('account', 'id'))

account_relationship = Table('account_relationship', metadata,
                             Column('account', Integer, ForeignKey('account.id'), nullable=False),
                             Column('follower', Integer, ForeignKey('account.id'), nullable=False),
                             CheckConstraint('account != follower', name='checkRelationship'))

topic_model = Table('topic_model', metadata,
                    Column('id', Integer, primary_key=True),
                    Column('date', DateTime(timezone=True), server_default=func.now(), nullable=False),
                    Column('application', GUID, ForeignKey('application.id'), nullable=False),
                    Column('topics', ARRAY(String), nullable=False),
                    Column('source', String, ForeignKey('source.id'), nullable=False))

topic = Table('topic', metadata,
              Column('account', Integer, ForeignKey('account.id'), nullable=False),
              Column('topic_model', Integer, ForeignKey('topic_model.id'), nullable=False),
              Column('weights', ARRAY(Float), nullable=False),
              Column('cluster', Integer, nullable=True),
              Column('x', Float, nullable=True),
              Column('y', Float, nullable=True),
              Column('date', DateTime(timezone=True), server_default=func.now(), nullable=False))

metadata.create_all(engine)

with engine.begin() as conn:
    select_stmt = select([source]).where(source.c.id == SOURCES['TWITTER'])
    if not conn.execute(select_stmt).fetchall():
        insert_stmt = insert(source, values={'id': SOURCES['TWITTER']})
        conn.execute(insert_stmt)
