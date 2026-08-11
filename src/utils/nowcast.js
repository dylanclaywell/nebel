// Summarize the next couple hours of 15-minutely precipitation into a
// Dark-Sky-style sentence plus normalized bar heights for a mini chart.

function timeLabel(t) {
  // t is a timezone-naive local string "YYYY-MM-DDTHH:mm".
  let h = parseInt(t.slice(11, 13), 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${t.slice(14, 16)} ${ampm}`
}

/**
 * @param {Array<{ time:string, precipitation:number }>} steps
 * @returns {{ text:string, hasPrecip:boolean, bars:Array<{h:number,precipitation:number,time:string}>, max:number }}
 */
export function summarizeNowcast(steps) {
  const rainy = steps.map((s) => s.precipitation > 0)
  const hasPrecip = rainy.some(Boolean)
  const max = steps.reduce((m, s) => Math.max(m, s.precipitation), 0)

  // Bar heights as a percentage of the peak; give any non-zero step a floor so
  // light precip stays visible.
  const bars = steps.map((s) => ({
    precipitation: s.precipitation,
    time: s.time,
    h: max > 0 && s.precipitation > 0 ? Math.max(10, (s.precipitation / max) * 100) : 0,
  }))

  let text
  if (!hasPrecip) {
    text = 'No precipitation for the next 2 hours'
  } else if (rainy[0]) {
    const stop = rainy.findIndex((r) => !r)
    text =
      stop === -1
        ? 'Precipitation continuing for the next 2 hours'
        : `Precipitation stopping around ${timeLabel(steps[stop].time)}`
  } else {
    const start = rainy.findIndex(Boolean)
    text = `Precipitation starting around ${timeLabel(steps[start].time)}`
  }

  return { text, hasPrecip, bars, max }
}
