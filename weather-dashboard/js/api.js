import { API_KEY, LOCATION } from './config.js';

export async function fetchWeatherData(endpoint) {
    // Simulate API response for demo purposes
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: {
                    temperature: 29,
                    felttemperature: 31,
                    relativehumidity: 65,
                    precipitation: 0,
                    windspeed: 12,
                    cloudcover: 25,
                    thunder: 0,
                    uvindex: 6,
                    pressure: 1012,
                    hourly: Array(24).fill(null).map((_, i) => ({
                        temperature: 29 - (i * 0.2),
                        felttemperature: 31 - (i * 0.2),
                        relativehumidity: 65 + (i * 0.3),
                        precipitation: i > 12 ? 0.3 : 0,
                        windspeed: 12 + (i * 0.2),
                        cloudcover: 25 + (i * 2),
                        thunder: 0
                    }))
                }
            });
        }, 1000);
    });
}
