async function retry (fn, retriesLeft = 5, interval = 1000, exponential = false) {
  try {
    const val = await fn()
    return val
  } catch (err) {
    if (retriesLeft) {
      await new Promise(resolve => setTimeout(resolve, interval))
      return retry(fn, retriesLeft - 1, exponential ? interval * 2 : interval, exponential)
    } else {
      throw err
    }
  }
}

module.exports = retry
