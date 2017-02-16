import React from "react";
import {connect} from "react-redux";
import {Link} from "react-router";

function getMainTopicIndices(weights, threshold = 0.8, max = 3) {
  let indexedWeights = _.zip(weights, _.range(weights.length));
  indexedWeights.sort((x, y) => y[0] - x[0]);
  let topics = [];
  for (let weightSum = 0, i = 0; i < indexedWeights.length && weightSum < threshold && i < max; i++) {
    const [weight, index] = indexedWeights[i];
    weightSum += weight;
    topics.push(indexedWeights[i]);
  }

  return topics;
}

function getWordRow(weightIndex, topicVec) {
  const [weight, index] = weightIndex;
  return <li className="list-group-item">{Math.round(weight * 100) / 100}: {topicVec[index].join(' - ')}</li>
}

class AccountLabel extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      name: props.name || "",
      weights: props.weights || [],
      wordVec: props.wordVec || []
    };
  }

  componentWillReceiveProps(nextProps) {
    this.state.name = nextProps.name;
    this.state.weights = nextProps.weights;
  }

  render() {
    console.log(this.state.wordVec); 
    return (
      <div>
        <h2>{this.state.name}</h2>
        <ul className="list-group">
          {getMainTopicIndices(this.state.weights).map(i => getWordRow(i, this.state.wordVec))}
        </ul>
      </div>
    );
  }
}

export default AccountLabel;
