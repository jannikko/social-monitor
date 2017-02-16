from sqlalchemy import insert, select, desc
from models.schema import topic_iteration
from sqlalchemy.engine import Connection


def insert_one(topic_model: str, conn: Connection) -> str:
    stmt = insert(topic_iteration, values={'topic_model': topic_model})
    return conn.execute(stmt).inserted_primary_key[0]


def select_latest(topic_model_id: str, conn: Connection) -> str:
    stmt = select([topic_iteration]).where(topic_iteration.c.topic_model == topic_model_id).order_by(
        desc(topic_iteration.c.date)).limit(1)
    result = conn.execute(stmt).first()
    return dict(result) if result else None
