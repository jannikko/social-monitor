from os.path import join, dirname
from dotenv import load_dotenv
import os


# Load .env file for local development
if 'APP_ENV' in os.environ and os.environ['APP_ENV'] == 'development':
    load_dotenv(join(dirname(__file__), '.env'))

DEFAULTS = {
    'REDIS_URI': 'redis://localhost:6379',
    'TWITTER_TIMELINE': 'http://localhost:8081/twitter/timeline'
}


def get(key):
    if key in os.environ:
        return os.environ[key]
    elif key in DEFAULTS:
        return DEFAULTS[key]
    else:
        return ""
