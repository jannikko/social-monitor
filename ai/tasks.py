import config
from celery import Celery
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from enums import SOURCES
from models import account, topic_group, topic, engine
from sqlalchemy.sql.expression import insert, select, update
from topicextraction import find_topics
import json

TWITTER_TIMELINE = config.get('TWITTER_TIMELINE')
REDIS_URI = config.get('REDIS_URI')

celery = Celery('tasks', backend=REDIS_URI, broker=REDIS_URI)


def create_timeline_request(application_id, twitter_accounts):
    accounts = []
    for acc in twitter_accounts:
        account_data = {'screenName': acc['name']}
        if 'since_id' in acc and acc['since_id']:
            account_data['sinceId'] = acc['since_id']

        accounts.append(account_data)

    request_body = json.dumps({'applicationId': application_id, 'accounts': accounts}).encode('utf-8')
    return Request(TWITTER_TIMELINE, data=request_body, headers={'content-type': 'application/json'})


def find_id_by_name(accounts, name):
    for account in accounts:
        if account['name'] == name:
            return account['id']

    return None


# TODO since_id speichern, tweets abspeichern, window implementieren, tests + refactoring, nachfragen online lda

@celery.task()
def timeline(application_id):
    with engine.begin() as conn:
        account_select = select([account]).where(
            account.c.application == application_id and account.c.source == SOURCES['TWITTER'])

        twitter_accounts = conn.execute(account_select).fetchall()
        request = create_timeline_request(application_id, twitter_accounts)

        try:
            timeline_response = urlopen(request)
            timeline_response_code = timeline_response.getcode()

            if timeline_response_code == 201:
                datastream_resource = timeline_response.getheader('Location')
                datastream_response = json.loads(urlopen(datastream_resource).read().decode('utf-8'))

                accounts = [
                    {'username': stream['screenName'], 'feed': [status['text'] for status in stream['timeline']]}
                    for stream in datastream_response['dataStream']
                    if 'timeline' in stream and len(stream['timeline']) > 0]

                account_names = [a['username'] for a in accounts]
                feeds = [a['feed'] for a in accounts]

                W, H, wordvec = find_topics(feeds)

                topic_group_insert = insert(topic_group, values={'application': application_id, 'features': H.tolist(),
                                                                 'wordvec': wordvec})
                topic_group_id = conn.execute(topic_group_insert).inserted_primary_key[0]

                for name, weights in zip(account_names, W):
                    account_id = find_id_by_name(twitter_accounts, name)
                    topic_insert = insert(topic, values={'weights': weights.tolist(),
                                                         'topic_group': topic_group_id,
                                                         'account': account_id})
                    conn.execute(topic_insert)

        except HTTPError as e:
            print(e.read())