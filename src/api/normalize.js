// Turn a raw Open-Meteo forecast response into a clean shape the UI consumes,
// so components never touch the parallel-arrays format Open-Meteo returns.

import { describeWeather } from '../data/weatherCodes.js'

export function normalizeForecast(raw, place = null) {
  const cur = raw.current
  const curUnits = raw.current_units
  const isDay = cur.is_day === 1
  const weather = describeWeather(cur.weather_code, isDay)

  // Per-day sun times, so each hour can pick a day or night icon.
  const sun = {}
  raw.daily.time.forEach((date, i) => {
    sun[date] = { sunrise: raw.daily.sunrise[i], sunset: raw.daily.sunset[i] }
  })
  const hourIsDay = (time) => {
    const s = sun[time.slice(0, 10)]
    if (!s) return true
    return time >= s.sunrise && time < s.sunset
  }

  const hourly = raw.hourly.time.map((time, i) => ({
    time,
    temperature: Math.round(raw.hourly.temperature_2m[i]),
    weather: describeWeather(raw.hourly.weather_code[i], hourIsDay(time)),
    precipProbability: raw.hourly.precipitation_probability[i],
  }))

  // Open-Meteo's `current` block has no precip probability, so borrow it from
  // the matching hour — that's the "chance of rain" users expect.
  const curHour = cur.time.slice(0, 13)
  const hIdx = raw.hourly.time.findIndex((t) => t.slice(0, 13) === curHour)
  const precipProbability = hIdx >= 0 ? raw.hourly.precipitation_probability[hIdx] : null

  const current = {
    temperature: Math.round(cur.temperature_2m),
    apparentTemperature: Math.round(cur.apparent_temperature),
    humidity: cur.relative_humidity_2m,
    windSpeed: Math.round(cur.wind_speed_10m),
    windDirection: cur.wind_direction_10m,
    precipitation: cur.precipitation,
    precipProbability,
    isDay,
    weather,
    units: {
      temperature: curUnits.temperature_2m,
      windSpeed: curUnits.wind_speed_10m,
      precipitation: curUnits.precipitation,
    },
    time: cur.time,
  }

  const daily = raw.daily.time.map((date, i) => ({
    date,
    weather: describeWeather(raw.daily.weather_code[i], true),
    tempMax: Math.round(raw.daily.temperature_2m_max[i]),
    tempMin: Math.round(raw.daily.temperature_2m_min[i]),
    precipProbability: raw.daily.precipitation_probability_max[i],
    sunrise: raw.daily.sunrise[i],
    sunset: raw.daily.sunset[i],
  }))

  return {
    place,
    current,
    daily,
    hourly,
    timezone: raw.timezone,
    fetchedAt: current.time,
  }
}
