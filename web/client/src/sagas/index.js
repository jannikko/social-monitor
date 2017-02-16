import 'whatwg-fetch';
import {takeLatest} from 'redux-saga';
import {put} from 'redux-saga/effects';
import {updateTopics, updateApplications, registerSuccess} from '../actions/index';
import types from '../actions/types';

const application = "";

function* fetchTopics(action) {
  const response = yield window.fetch(
    `/api/topics/${action.applicationId}`,
    {
      headers: {
        'Accept': 'application/json'
      },
      method: 'GET'
    }
  );
  if (response.ok) {
    const body = yield response.json();
    yield put(updateTopics(body, false))
  }
}

function* getApplications(action) {
  const response = yield window.fetch(
    `/api/applications`,
    {
      headers: {
        'Accept': 'application/json'
      },
      method: 'GET'
    }
  );
  if (response.ok) {
    const body = yield response.json();
    yield put(updateApplications(body, false))
  }
}

function* registerApplication(action) {
  const body = JSON.stringify({
    name: action.name,
    twitterAccounts: action.twitterAccounts,
    twitterId: action.twitterId,
    twitterSecret: action.twitterSecret
  });
  const response = yield window.fetch(
    `/api/topics`,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: body
    }
  );
  if (response.ok) {
    yield put(registerSuccess())
  }
}

function* mySaga() {
  yield takeLatest(types.GET_TOPICS, fetchTopics);
  yield takeLatest(types.GET_APPLICATIONS, getApplications);
  yield takeLatest(types.REGISTER_APPLICATION, registerApplication);
}

export default mySaga;
