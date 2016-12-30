from sqlalchemy import insert, select, and_
from sqlalchemy.sql.expression import func
from models.schema import timeline
from models.account import select_one_id
from util import itermap_to_dict


def select_multiple_oldest(account_ids, conn):
    stmt = select([func.max(timeline.c.id)], timeline.c.account.in_(account_ids)).group_by(timeline.c.id)
    results = conn.execute(stmt)
    return [dict(result) for result in results]


def insert_multiple(application_id, account_name, source, statuses, conn):
    trans = conn.begin()
    try:
        for status in statuses:
            account_id = select_one_id(application_id, account_name, source, conn)
            entry = select([timeline]).where(and_(timeline.c.account == account_id, timeline.c.id == status['id']))

            if conn.execute(entry).fetchall():
                continue

            if account_id:
                timeline_insert_stmt = insert(timeline, values={'account': account_id,
                                                                'id': status['id'],
                                                                'text': status['text'],
                                                                'date': status['date']})
                conn.execute(timeline_insert_stmt)
        trans.commit()
    except:
        trans.rollback()


@itermap_to_dict
def select_one(account_id, conn):
    stmt = select([timeline]).where(timeline.c.account == account_id)
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple(account_ids, conn):
    stmt = select([timeline], timeline.c.account.in_(account_ids))
    return conn.execute(stmt)
