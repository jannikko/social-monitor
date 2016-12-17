from sqlalchemy import select
from models import application


def select_multiple(conn):
    stmt = select([application])
    results = conn.execute(stmt)
    return [dict(result) for result in results]
