import config
from celery import Celery
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from enums import SOURCES
from models import account, topic_group, topic, engine
from sqlalchemy.sql.expression import insert, select, update
from topicextraction import getarticlewords, makematrix, nnmf, showfeatures
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


@celery.task()
def timeline(application_id):
    with engine.begin() as conn:
        account_select_stmt = select([account]).where(
            account.c.application == application_id and account.c.source == SOURCES['TWITTER'])

        twitter_accounts = conn.execute(account_select_stmt)
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

                all_words, account_words, account_names = getarticlewords(accounts)
                matrix, wordvec = makematrix(all_words, account_words)
                if matrix.shape[1] > 5:
                    W, H = nnmf(matrix, 5, 200)
                    showfeatures(W, H, account_names, wordvec)


        except HTTPError as e:
            print(e.read())

            # insert_topic_group = insert(topic_group)
            # group_id = conn.execute(insert_topic_group).inserted_primary_key[0]
