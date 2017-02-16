import React from "react";
import {connect} from "react-redux";
import {Link} from "react-router";

class ApplicationList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      applications: [],
      loading: true
    };
  }

  componentWillReceiveProps(nextProps) {
    this.state.loading = nextProps.loading;
    this.state.applications = nextProps.applications;
  }

  componentDidUpdate() {
  }

// render
  render() {
    return (
      <div>
        <ul className="list-group">
          {this.state.applications.map(application => (
            <li className="list-group-item"><Link to={`/topics/${application.id}`}>{application.name}</Link></li>
          ))}
        </ul>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    applications: state.applications.data,
    loading: state.applications.loading
  };
}

export default connect(mapStateToProps)(ApplicationList)
