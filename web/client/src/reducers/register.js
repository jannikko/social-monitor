import types from '../actions/types'

const initialState = {success: false};

function registerReducer(state = initialState, action) {
  switch (action.type) {
    case types.REGISTER_SUCCESS:
      return Object.assign({}, state, {success: true});
    default:
      return state
  }
}

export default registerReducer;
