from sqlalchemy import select, update, and_, not_, delete, insert
from sqlalchemy.sql.expression import func
from models.schema import account, timeline
from util import itermap_to_dict
from sqlalchemy.engine import Connection
from typing import Iterable


@itermap_to_dict
def select_oldest_timelines(account_ids: Iterable, conn: Connection) -> Iterable:
    """Select the oldest timeline entry for each account in account_ids"""
    stmt = select([account, func.min(timeline.c.id).label('max_id')]) \
        .select_from(account.outerjoin(timeline, timeline.c.account == account.c.id)).where(
        and_(not_(account.c.isComplete), account.c.id.in_(account_ids))).group_by(account.c.id)
    return conn.execute(stmt)


def insert_one(application_id: str, name: str, is_main: bool, source: str, conn: Connection) -> str:
    """Insert one account"""
    stmt = insert(account, values={'application': application_id,
                                   'name': name,
                                   'isMain': is_main,
                                   'source': source})
    return conn.execute(stmt).inserted_primary_key[0]


def update_one_cursor(account_id: str, cursor: str, conn: Connection) -> None:
    """Update the cursor of one account"""
    update_cursor_stmt = update(account).where(account.c.id == account_id).values(next_cursor=cursor)
    conn.execute(update_cursor_stmt)


def select_one_id(application_id: str, account_name: str, source: str, conn: Connection) -> str:
    """Select one id"""
    stmt = select([account.c.id]) \
        .where(and_(account.c.name == account_name,
                    account.c.application == application_id,
                    account.c.source == source))

    result = conn.execute(stmt).first()
    return result[0] if result else None


def delete_one_by_id(account_id: str, conn: Connection) -> None:
    stmt = delete(account).where(account.c.id == account_id)
    conn.execute(stmt)


@itermap_to_dict
def select_main_with_followers(application_id: str, source: str, limit: int, conn: Connection) -> Iterable:
    """Select a main account that still has followers left to fetch"""
    stmt = select([account]).where(
        and_(account.c.isMain,
             account.c.next_cursor != 0,
             account.c.application == application_id,
             account.c.source == source)).order_by(account.c.id).limit(limit)
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple_incomplete(application_id: str, source: str, conn: Connection, ismain=True, limit=None, exclude=[]) -> Iterable:
    """Select multiple accounts that have not been completely fetched"""
    stmt = select([account], not_(account.c.id.in_(exclude))).where(
        and_(account.c.isMain if ismain else not_(account.c.isMain),
             account.c.application == application_id,
             not_(account.c.isComplete),
             account.c.source == source)).order_by(account.c.id).limit(limit)
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple_complete(application_id: str, source: str, conn: Connection) -> Iterable:
    """Select multiple accounts that have been completely fetched"""
    stmt = select([account]).where(
        and_(account.c.application == application_id,
             account.c.isComplete,
             account.c.source == source)).order_by(account.c.id)
    return conn.execute(stmt)


@itermap_to_dict
def select_multiple_by_id(account_ids: Iterable, conn: Connection) -> Iterable:
    stmt = select([account], account.c.id.in_(account_ids))
    return conn.execute(stmt)


def select_one_by_id(account_id: str, conn: Connection) -> dict:
    stmt = select([account]).where(account.c.id == account_id)
    result = conn.execute(stmt).first()
    return dict(result) if result else None


def update_one_iscomplete(account_id, is_complete, conn) -> Iterable:
    """Update the 'isComplete' attribute"""
    stmt = update(account).where(account.c.id == account_id).values(isComplete=is_complete)
    conn.execute(stmt)
