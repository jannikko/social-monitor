import types from '../actions/types'

const initialState = {loading: true};

function applicationsReducer(state = initialState, action) {
  switch (action.type) {
    case types.UPDATE_APPLICATIONS:
      return Object.assign({}, state, {loading: action.applications.loading, data: action.applications.data});
    default:
      return state
  }
}

export default applicationsReducer;
