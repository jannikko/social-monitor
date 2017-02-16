from sqlalchemy import select
from models.schema import application
from sqlalchemy.engine import Connection
from util import itermap_to_dict
from typing import Iterable


@itermap_to_dict
def select_multiple(conn: Connection) -> Iterable:
    stmt = select([application])
    return conn.execute(stmt)
