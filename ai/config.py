import os

DEFAULTS = {
    'REDIS_URI': 'redis://localhost:6379',
}


def get(key):
    if key in os.environ:
        return os.environ[key]
    else:
        return DEFAULTS[key]
