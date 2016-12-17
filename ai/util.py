import json
from urllib.request import Request


def create_post_request(url, data):
    request_body = json.dumps(data).encode('utf-8')
    return Request(url, data=request_body, headers={'content-type': 'application/json'})


def itermap_to_dict(func):
    def new_func(*original_args, **original_kwargs):
        return (dict(result) for result in func(*original_args, **original_kwargs))

    return new_func
