import config
import models.application as application
from celery import Celery
from celery.schedules import crontab
from models import engine
from workers.followers import requestFollowers
from workers.timeline import request_user_timelines
from workers.topic_model import createTopicModel

REDIS_URI = config.get('REDIS_URI')

celery = Celery('tasks', backend=REDIS_URI, broker=REDIS_URI)


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    apps = None
    with engine.connect() as connection:
        apps = application.select_multiple(connection)

    if apps:
        for app in apps:
            sender.add_periodic_task(crontab(minute='*/15'), followers.s(app['id']),
                                     name='request followers every 15 minutes')
            sender.add_periodic_task(crontab(minute='*/15'), timeline.s(app['id']),
                                     name='request timelines every 15 minutes')
            sender.add_periodic_task(crontab(hour='*/1'), topic_model.s(app['id']),
                                     name='create topic model every hour')


@celery.task
def topic_model(application_id):
    engine.dispose()
    createTopicModel(application_id)


@celery.task
def followers(application_id):
    engine.dispose()
    requestFollowers(application_id)


@celery.task
def timeline(application_id):
    engine.dispose()
    requests_left = request_user_timelines(application_id, is_main=True)
    request_user_timelines(application_id, is_main=False, requests_left=requests_left)
