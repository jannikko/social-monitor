from urllib.request import urlopen, HTTPError
from util import create_post_request, read_response
from http.client import HTTPException
from models import engine
from enums import SOURCES
from typing import Iterable
import models.account_relationship as account_rel_model
import models.account as account_model
import models.timeline as account_timeline
import time
import json
import config

TWITTER_TIMELINE = config.get('TWITTER_TIMELINE')


def convert_twitter_date(date):
    return time.strftime('%Y-%m-%d %H:%M:%S', time.strptime(date, '%a %b %d %H:%M:%S +0000 %Y'))


def create_timeline_payload(users: Iterable) -> Iterable:
    """Creates the payload for the timeline request, adds the name of the user and optionally a max_id"""
    accounts = []
    for user in users:
        u = {'screenName': user['name']}
        if user['max_id']:
            u['maxId'] = user['max_id']
        accounts.append(u)
    return accounts


def map_to_attribute(attr: str, iterable: Iterable) -> Iterable:
    """Maps an iterable containing dictionaries to a specific attribute"""
    return [i[attr] for i in iterable if attr in i]


def request_user_timelines(application_id: str, is_main=True, request_limit=1500) -> int:
    """Requests the twitter timeline for all accounts in the database. Either main or not. Uses the fetcher service."""
    request_chunks = 20
    with engine.connect() as connection:
        requests_left = request_limit
        while requests_left > 0:
            limit = min(requests_left, request_chunks)
            account_ids = map_to_attribute('id', account_model.select_multiple_incomplete(application_id,
                                                                                          SOURCES['TWITTER'],
                                                                                          connection,
                                                                                          ismain=is_main,
                                                                                          limit=limit))
            # There are no more accounts that need to be fetched
            if not account_ids:
                return requests_left

            requests_left -= len(account_ids)

            accounts_timeline = account_model.select_oldest_timelines(account_ids, connection)
            timeline_payload = create_timeline_payload(accounts_timeline)
            request = create_post_request(TWITTER_TIMELINE,
                                          {'applicationId': application_id, 'accounts': timeline_payload})

            try:
                timeline_response = urlopen(request)
                timeline_response_code = timeline_response.getcode()

                if timeline_response_code != 200:
                    continue
                raw_response = read_response(timeline_response)
                response = json.loads(raw_response)

                for account in response['success']:
                    with connection.begin():
                        name = account['screenName']
                        timeline = account['timeline']
                        statuses = []
                        if isinstance(timeline, str):
                            continue
                        for status in timeline:
                            statuses.append({'text': status['text'], 'id': status['id'],
                                             'date': convert_twitter_date(status['created_at'])})

                        if len(statuses) > 1:
                            account_timeline.insert_multiple(application_id, name, SOURCES['TWITTER'], statuses[1:],
                                                             connection)
                        else:
                            account_id = account_model.select_one_id(application_id, name, SOURCES['TWITTER'],
                                                                     connection)
                            account_model.update_one_iscomplete(account_id, True, connection)
                for res in response['errors']:
                    with connection.begin():
                        name = res['screenName']
                        status = res['status']
                        if status == 404:
                            account_id = account_model.select_one_id(application_id, name, SOURCES['TWITTER'],
                                                                     connection)
                            if not account_id:
                                continue
                            account = account_model.select_one_by_id(account_id, connection)
                            # Delete account from accounts Table if it has been removed from Twitter
                            if not account['isMain']:
                                account_rel_model.delete_follower_account_rel(account_id, connection)
                                account_model.delete_one_by_id(account_id, connection)
            except (ValueError, HTTPException) as e:
                print(e)
            except HTTPError as e:
                print(e.read())

        return requests_left


def request_timelines(application_id):
    requests_left = request_user_timelines(application_id, True)
    request_user_timelines(application_id, False, requests_left)
