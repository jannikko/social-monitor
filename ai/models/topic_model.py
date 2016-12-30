from sqlalchemy import insert, select, and_
from models.schema import topic_model


def select_latest(application_id, source, conn):
    stmt = select([topic_model]).where(
        and_(topic_model.c.application == application_id, topic_model.c.source == source)).order_by(
        topic_model.c.date).limit(1)
    result = conn.execute(stmt).first()
    return dict(result) if result else None


def insert_one(application_id, source, topics, conn):
    stmt = insert(topic_model, values={'application': application_id, 'source': source, 'topics': topics})
    return conn.execute(stmt)
