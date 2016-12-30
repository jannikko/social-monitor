from flask import Flask, request, abort
from models.schema import application , account
from models import engine
from sqlalchemy.sql.expression import insert, select
from enums import SOURCES
from workers import scheduler
import workers.followers
import workers.timeline
import workers.topic_model
import json
import models.topic
import models.topic_model

app = Flask(__name__)


def create_topics_response(topic_model, account_topics):
    return {'topicModel': {'topics': topic_model['topics'], 'date': str(topic_model['date'])},
            'topic': [{'account': {'name': account_topic['name'],
                                   'source': account_topic['source']},
                       'cluster': account_topic['cluster'],
                       'weights': account_topic['weights'],
                       'x': account_topic['x'],
                       'y': account_topic['y'],
                       'date': str(account_topic['date'])} for account_topic in account_topics]}


@app.route('/topics/<application_id>', methods=['GET'])
def timeline(application_id):
    with engine.begin() as connection:
        topic_model = models.topic_model.select_latest(application_id, SOURCES['TWITTER'], connection)
        if not topic_model:
            abort(404)
        account_topics = models.topic.select_multiple_join_accounts(topic_model['id'], connection)
        view_representation = create_topics_response(topic_model, account_topics)
        return json.dumps(view_representation)


@app.route('/topics/register', methods=['POST'])
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
            abort(200)
        else:
            insert_application = insert(application, values={'id': application_id})
            conn.execute(insert_application)

            for twitter_account in twitter_accounts:
                insert_account = insert(account, values={'name': twitter_account,
                                                         'source': SOURCES['TWITTER'],
                                                         'application': application_id,
                                                         'isMain': True})
                conn.execute(insert_account)

            scheduler.add_job(workers.followers.request_followers, 'interval', minutes=15,
                              id='request-followers-%s' % application_id, args=[application_id])

            scheduler.add_job(workers.timeline.request_user_timelines, 'interval', minutes=15,
                              id='request-timeline-%s' % application_id, args=[application_id, False])

            scheduler.add_job(workers.topic_model.create_topic_model, 'interval', hours=3,
                              id='create-topic-model-%s' % application_id, args=[application_id])

            scheduler.add_job(workers.topic_model.calculate_topics, 'interval', hours=1,
                              id='calculate-topics-%s' % application_id, args=[application_id])
    return str()


if __name__ == '__main__':
    # Start the web service
    scheduler.start()
    app.run()
