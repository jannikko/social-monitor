import React from "react";
import ApplicationRegister from "./ApplicationRegister"


// Home page component
export default class Home extends React.Component {

  // render
  render() {
    return (
      <div className="page-register">
        <div className="page-header">
          <h1>Social Monitor <br/><small>Topic Extraction von Twitter-Accounts</small></h1>
        </div>
        <ApplicationRegister/>
      </div>
    );
  }
}
