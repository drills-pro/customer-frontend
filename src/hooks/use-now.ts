import * as React from 'react'

/**
 * A ticking clock for time-derived UI such as training progress. Starts at 0 so
 * the first client render matches the server output, then updates on an
 * interval until the component unmounts.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = React.useState(0)

  React.useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}
