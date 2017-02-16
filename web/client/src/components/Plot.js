import React from "react";
import Plotly from "plotly.js";
import _ from "lodash";
import {connect} from "react-redux";
import AccountLabel from "./AccountLabel";


function unpack(rows, key) {
  return rows.map(function (row) {
    return row[key];
  });
}

function assignTopicsToClusters(topics) {
  let clusters = {};

  topics.forEach((data) => {
    if (clusters[data.cluster]) {
      clusters[data.cluster].push(data);
    } else {
      clusters[data.cluster] = [data]
    }
  });

  return clusters;
}

function renderLabels(clusterLabels) {
  return clusterLabels.map((label) => <div>{label}</div>)
}

class Plot extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: props.loading,
      topics: props.topics,
      clusters: null,
      clusterIds: null,
      clusterLabels: null,
      selection: {},
      rendered: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.state.loading = nextProps.loading;
    this.state.topics = nextProps.topics;
  }

  componentDidUpdate() {
    if (!this.state.loading && !this.state.rendered) {
      const clusters = assignTopicsToClusters(this.state.topics.accounts);

      let clusterIds = Object.keys(clusters).filter(id => id != -1);
      clusterIds.sort((a, b) => a - b);

      const data = clusterIds.map((clusterId) => {
        const specificCluster = clusters[clusterId];
        return {
          mode: 'markers',
          name: `Cluster ${clusterId}`,
          x: unpack(specificCluster, 'x'),
          y: unpack(specificCluster, 'y'),
          text: specificCluster.map(account => account.name),
          marker: {
            sizemode: 'area',
            size: specificCluster.map(x => 100),
            sizeref: 2
          }
        };
      });
      const layout = {
        width: 1200,
        height: 720,
        margin: {t: 20},
        hovermode: 'closest',
        showlegend: true,
        legend: {x: 100, y: 1}
      };
      Plotly.plot('plot', data, layout, {showLink: false});
      this.state.rendered = true;

      document.getElementById('plot').on('plotly_click', function (data) {
        for (var i = 0; i < data.points.length; i++) {
          const point = data.points[i];
          const pointNumber = point.pointNumber;
          const clusterId = point.curveNumber;
          const account = clusters[clusterId][pointNumber];

          window.location = `https://www.twitter.com/${account.name}`;
        }
      });
      document.getElementById('plot').on('plotly_hover', function (data) {
        for (var i = 0; i < data.points.length; i++) {
          const point = data.points[i];
          const pointNumber = point.pointNumber;
          const clusterId = point.curveNumber;
          const account = clusters[clusterId][pointNumber];
          this.setState({selection: {name: account.name, weights: account.weights}})
        }
      }.bind(this));
    }
  }

// render
  render() {
    const label = this.state.loading ? <div></div> :
      <AccountLabel name={this.state.selection.name} weights={this.state.selection.weights}
                    wordVec={this.state.topics.topicModel.wordVectors}/>;

    return (
      <div>
        <div className="page-header">
          <h1>Social Monitor <br/>
            <small>Topic Extraction von Twitter-Accounts</small>
          </h1>
        </div>
        <div id="plot"></div>
        {label}
        <div id="legend"></div>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    topics: state.topics.data,
    loading: state.topics.loading
  };
}

export default connect(mapStateToProps)(Plot)
