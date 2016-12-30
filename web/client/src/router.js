import React from "react";
import { Router, Route, IndexRoute } from "react-router";
import { history } from "./store.js";
import App from "./components/App";
import Home from "./components/Home";
import NotFound from "./components/NotFound";
import {store} from "./store"
import { getTopics } from "./actions"


// build the router
const router = (
  <Router onUpdate={() => window.scrollTo(0, 0)} history={history}>
    <Route path="/" component={App}>
      <IndexRoute component={Home} onEnter={() => store.dispatch(getTopics())}/>
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>
);

// export
export { router };
