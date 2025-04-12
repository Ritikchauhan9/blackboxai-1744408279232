import { fetchWeatherData } from './api.js';
import { LOCATION, SOCIAL, ENDPOINTS } from './config.js';

class WeatherDashboard {
    constructor() {
        this.isLoading = false;
        this.lastUpdate = null;
        this.isDetailsPage = window.location.pathname.includes('details.html');
        this.lastScrollTop = 0;
        this.scrollTimeout = null;
        this.scrollThreshold = 5;
        this.scrollDelay = 100;
        this.weatherConditions = {
            sunny: {
                morning: 'https://assets.mixkit.co/videos/preview/mixkit-bright-sun-in-the-blue-sky-time-lapse-4358-large.mp4',
                afternoon: 'https://assets.mixkit.co/videos/preview/mixkit-white-clouds-on-blue-sky-9465-large.mp4',
                evening: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-with-clouds-1166-large.mp4',
                night: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4'
            },
            cloudy: {
                morning: 'https://assets.mixkit.co/videos/preview/mixkit-gray-clouds-in-the-sky-4558-large.mp4',
                afternoon: 'https://assets.mixkit.co/videos/preview/mixkit-storm-clouds-gathering-9547-large.mp4',
                evening: 'https://assets.mixkit.co/videos/preview/mixkit-dense-clouds-in-the-sky-4559-large.mp4',
                night: 'https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-2544-large.mp4'
            },
            rainy: {
                morning: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-4959-large.mp4',
                afternoon: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-road-1244-large.mp4',
                evening: 'https://assets.mixkit.co/videos/preview/mixkit-heavy-rain-in-the-dark-4927-large.mp4',
                night: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-pavement-at-night-4888-large.mp4'
            },
            thunder: {
                morning: 'https://assets.mixkit.co/videos/preview/mixkit-thunderstorm-at-night-4422-large.mp4',
                afternoon: 'https://assets.mixkit.co/videos/preview/mixkit-thunderstorm-at-sea-4366-large.mp4',
                evening: 'https://assets.mixkit.co/videos/preview/mixkit-thunderstorm-at-night-4422-large.mp4',
                night: 'https://assets.mixkit.co/videos/preview/mixkit-thunderstorm-at-night-4422-large.mp4'
            }
        };
        this.fallbackImages = {
            sunny: {
                morning: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
                afternoon: 'linear-gradient(135deg, #00c6ff, #0072ff)',
                evening: 'linear-gradient(135deg, #ff512f, #dd2476)',
                night: 'linear-gradient(135deg, #141e30, #243b55)'
            },
            cloudy: {
                morning: 'linear-gradient(135deg, #606c88, #3f4c6b)',
                afternoon: 'linear-gradient(135deg, #757f9a, #d7dde8)',
                evening: 'linear-gradient(135deg, #2c3e50, #3498db)',
                night: 'linear-gradient(135deg, #232526, #414345)'
            },
            rainy: {
                morning: 'linear-gradient(135deg, #616161, #9bc5c3)',
                afternoon: 'linear-gradient(135deg, #536976, #292e49)',
                evening: 'linear-gradient(135deg, #373b44, #4286f4)',
                night: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)'
            },
            thunder: {
                morning: 'linear-gradient(135deg, #283048, #859398)',
                afternoon: 'linear-gradient(135deg, #200122, #6f0000)',
                evening: 'linear-gradient(135deg, #232526, #414345)',
                night: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
            }
        };
        this.initializeApp();
    }

    async initializeApp() {
        this.updateLocationInfo();
        this.updateSocialInfo();
        this.updateCurrentDate();
        await this.loadWeatherData();
        this.setupRefreshInterval();
        this.setupVideoEventListeners();
        this.setupNavbarScroll();
    }

    updateWeatherDescription(data) {
        const descriptionElement = document.getElementById('weather-description');
        if (!descriptionElement || !data || !data.data) return;

        const { temperature, relativehumidity, windspeed, precipitation } = data.data;
        const condition = this.determineWeatherCondition(data);
        const timeOfDay = this.getTimeOfDay();
        const feelsLike = data.data.felttemperature || temperature;

        let description = `<div class="mb-4">
            <span class="text-2xl font-bold">${temperature}°C</span>
            <span class="text-lg ml-2">(Feels like ${feelsLike}°C)</span>
        </div>`;

        description += '<div class="space-y-2">';

        // Current conditions
        if (condition === 'sunny') {
            description += timeOfDay === 'night' 
                ? '<p>🌙 Clear night sky with excellent visibility.</p>' 
                : '<p>☀️ Clear and sunny conditions.</p>';
        } else if (condition === 'cloudy') {
            description += '<p>☁️ Cloudy conditions with moderate visibility.</p>';
        } else if (condition === 'rainy') {
            description += `<p>🌧️ Rainfall with ${precipitation}mm precipitation.</p>`;
        } else if (condition === 'thunder') {
            description += '<p>⛈️ Thunderstorm activity in the area.</p>';
        }

        // Humidity
        if (relativehumidity > 80) {
            description += '<p>💧 Very humid conditions.</p>';
        } else if (relativehumidity > 60) {
            description += '<p>💧 Moderately humid.</p>';
        }

        // Wind
        if (windspeed > 20) {
            description += `<p>💨 Strong winds at ${windspeed} km/h.</p>`;
        } else if (windspeed > 10) {
            description += `<p>🌬️ Moderate breeze at ${windspeed} km/h.</p>`;
        } else {
            description += `<p>🌬️ Light winds at ${windspeed} km/h.</p>`;
        }

        description += '</div>';
        descriptionElement.innerHTML = description;
    }

    updateWeatherTips(data) {
        const tipsElement = document.getElementById('weather-tips');
        if (!tipsElement || !data || !data.data) return;

        const tips = [];
        const { temperature, relativehumidity, windspeed } = data.data;
        const condition = this.determineWeatherCondition(data);
        const timeOfDay = this.getTimeOfDay();

        // High-priority tips based on severe conditions
        if (condition === 'thunder') {
            tips.push({
                icon: 'fa-bolt',
                color: 'text-yellow-400',
                priority: 'high',
                tip: '⚠️ Thunderstorm Warning: Stay indoors and away from windows. Avoid open areas and tall objects.'
            });
        }

        if (temperature > 35) {
            tips.push({
                icon: 'fa-thermometer-full',
                color: 'text-red-500',
                priority: 'high',
                tip: '⚠️ Extreme Heat Alert: Stay hydrated and avoid outdoor activities. Seek air-conditioned spaces.'
            });
        }

        if (windspeed > 30) {
            tips.push({
                icon: 'fa-wind',
                color: 'text-teal-500',
                priority: 'high',
                tip: '⚠️ Strong Wind Advisory: Secure loose objects and exercise caution while driving.'
            });
        }

        // Regular tips based on conditions
        if (condition === 'sunny' && timeOfDay !== 'night') {
            tips.push({
                icon: 'fa-sun',
                color: 'text-yellow-500',
                priority: 'medium',
                tip: '🌞 UV Protection: Apply sunscreen and wear protective clothing. Stay hydrated.'
            });
        }

        if (condition === 'rainy') {
            tips.push({
                icon: 'fa-cloud-rain',
                color: 'text-blue-500',
                priority: 'medium',
                tip: '🌧️ Rain Safety: Roads may be slippery. Carry an umbrella and drive carefully.'
            });
        }

        if (relativehumidity > 80) {
            tips.push({
                icon: 'fa-water',
                color: 'text-blue-400',
                priority: 'medium',
                tip: '💧 High Humidity: Stay in well-ventilated areas. Use air conditioning if available.'
            });
        }

        // General tips based on time of day
        const generalTip = {
            icon: timeOfDay === 'night' ? 'fa-moon' : 'fa-sun',
            color: timeOfDay === 'night' ? 'text-blue-300' : 'text-yellow-500',
            priority: 'low',
            tip: timeOfDay === 'night' 
                ? '🌙 Night Advisory: Visibility may be reduced. Use appropriate lighting.'
                : '🌞 Day Advisory: Stay hydrated and protect yourself from the sun.'
        };
        tips.push(generalTip);

        // Sort tips by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        // Update the UI
        tipsElement.innerHTML = tips.map(tip => `
            <div class="flex items-start space-x-3 p-4 glass-effect rounded-lg ${tip.priority === 'high' ? 'border-l-4 border-red-500' : ''}">
                <i class="fas ${tip.icon} ${tip.color} text-xl mt-1"></i>
                <p class="flex-1 ${tip.priority === 'high' ? 'font-semibold' : ''}">${tip.tip}</p>
            </div>
        `).join('');
    }

    setupNavbarScroll() {
        const navbar = document.querySelector('header');
        if (!navbar) return;
        
        const navbarHeight = navbar.offsetHeight;
        
        // Add transition classes for smooth animations
        navbar.classList.add('transition-transform', 'duration-300', 'ease-in-out');

        // Initial state
        navbar.style.transform = 'translateY(0)';

        let lastScrollTop = 0;
        let scrollTimeout = null;

        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            scrollTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollDelta = scrollTop - lastScrollTop;

                // Only trigger if scroll distance exceeds threshold
                if (Math.abs(scrollDelta) > this.scrollThreshold) {
                    if (scrollTop > lastScrollTop && scrollTop > navbarHeight) {
                        // Scrolling down & past navbar height - hide navbar
                        navbar.style.transform = 'translateY(-100%)';
                    } else {
                        // Scrolling up or at top - show navbar
                        navbar.style.transform = 'translateY(0)';
                    }
                    lastScrollTop = scrollTop;
                }
            }, this.scrollDelay);
        }, { passive: true });

        // Show navbar when mouse moves to top of screen
        document.addEventListener('mousemove', (e) => {
            if (e.clientY <= navbarHeight) {
                navbar.style.transform = 'translateY(0)';
            }
        }, { passive: true });

        // Show navbar when user reaches bottom of page
        window.addEventListener('scroll', () => {
            const isAtBottom = (window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight - 10;
            if (isAtBottom) {
                navbar.style.transform = 'translateY(0)';
            }
        }, { passive: true });
    }

    setupVideoEventListeners() {
        const videoElement = document.getElementById('weather-video');
        if (!videoElement) return;

        videoElement.addEventListener('loadeddata', () => {
            videoElement.classList.add('loaded');
        });

        videoElement.addEventListener('error', (e) => {
            console.warn('Video loading error:', e);
            this.updateBackgroundFallback();
        });
    }

    updateBackgroundVideo(weatherData) {
        const videoElement = document.getElementById('weather-video');
        const container = document.querySelector('.weather-video-container');
        if (!videoElement || !container) return;

        // Remove the loaded class before changing the source
        videoElement.classList.remove('loaded');

        const condition = this.determineWeatherCondition(weatherData);
        const timeOfDay = this.getTimeOfDay();
        
        // Update container background as fallback
        container.style.background = this.fallbackImages[condition][timeOfDay];
        
        // Get video URL from our conditions object
        const videoUrl = this.weatherConditions[condition][timeOfDay];
        
        if (videoUrl !== videoElement.src) {
            videoElement.src = videoUrl;
            
            // Force video to play after source change
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Auto-play failed:', error);
                    this.updateBackgroundFallback();
                });
            }
        }
    }

    updateBackgroundFallback() {
        const container = document.querySelector('.weather-video-container');
        if (!container) return;

        const condition = this.determineWeatherCondition();
        const timeOfDay = this.getTimeOfDay();
        container.style.background = this.fallbackImages[condition][timeOfDay];
    }

    updateLocationInfo() {
        const locationElement = document.getElementById('location');
        if (locationElement) {
            locationElement.textContent = this.isDetailsPage ? 'Detailed Forecast' : LOCATION.name;
        }
    }

    updateSocialInfo() {
        const socialElements = document.querySelectorAll('#social-handle');
        socialElements.forEach(element => {
            element.textContent = SOCIAL.instagram;
        });
    }

    updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 20) return 'evening';
        return 'night';
    }

    determineWeatherCondition(data) {
        if (!data || !data.data) return 'sunny';

        const { precipitation, cloudcover, thunder } = data.data;
        
        if (thunder > 0) return 'thunder';
        if (precipitation > 0) return 'rainy';
        if (cloudcover > 50) return 'cloudy';
        return 'sunny';
    }

    async loadWeatherData() {
        try {
            this.setLoading(true);
            const endpoint = this.isDetailsPage ? ENDPOINTS.forecast : ENDPOINTS.basic;
            const data = await fetchWeatherData(endpoint);
            
            // Update video background
            this.updateBackgroundVideo(data);

            if (this.isDetailsPage) {
                this.updateDetailedWeatherUI(data);
            } else {
                this.updateBasicWeatherUI(data);
                this.updateWeatherDescription(data);
                this.updateWeatherTips(data);
            }
            
            this.lastUpdate = new Date();
            this.updateLastUpdateTime();
            this.setLoading(false);
        } catch (error) {
            this.handleError(error);
        }
    }

    updateBasicWeatherUI(data) {
        if (!data || !data.data) return;

        // Update current temperature
        this.updateElement('current-temp', data.data.temperature, '°C');
        
        // Update humidity
        this.updateElement('humidity', data.data.relativehumidity, '%');
        
        // Update wind speed
        this.updateElement('wind-speed', data.data.windspeed, ' km/h');
        
        // Update precipitation
        this.updateElement('precipitation', data.data.precipitation, ' mm');
    }

    updateDetailedWeatherUI(data) {
        if (!data || !data.data) return;

        // Update UV Index
        this.updateElement('uv-index', data.data.uvindex || '--');
        
        // Update Feels Like temperature
        this.updateElement('feels-like', data.data.felttemperature, '°C');
        
        // Update Pressure
        this.updateElement('pressure', data.data.pressure, ' hPa');

        // Update hourly forecast
        this.updateHourlyForecast(data.data.hourly || []);
    }

    updateElement(elementId, value, unit = '') {
        const element = document.getElementById(elementId);
        if (element && value !== undefined) {
            element.textContent = `${this.formatNumber(value)}${unit}`;
        }
    }

    formatNumber(value, decimals = 0) {
        if (value === undefined || value === null) return '--';
        return Number(value).toFixed(decimals);
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement && this.lastUpdate) {
            lastUpdateElement.textContent = `Last updated: ${this.lastUpdate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })}`;
        }
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        const loader = document.getElementById('loader');
        const content = document.getElementById('weather-content');
        
        if (loader && content) {
            loader.style.display = isLoading ? 'flex' : 'none';
            content.style.display = isLoading ? 'none' : 'block';
        }
    }

    handleError(error) {
        console.error('Weather dashboard error:', error);
        this.setLoading(false);
        
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = 'Unable to fetch weather data. Please try again later.';
            errorElement.style.display = 'block';
            errorElement.classList.add('error-shake');
        }
    }

    setupRefreshInterval() {
        // Refresh weather data every 10 minutes
        setInterval(() => this.loadWeatherData(), 600000);
    }

    updateHourlyForecast(hourlyData) {
        const container = document.getElementById('hourly-forecast');
        if (!container) return;

        container.innerHTML = hourlyData.map((hour, index) => `
            <div class="glass-effect rounded-lg p-4 weather-card text-white mb-4">
                <div class="text-lg font-semibold mb-2">${this.formatHourTime(index)}</div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <div class="flex items-center">
                            <i class="fas fa-temperature-high text-orange-500 mr-2"></i>
                            <span class="text-2xl font-bold">${this.formatNumber(hour.temperature, 1)}°C</span>
                        </div>
                        <div class="flex items-center text-sm opacity-80">
                            <i class="fas fa-cloud-rain text-blue-300 mr-2"></i>
                            <span>${this.formatNumber(hour.precipitation, 1)} mm</span>
                        </div>
                    </div>
                    <div class="space-y-2 text-right">
                        <div class="flex items-center justify-end">
                            <i class="fas fa-wind text-teal-300 mr-2"></i>
                            <span>${this.formatNumber(hour.windspeed, 1)} km/h</span>
                        </div>
                        <div class="flex items-center justify-end text-sm opacity-80">
                            <i class="fas fa-water text-blue-300 mr-2"></i>
                            <span>${this.formatNumber(hour.relativehumidity, 0)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatHourTime(hourOffset) {
        const date = new Date();
        date.setHours(date.getHours() + hourOffset);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});
