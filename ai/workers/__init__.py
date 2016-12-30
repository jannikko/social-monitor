from pytz import utc
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ProcessPoolExecutor
from models import engine

jobstores = {
    'default': SQLAlchemyJobStore(engine=engine)
}

executors = {
    'processpool': ProcessPoolExecutor(4)
}

job_defaults = {
    'coalesce': False,
    'max_instances': 4
}

scheduler = BackgroundScheduler(jobstores=jobstores, executors=executors, job_defaults=job_defaults, timezone=utc)
