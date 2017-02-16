from sqlalchemy import insert, select, and_, desc
from models.schema import topic_model, topic
from typing import Iterable
from sqlalchemy.engine import Connection


def select_latest(application_id: str, source: str, conn: Connection) -> dict:
    """Select the latest topic model"""
    stmt = select([topic_model]).where(
        and_(topic_model.c.application == application_id,
             topic_model.c.source == source)).order_by(desc(topic_model.c.date)).limit(1)
    result = conn.execute(stmt).first()
    return dict(result) if result else None


def insert_one(application_id: str, source: str, topics: Iterable, conn: Connection) -> None:
    stmt = insert(topic_model, values={'application': application_id, 'source': source, 'topics': topics})
    conn.execute(stmt)
