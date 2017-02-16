import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";
import { reducer as formReducer } from "redux-form";
import topicsReducer from "./topics";
import applicationsReducer from "./applications";
import registerReducer from "./register";

// main reducers
export const reducers = combineReducers({
  routing: routerReducer,
  form: formReducer,
  topics: topicsReducer,
  applications: applicationsReducer,
  register: registerReducer
});
