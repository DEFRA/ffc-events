module.exports = (appInsights, message) => {
  if (appInsights !== undefined && appInsights.defaultClient !== undefined) {
    appInsights.defaultClient.trackException({ message })
  }
}
