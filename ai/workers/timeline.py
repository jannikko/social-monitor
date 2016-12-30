from urllib.request import urlopen, HTTPError
from util import create_post_request
from http.client import HTTPException
from models import engine
from enums import SOURCES
import models.account_relationship as account_rel_model
import models.account as account_model
import models.timeline as account_timeline
import time
import json
import config

TWITTER_TIMELINE = config.get('TWITTER_TIMELINE')


def convert_twitter_date(date):
    return time.strftime('%Y-%m-%d %H:%M:%S', time.strptime(date, '%a %b %d %H:%M:%S +0000 %Y'))


def create_timeline_payload(users):
    """Creates the payload for the timeline request, adds the name of the user and optionally a max_id"""
    accounts = []
    for user in users:
        u = {'screenName': user['name']}
        if user['max_id']:
            u['maxId'] = user['max_id']
        accounts.append(u)
    return accounts


def map_to_attribute(attr, iterable):
    """Maps an iterable containing dictionaries to a specific attribute"""
    return [i[attr] for i in iterable if attr in i]


def calculate_max_iterations(limit, chunksize):
    """Calculates the amount of requests allowed for a given chunksize"""
    max_requests = limit // chunksize
    return max_requests


def request_user_timelines(application_id, is_main=True, requests_left=1500, request_chunks=5):
    with engine.connect() as connection:
        # Select accounts that have not been completely fetched
        accounts = account_model.select_multiple_incomplete(application_id, SOURCES['TWITTER'], connection,
                                                            ismain=is_main, limit=request_chunks)
        account_ids = map_to_attribute('id', accounts)

        if not account_ids:
            return requests_left

        max_iterations = calculate_max_iterations(requests_left, request_chunks)

        for i in range(max_iterations):
            # If accounts have been removed from the list, because they are already fetcheded completely
            if len(account_ids) < request_chunks:
                accounts_needed = request_chunks - len(account_ids)
                # Add new accounts to the list
                account_ids += map_to_attribute('id', account_model.select_multiple_incomplete(application_id,
                                                                                               SOURCES['TWITTER'],
                                                                                               connection,
                                                                                               ismain=is_main,
                                                                                               limit=accounts_needed,
                                                                                               exclude=account_ids))
                # There are no more accounts that need to be fetched
                if not account_ids:
                    return requests_left

            accounts_timeline = account_model.select_oldest_timelines(account_ids, connection)
            timeline_payload = create_timeline_payload(accounts_timeline)
            request = create_post_request(TWITTER_TIMELINE,
                                          {'applicationId': application_id, 'accounts': timeline_payload})

            try:
                timeline_response = urlopen(request)
                timeline_response_code = timeline_response.getcode()

                if timeline_response_code != 200:
                    continue

                response = json.loads(timeline_response.read().decode('utf-8'))

                # Start transaction
                with connection.begin():
                    for account in response['success']:
                        name = account['screenName']
                        timeline = account['timeline']
                        statuses = [{'text': status['text'], 'id': status['id'],
                                     'date': convert_twitter_date(status['created_at'])} for status in timeline]

                        if len(statuses) > 1:
                            account_timeline.insert_multiple(application_id, name, SOURCES['TWITTER'], statuses[1:],
                                                             connection)
                        else:
                            account_id = account_model.select_one_id(application_id, name, SOURCES['TWITTER'],
                                                                     connection)
                            account_model.update_one_iscomplete(account_id, connection)
                            account_ids.remove(account_id)
                    for res in response['errors']:
                        name = res['screenName']
                        status = res['status']
                        if status == 404:
                            account_id = account_model.select_one_id(application_id, name, SOURCES['TWITTER'],
                                                                     connection)
                            if not account_id:
                                continue
                            account = account_model.select_one_by_id(account_id, connection)
                            if not account['isMain']:
                                account_rel_model.delete_follower_account_rel(account_id, connection)
                                account_model.delete_one_by_id(account_id, connection)
                                account_ids.remove(account_id)
            except (ValueError, HTTPException) as e:
                print(e)
            except HTTPError as e:
                print(e.read())

            requests_left -= request_chunks

        return requests_left
