from flask import Flask, request, abort
from models import application, engine, account
from sqlalchemy.sql.expression import insert, select
from enums import SOURCES
import json
import models.topic
import models.topic_model

app = Flask(__name__)


def create_timeline_response(topic_model, account_topics):
    return {'topicModel': {'topics': topic_model['topics'], 'date': str(topic_model['date'])},
            'topic': [{'account': {'name': account_topic['name'],
                                   'source': account_topic['source']},
                       'cluster': account_topic['cluster'],
                       'x': account_topic['x'],
                       'y': account_topic['y'],
                       'date': str(account_topic['date'])} for account_topic in account_topics]}


@app.route('/timeline/<application_id>', methods=['GET'])
def timeline(application_id):
    with engine.begin() as connection:
        topic_model = models.topic_model.select_latest(application_id, SOURCES['TWITTER'], connection)
        if not topic_model:
            abort(404)
        account_topics = models.topic.select_multiple_join_accounts(topic_model['id'], connection)
        view_representation = create_timeline_response(topic_model, account_topics)
        return json.dumps(view_representation)


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
                                                         'application': application_id,
                                                         'isMain': True})
                conn.execute(insert_account)

    return str()


if __name__ == '__main__':
    # Start the web service
    app.run()
