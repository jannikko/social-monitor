from urllib.request import urlopen, HTTPError
from util import create_post_request
from http.client import HTTPException
from models import engine
from enums import SOURCES
import models.account_relationship
import json
import models.account
import config

TWITTER_FOLLOWERS = config.get('TWITTER_FOLLOWERS')


def create_timeline_payload(application_id, count, users):
    return create_post_request(TWITTER_FOLLOWERS, {'applicationId': application_id,
                                                   'accounts': [{'screenName': user['name'],
                                                                 'count': count,
                                                                 'cursor': user['next_cursor']} for user
                                                                in users]})


def requestFollowers(application_id, count=200, requests_left=15):
    with engine.connect() as connection:
        main_users = models.account.select_main_with_followers(application_id, SOURCES['TWITTER'], connection)
        if not main_users:
            return requests_left

        if len(main_users) > requests_left:
            main_users = main_users[:requests_left]

        max_iterations = requests_left // len(main_users)

        for i in range(max_iterations):
            try:
                main_users = models.account.select_multiple_by_id([user['id'] for user in main_users], connection)

                if not main_users:
                    return requests_left

                request = create_timeline_payload(application_id, count, main_users)
                followers_response = urlopen(request)
                followers_response_code = followers_response.getcode()

                if followers_response_code == 200:
                    response = json.loads(followers_response.read().decode('utf-8'))

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
