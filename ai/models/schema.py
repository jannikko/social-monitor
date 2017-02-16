from sqlalchemy import Table, Column, Integer, String, MetaData, ForeignKey, TypeDecorator, CHAR, \
    UniqueConstraint, Boolean, BIGINT, CheckConstraint, DateTime, ARRAY, Float
from sqlalchemy.sql.expression import func
from sqlalchemy.dialects.postgresql import UUID
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

topic_iteration = Table('topic_iteration', metadata,
                        Column('id', Integer, primary_key=True),
                        Column('topic_model', Integer, ForeignKey('topic_model.id'), nullable=False),
                        Column('date', DateTime(timezone=True), server_default=func.now(), nullable=False))


topic = Table('topic', metadata,
              Column('id', Integer, primary_key=True),
              Column('account', Integer, ForeignKey('account.id'), nullable=False),
              Column('topic_iteration', Integer, ForeignKey('topic_iteration.id'), nullable=False),
              Column('weights', ARRAY(Float), nullable=False),
              Column('cluster', Integer, nullable=True),
              Column('x', Float, nullable=True),
              Column('y', Float, nullable=True))
