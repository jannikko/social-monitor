import React from "react";
import Plotly from "plotly.js";
import _ from "lodash";
import {connect} from "react-redux";


function unpack(rows, key) {
  return rows.map(function (row) {
    return row[key];
  });
}

function calculateMeanWeights(weights) {
  if (weights && weights.length) {
    const meanInit = weights[0];

    if (weights.length == 1) {
      return meanInit;
    }

    const sums = weights.slice(1, weights.length).reduce((a, b) => {
      return a.map((x, i) => x + b[i]);
    }, meanInit);

    return sums.map((x) => x / weights.length)
  }
}

function calculateMeanTopics(weights, threshold = 0.3) {
  let indexedWeights = _.zip(weights, _.range(weights.length));
  indexedWeights.sort((x, y) => y[0] - x[0]);
  let topics = [];
  for (let weightSum = 0, i = 0; i < indexedWeights.length && weightSum < threshold; i++) {
    const [weight, index] = indexedWeights[i];
    weightSum += weight;
    topics.push(index);
  }

  return topics;
}

function createTopicLabels(weightIndices, topicVec, wordsPerTopic = 5) {
  return weightIndices
    .map((i) => `Topic ${i}: ${topicVec[i].slice(0, wordsPerTopic).join(', ')}`)
    .join(', ');
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
      clusterLabels: null
    };
  }

  componentWillReceiveProps(nextProps) {
      this.state.loading = nextProps.loading;
      this.state.topics = nextProps.topics;
  }

  componentDidUpdate() {
    if (!this.state.loading) {
      const clusters = assignTopicsToClusters(this.state.topics.topic);

      const clusterIds = Object.keys(clusters);
      clusterIds.sort((a, b) => a - b);

      const weights = clusterIds.map((id) => clusters[id].map(topic => topic.weights));
      const meanClusterWeights = weights.map(calculateMeanWeights);
      const meanTopics = meanClusterWeights.map((meanWeights) => calculateMeanTopics(meanWeights));
      const clusterLabels = meanTopics.map((weightIndices) => createTopicLabels(weightIndices, this.state.topics.topicModel.topics));

      const data = clusterIds.map((clusterId) => {
        const specificCluster = clusters[clusterId];
        return {
          mode: 'markers',
          name: `Cluster ${clusterId}`,
          x: unpack(specificCluster, 'x'),
          y: unpack(specificCluster, 'y'),
          text: specificCluster.map(val => val.account.name),
          marker: {
            sizemode: 'area',
            size: specificCluster.map(x => 100),
            sizeref: 2
          }
        };
      });
      const layout = {
        width: 1200,
        height: 1000,
        margin: {t: 20},
        hovermode: 'closest',
        showlegend: true,
        legend: {x: 100, y: 1}
      };
      Plotly.plot('plot', data, layout, {showLink: false});
      document.getElementById('legend').innerHTML = _.zip(clusterIds, clusterLabels)
        .map(([id, label]) => `<p>Cluster ${id}: ${label}</p>`).join('');
    }
  }

// render
  render() {
    return (
      <div>
        <div id="plot"></div>
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
