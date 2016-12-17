from sqlalchemy import select, update, and_, not_, delete, insert
from sqlalchemy.sql.expression import func
from models import account, timeline
from util import itermap_to_dict


@itermap_to_dict
def select_oldest_timelines(account_ids, conn):
    stmt = select([account, func.min(timeline.c.id).label('max_id')]) \
        .select_from(account.outerjoin(timeline, timeline.c.account == account.c.id)).where(
        and_(not_(account.c.isComplete), account.c.id.in_(account_ids))).group_by(account.c.id)
    return conn.execute(stmt)


def insert_one(application_id, name, isMain, source, conn):
    stmt = insert(account, values={'application': application_id,
                                   'name': name,
                                   'isMain': isMain,
                                   'source': source})
    return conn.execute(stmt).inserted_primary_key[0]


def update_one_cursor(account_id, cursor, conn):
    update_cursor_stmt = update(account).where(account.c.id == account_id).values(next_cursor=cursor)
    conn.execute(update_cursor_stmt)


def select_one_id(application_id, account_name, source, conn):
    stmt = select([account.c.id]) \
        .where(and_(account.c.name == account_name,
                    account.c.application == application_id,
                    account.c.source == source))

    result = conn.execute(stmt).first()
    return result[0] if result else None


def delete_one_by_id(account_id, conn):
    stmt = delete(account).where(account.c.id == account_id)
    conn.execute(stmt)


@itermap_to_dict
def select_main_with_followers(application_id, source, conn):
    stmt = select([account]).where(
        and_(account.c.isMain,
             account.c.next_cursor != 0,
             account.c.application == application_id,
             account.c.source == source)).order_by(account.c.id)
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple_incomplete(application_id, source, conn, ismain=True, limit=None, exclude=[]):
    stmt = select([account], not_(account.c.id.in_(exclude))).where(
        and_(account.c.isMain if ismain else not_(account.c.isMain),
             account.c.application == application_id,
             not_(account.c.isComplete),
             account.c.source == source)).order_by(account.c.id).limit(limit)
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple_complete(application_id, source, conn):
    stmt = select([account]).where(
        and_(account.c.application == application_id,
             account.c.isComplete,
             account.c.source == source)).order_by(account.c.id)
    return conn.execute(stmt)


def select_multiple_by_id(account_ids, conn):
    stmt = select([account], account.c.id.in_(account_ids))
    results = conn.execute(stmt)
    return [dict(result) for result in results]


def select_one_by_id(account_id, conn):
    stmt = select([account]).where(account.c.id == account_id)
    result = conn.execute(stmt).first()
    return dict(result)


def update_one_iscomplete(account_id, conn):
    stmt = update(account).where(account.c.id == account_id).values(isComplete=True)
    conn.execute(stmt)
