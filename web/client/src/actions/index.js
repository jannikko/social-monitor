import types from './types'

export const getTopics = () => ({ type: types.GET_TOPICS});
export const updateTopics = (data, loading) => ({ type: types.UPDATE_TOPICS, topics: {loading, data}});
