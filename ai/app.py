from flask import Flask, request, abort
from tasks import timeline
from models import application, engine, topic_group, account
from sqlalchemy.sql.expression import insert, select
from enums import SOURCES

app = Flask(__name__)


def restart_task():
    pass


@app.route('/timeline/start', methods=['POST'])
def start():
    req = request.get_json()
    application_id = req['applicationId']
    # Needs real validation
    if not application_id:
        abort(400)

    # Move this to controller
    with engine.begin() as conn:
        select_stmt = select([application]).where(application.c.id == application_id)
        result = conn.execute(select_stmt).fetchall()
        if result:
            # Redirect to register
            timeline.delay(application_id)
        else:
            abort(404)

    return str()


@app.route('/timeline/register', methods=['POST'])
def register():
    req = request.get_json()
    application_id = req['applicationId']
    twitter_accounts = req['twitterAccounts']

    # Needs real validation
    if not application_id or not twitter_accounts:
        abort(400)

    # Move this to controller
    with engine.begin() as conn:
        select_stmt = select([application]).where(application.c.id == application_id)
        result = conn.execute(select_stmt).fetchall()
        if result:
            # Redirect to restart task
            abort(302)
        else:
            insert_application = insert(application, values={'id': application_id})
            conn.execute(insert_application)

            for twitter_account in twitter_accounts:
                insert_account = insert(account, values={'name': twitter_account,
                                                         'source': SOURCES['TWITTER'],
                                                         'application': application_id})
                conn.execute(insert_account)

            timeline.delay(application_id)

    return str()


if __name__ == '__main__':
    # Start the web service
    app.run()
