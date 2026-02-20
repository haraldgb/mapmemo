import { useEffect, useState } from 'react'
import { computeRouteResult } from '../../api/routeScoring'
import type { RouteResult, RouteAddress, RouteDecision } from '../routeTypes'

export type RouteResultState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: RouteResult }
  | { status: 'error'; error: string }

type UseRouteResultReturn = {
  resultState: RouteResultState
  resetResult: () => void
}

type Props = {
  isComplete: boolean
  start: RouteAddress
  end: RouteAddress
  decisions: RouteDecision[]
  gameTimeSeconds: number
}

export const useRouteResult = ({
  isComplete,
  start,
  end,
  decisions,
  gameTimeSeconds,
}: Props): UseRouteResultReturn => {
  // Track the async result only — loading is derived from isComplete + no result yet
  const [asyncResult, setAsyncResult] = useState<
    | { status: 'success'; result: RouteResult }
    | { status: 'error'; error: string }
    | null
  >(null)

  useEffect(
    function fetchRouteResultOnComplete() {
      if (!isComplete) {
        return
      }

      const waypoints = decisions.map((d) => ({
        lat: d.intersection.lat,
        lng: d.intersection.lng,
      }))

      let cancelled = false

      computeRouteResult(
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng },
        waypoints,
        gameTimeSeconds,
      )
        .then((result) => {
          if (!cancelled) {
            setAsyncResult({ status: 'success', result })
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            const message =
              err instanceof Error ? err.message : 'Failed to compute route'
            setAsyncResult({ status: 'error', error: message })
          }
        })

      return () => {
        cancelled = true
      }
    },
    [isComplete, start, end, decisions, gameTimeSeconds],
  )

  const resetResult = () => {
    setAsyncResult(null)
  }

  // Derive the full state from isComplete + asyncResult
  const resultState: RouteResultState = !isComplete
    ? { status: 'idle' }
    : (asyncResult ?? { status: 'loading' })

  return { resultState, resetResult }
}
