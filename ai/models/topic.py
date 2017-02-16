from sqlalchemy import insert, select, update, and_
from sqlalchemy.sql.expression import func
from models.schema import topic, account
from util import itermap_to_dict
from typing import Iterable
from sqlalchemy.engine import Connection


def insert_one(account_id: str, weights: Iterable, topic_iteration: str, conn: Connection) -> None:
    stmt = insert(topic, values={'account': account_id, 'weights': weights, 'topic_iteration': topic_iteration})
    conn.execute(stmt)


@itermap_to_dict
def select_multiple(topic_iteration_id: str, conn: Connection) -> Iterable:
    stmt = select([topic]).where(topic.c.topic_iteration == topic_iteration_id)
    return conn.execute(stmt)


def update_cluster(account_id: str, topic_iteration_id: str, cluster: int, x: float, y: float,
                   conn: Connection) -> None:
    """Update the cluster and the x and y values of the topic"""
    stmt = update(topic).where(
        and_(topic.c.account == account_id, topic.c.topic_iteration == topic_iteration_id)).values(
        cluster=cluster, x=x, y=y)
    conn.execute(stmt)


@itermap_to_dict
def select_multiple_join_accounts(topic_iteration_id: str, conn: Connection) -> Iterable:
    stmt = select([topic, account.c.name, account.c.source]).where(
        and_(topic.c.topic_iteration == topic_iteration_id, topic.c.account == account.c.id))
    return conn.execute(stmt)


@itermap_to_dict
def select_latest_for_model(topic_model_id: str, conn: Connection) -> Iterable:
    """Select all accounts for the topic model and join them with their topics"""
    stmt = select([topic.c.id, func.max(topic.c.date).label('date')]).where(
        and_(topic.c.topic_model == topic_model_id, account.c.id == topic.c.account)).distinct(
        topic.c.account).group_by(topic.c.id)
    return conn.execute(stmt)
