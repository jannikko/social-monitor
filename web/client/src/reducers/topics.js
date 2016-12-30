import types from '../actions/types'

const initialState = {loading: true};

function topicsReducer(state = initialState, action) {
  switch (action.type) {
    case types.UPDATE_TOPICS:
      return Object.assign({}, state, {loading: false, data: action.topics.data});
    default:
      return state
  }
}

export default topicsReducer;
