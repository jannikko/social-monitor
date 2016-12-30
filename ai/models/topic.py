from sqlalchemy import insert, select, update, and_
from models.schema import topic, account
from util import itermap_to_dict


def insert_one(account_id, weights, topic_model, conn):
    stmt = insert(topic, values={'account': account_id, 'weights': weights, 'topic_model': topic_model})
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple(topic_model_id, conn):
    stmt = select([topic]).where(topic.c.topic_model == topic_model_id)
    return conn.execute(stmt)


def update_cluster(account_id, topic_model_id, cluster, x, y, conn):
    stmt = update(topic).where(and_(topic.c.account == account_id, topic.c.topic_model == topic_model_id)).values(
        cluster=cluster, x=x, y=y)
    conn.execute(stmt)

@itermap_to_dict
def select_multiple_join_accounts(topic_model_id, conn):
    stmt = select([topic, account]).where(and_(topic.c.topic_model == topic_model_id,
                                               account.c.id == topic.c.account))
    return conn.execute(stmt)
