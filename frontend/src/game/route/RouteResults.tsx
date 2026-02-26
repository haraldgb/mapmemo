import { useEffect, useRef, useState } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { computeRouteResult } from '../../api/computeRoutes'
import { decodePolyline } from '../../utils/decodePolyline'
import { Spinner } from '../../components/Spinner'
import type { RouteAddress, RouteResult, SelectedJunction } from './types'

type Props = {
  startAddress: RouteAddress
  endAddress: RouteAddress
  path: SelectedJunction[]
  formattedTime: string
  onPlayAgain: () => void
}

export const RouteResults = ({
  startAddress,
  endAddress,
  path,
  formattedTime,
  onPlayAgain,
}: Props) => {
  const map = useMap()
  const [result, setResult] = useState<RouteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // useRef: imperative polyline objects that need manual cleanup
  const playerPolylineRef = useRef<google.maps.Polyline | null>(null)
  const optimalPolylineRef = useRef<google.maps.Polyline | null>(null)

  useEffect(
    function fetchRouteResult() {
      let isActive = true

      void computeRouteResult(startAddress, endAddress, path)
        .then((res) => {
          if (isActive) {
            setResult(res)
          }
        })
        .catch((err) => {
          if (isActive) {
            setError(
              err instanceof Error ? err.message : 'Failed to compute results',
            )
          }
        })

      return () => {
        isActive = false
      }
    },
    [startAddress, endAddress, path],
  )

  // Draw both polylines on map
  useEffect(
    function drawResultPolylines() {
      if (!map || !result) {
        return
      }

      const playerPath = decodePolyline(result.playerPolyline)
      const optimalPath = decodePolyline(result.optimalPolyline)

      // Optimal route (green, behind)
      const optimalPolyline = new google.maps.Polyline({
        path: optimalPath,
        strokeColor: '#22c55e',
        strokeWeight: 5,
        strokeOpacity: 0.6,
        map,
        zIndex: 1,
      })
      optimalPolylineRef.current = optimalPolyline

      // Player route (blue, on top)
      const playerPolyline = new google.maps.Polyline({
        path: playerPath,
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 0.9,
        map,
        zIndex: 2,
      })
      playerPolylineRef.current = playerPolyline

      // Fit bounds to show both routes
      const bounds = new google.maps.LatLngBounds()
      for (const pt of playerPath) {
        bounds.extend(pt)
      }
      for (const pt of optimalPath) {
        bounds.extend(pt)
      }
      map.fitBounds(bounds, { top: 80, right: 40, bottom: 40, left: 40 })

      return () => {
        playerPolyline.setMap(null)
        optimalPolyline.setMap(null)
      }
    },
    [map, result],
  )

  if (error) {
    return (
      <div className={s_overlay}>
        <div className={s_panel}>
          <div className={s_error}>Failed to load results: {error}</div>
          <button
            type='button'
            onClick={onPlayAgain}
            className={s_play_again}
          >
            Play again
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className={s_overlay}>
        <div className={s_panel}>
          <Spinner />
          <div className={s_loading_text}>Computing route results...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={s_overlay}>
      <div className={s_results_panel}>
        <h2 className={s_title}>Route Complete!</h2>
        <div className={s_stats_grid}>
          <div className={s_stat}>
            <div className={s_stat_label}>Your time</div>
            <div className={s_stat_value}>{formattedTime}</div>
          </div>
          <div className={s_stat}>
            <div className={s_stat_label}>Your route</div>
            <div className={s_stat_value_blue}>
              {formatDuration(result.playerDurationSec)}
            </div>
          </div>
          <div className={s_stat}>
            <div className={s_stat_label}>Optimal route</div>
            <div className={s_stat_value_green}>
              {formatDuration(result.optimalDurationSec)}
            </div>
          </div>
          <div className={s_stat}>
            <div className={s_stat_label}>Difference</div>
            <div className={s_stat_value}>
              {result.differencePercent > 0 ? '+' : ''}
              {result.differencePercent}%
            </div>
          </div>
        </div>
        <div className={s_legend}>
          <span className={s_legend_player}>
            <span className={s_dot_blue} /> Your route
          </span>
          <span className={s_legend_optimal}>
            <span className={s_dot_green} /> Optimal route
          </span>
        </div>
        <button
          type='button'
          onClick={onPlayAgain}
          className={s_play_again}
        >
          Play again
        </button>
      </div>
    </div>
  )
}

const formatDuration = (sec: number): string => {
  const mins = Math.floor(sec / 60)
  const secs = sec % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

const s_overlay =
  'pointer-events-auto absolute inset-0 z-20 flex items-end justify-center p-4 sm:items-center'
const s_panel =
  'flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xl'
const s_results_panel =
  'flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-xl'
const s_title = 'text-lg font-bold text-slate-900'
const s_stats_grid = 'grid w-full grid-cols-2 gap-3'
const s_stat = 'rounded-xl bg-slate-50 p-3 text-center'
const s_stat_label =
  'text-xs font-medium uppercase tracking-wide text-slate-500'
const s_stat_value = 'mt-1 text-lg font-bold text-slate-900'
const s_stat_value_blue = 'mt-1 text-lg font-bold text-blue-600'
const s_stat_value_green = 'mt-1 text-lg font-bold text-green-600'
const s_legend = 'flex items-center gap-4 text-sm text-slate-600'
const s_legend_player = 'flex items-center gap-1.5'
const s_legend_optimal = 'flex items-center gap-1.5'
const s_dot_blue = 'inline-block h-3 w-3 rounded-full bg-blue-500'
const s_dot_green = 'inline-block h-3 w-3 rounded-full bg-green-500'
const s_error = 'text-sm text-red-600'
const s_loading_text = 'text-sm text-slate-600'
const s_play_again =
  'rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl active:scale-95'
