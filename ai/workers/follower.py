from urllib.request import urlopen, HTTPError
from util import create_post_request, read_response
from http.client import HTTPException
from models import engine
from enums import SOURCES
import models.account_relationship
import json
import models.account
import config

TWITTER_FOLLOWERS = config.get('TWITTER_FOLLOWERS')


def create_timeline_payload(application_id: str, count: int, users: object) -> object:
    return create_post_request(TWITTER_FOLLOWERS, {'applicationId': application_id,
                                                   'accounts': [{'screenName': user['name'],
                                                                 'count': count,
                                                                 'cursor': user['next_cursor']} for user in users]})


def request_followers(application_id: str) -> None:
    """Request the followers for all main accounts. Uses the fetcher service to request followers in parallel"""
    follower_count = 200
    request_limit = 15
    request_chunks = 5
    with engine.connect() as connection:
        requests_left = request_limit

        while requests_left > 0:
            try:
                limit = min(requests_left, request_chunks)
                main_users = list(models.account.select_main_with_followers(application_id, SOURCES['TWITTER'], limit, connection))

                if not main_users:
                    return

                requests_left -= len(main_users)
                request = create_timeline_payload(application_id, follower_count, main_users)
                followers_response = urlopen(request)
                followers_response_code = followers_response.getcode()

                if followers_response_code == 200:
                    response = json.loads(read_response(followers_response))

                    for followers in response:
                        result = followers['result']
                        name = followers['screenName']
                        users = result['users']
                        cursor = result['next_cursor']
                        user_followers = [user['screen_name'] for user in users if not user['protected']]
                        models.account_relationship.insert_multiple(application_id, name, user_followers,
                                                                    SOURCES['TWITTER'], cursor, connection)
                else:
                    raise IOError('Invalid response from Fetcher Service')

            except (ValueError, HTTPException) as e:
                print(e)
            except HTTPError as e:
                print(e.read())
