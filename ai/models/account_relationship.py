from sqlalchemy import insert, delete
from models.account import select_one_id, insert_one, update_one_cursor
from models.schema import account_relationship


def delete_follower_account_rel(account_id, conn):
    stmt = delete(account_relationship).where(account_relationship.c.follower == account_id)
    conn.execute(stmt)


def insert_multiple(application_id, account_name, followers, source, cursor, conn):
    trans = conn.begin()
    try:
        account_id = select_one_id(application_id, account_name, source, conn)
        for follower in followers:
            follower_id = select_one_id(application_id, follower, source, conn)

            if not follower_id:
                follower_id = insert_one(application_id, follower, False, source, conn)

            stmt_relationship = insert(account_relationship, values={'account': account_id, 'follower': follower_id})
            conn.execute(stmt_relationship)

        update_one_cursor(account_id, cursor, conn)
        trans.commit()
    except Exception as e:
        trans.rollback()
