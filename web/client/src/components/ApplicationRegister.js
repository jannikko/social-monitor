import React from "react";
import {store} from "../store";
import {registerApplication} from "../actions"
import {connect} from "react-redux";

function dispatchCreateApplication(e) {
  const name = document.getElementById('register-account-name').value;
  const twitterAccounts = document.getElementById('register-twitter-accounts').value.split(',');
  const twitterId = document.getElementById('register-twitter-id').value;
  const twitterSecret = document.getElementById('register-twitter-secret').value;
  store.dispatch(registerApplication(name, twitterAccounts, twitterId, twitterSecret));
  e.preventDefault();
}

class ApplicationRegister extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      success: false
    }
  }

  componentWillReceiveProps(nextProps) {
    this.state.success = nextProps.success;
  }

  render() {

    const message = this.state.success ? "Success!" : "";

    return (
      <form onSubmit={dispatchCreateApplication}>
        <div className="row">
          <div className="col-lg-6">
            <div className="input-group">
              <input placeholder="Name..." className="form-control" type="text" id="register-account-name"/>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="input-group">
              <input placeholder="Twitter Accounts..." className="form-control" type="text" id="register-twitter-accounts"/>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-4">
            <div className="input-group">
              <input placeholder="Twitter API Key..." className="form-control" type="text" id="register-twitter-id"/>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="input-group">
              <input placeholder="Twitter API Secret..." className="form-control" type="text" id="register-twitter-secret"/>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="input-group">
              <input className="btn btn-default" type="submit" value="Create"/>
            </div>
          </div>
        </div>
        {message}
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    success: state.register.success
  };
}

export default connect(mapStateToProps)(ApplicationRegister)
