import React from "react";
import {Router, Route, IndexRoute} from "react-router";
import {history} from "./store.js";
import Home from "./components/Home";
import Plot from "./components/Plot";
import Register from "./components/Register";
import App from "./components/App";
import NotFound from "./components/NotFound";

import {store} from "./store";
import {getTopics, getApplications} from "./actions";

// build the router
const router = (
  <Router onUpdate={() => window.scrollTo(0, 0)} history={history}>
    <Route path="/" component={App}>
      <IndexRoute component={Home} onEnter={() => store.dispatch(getApplications())} />
      <Route path="topics/:applicationId" component={Plot} onEnter={(nextState) => store.dispatch(getTopics(nextState.params.applicationId))}/>
      <Route path="register" component={Register}/>
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>
);

// export
export {router};
