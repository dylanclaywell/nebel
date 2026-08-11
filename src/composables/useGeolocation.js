// Thin promise wrapper around the browser Geolocation API.

/**
 * Resolve the device's current coordinates.
 * @param {PositionOptions} [opts]
 * @returns {Promise<{ latitude: number, longitude: number }>}
 */
export function getCurrentPosition(opts = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(new Error(geolocationMessage(err))),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000, ...opts },
    )
  })
}

function geolocationMessage(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location permission was denied.'
    case err.POSITION_UNAVAILABLE:
      return 'Location is currently unavailable.'
    case err.TIMEOUT:
      return 'Timed out getting your location.'
    default:
      return 'Could not get your location.'
  }
}
