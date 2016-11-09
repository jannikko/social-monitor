from flask import Flask, request
from tasks import timeline

app = Flask(__name__)


@app.route('/timeline/register', methods=['POST'])
def index():
    req = request.get_json()
    application_id = req['applicationId']
    twitter_accounts = req['twitterAccounts']

    result = timeline.delay(application_id)
    return str(result.wait())


if __name__ == '__main__':
    # Start the web service
    app.run()
