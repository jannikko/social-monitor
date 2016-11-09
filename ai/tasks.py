import config
from urllib.request import urlopen
from celery import Celery

REDIS_URI = config.get('REDIS_URI')
TWITTER_TIMELINE = 'http://localhost:8081/timeline/twitter/%(id)'

celery = Celery('tasks', backend=REDIS_URI, broker=REDIS_URI)


@celery.task()
def timeline(application_id):
    # Read the
    urlopen(TWITTER_TIMELINE % {'id': None}, {'applicationId': application_id, 'accounts': []})
    return application_id
