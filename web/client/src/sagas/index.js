import 'whatwg-fetch';
import {takeLatest} from 'redux-saga';
import {put} from 'redux-saga/effects';
import {updateTopics} from '../actions/index';
import types from '../actions/types';

const application = "";

function * fetchTopics(action) {
  const response = yield window.fetch(
    `/api/topics`,
    {
      headers: {
        'Accept': 'application/json'
      },
      method: 'GET'
    }
  );
  if (response.ok){
    const body = yield response.json();
    yield put(updateTopics(body, false))
  }
}

function* mySaga() {
  yield takeLatest(types.GET_TOPICS, fetchTopics);
}

export default mySaga;
