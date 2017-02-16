import types from './types'

export const getTopics = (applicationId) => ({type: types.GET_TOPICS, applicationId: applicationId});
export const getApplications = (applicationId) => ({type: types.GET_APPLICATIONS});
export const updateTopics = (data, loading) => ({type: types.UPDATE_TOPICS, topics: {loading, data}});
export const updateApplications = (data, loading) => ({type: types.UPDATE_APPLICATIONS, applications: {loading, data}});
export const registerApplication = (name, twitterAccounts, twitterId, twitterSecret) => ({
  type: types.REGISTER_APPLICATION,
  name: name,
  twitterAccounts: twitterAccounts,
  twitterId: twitterId,
  twitterSecret: twitterSecret
});
export const registerSuccess = () => ({type: types.REGISTER_SUCCESS});
