// Constants
const API_KEY = 'e18a90ba2f70f492ea6b31ff00a89c26'; // Replace with your API key
const AQI_API_KEY = 'f709213556d52b39ff1bba824330ab1c9230d74b'; // Replace with your API key

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');
const locationBtn = document.getElementById('locationBtn');
const tempUnitToggle = document.getElementById('tempUnitToggle');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const weatherContent = document.getElementById('weatherContent');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Weather Icons Mapping
const weatherIcons = {
    '01d': 'ri-sun-line',
    '01n': 'ri-moon-clear-line',
    '02d': 'ri-sun-cloudy-line',
    '02n': 'ri-moon-cloudy-line',
    '03d': 'ri-cloudy-line',
    '03n': 'ri-cloudy-line',
    '04d': 'ri-cloudy-2-line',
    '04n': 'ri-cloudy-2-line',
    '09d': 'ri-showers-line',
    '09n': 'ri-showers-line',
    '10d': 'ri-heavy-showers-line',
    '10n': 'ri-heavy-showers-line',
    '11d': 'ri-thunderstorms-line',
    '11n': 'ri-thunderstorms-line',
    '13d': 'ri-snowy-line',
    '13n': 'ri-snowy-line',
    '50d': 'ri-mist-line',
    '50n': 'ri-mist-line'
};

// State Variables
let isMetric = true;
let lastSearchedCity = localStorage.getItem('lastCity') || 'Delhi';
let currentWeatherData = null;
let forecastData = null;
let aqiData = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    setupEventListeners();
    
    // Fetch Indian cities from API
    fetchIndianCities();
    
    // Load last searched city or default
    if (lastSearchedCity) {
        getWeatherByCity(lastSearchedCity);
    }
});

// Fetch Indian cities from API
function fetchIndianCities() {
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            country: 'india'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.data && Array.isArray(data.data)) {
            window.indianCities = data.data;
        } else {
            // Fallback to a predefined list if API fails
            window.indianCities = [
                'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
                'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow',
                'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
                'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
                'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
                'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar',
                'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore'
            ];
        }
    })
    .catch(error => {
        console.error('Error fetching cities:', error);
        // Fallback to a predefined list if API fails
        window.indianCities = [
            'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
            'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow',
            'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal','Samalkha'
        ];
    });
}

function setupEventListeners() {
    // Search input event
    searchInput.addEventListener('input', handleSearchInput);
    
    // Search input focus event
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length > 0) {
            showDropdown();
        }
    });
    
    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            hideDropdown();
        }
    });
    
    // Location button click
    locationBtn.addEventListener('click', getCurrentLocation);
    
    // Temperature unit toggle
    tempUnitToggle.addEventListener('change', toggleTemperatureUnit);
    
    // Retry button click
    retryBtn.addEventListener('click', () => {
        getWeatherByCity(lastSearchedCity);
    });
}

function handleSearchInput() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length === 0) {
        hideDropdown();
        return;
    }
    
    if (!window.indianCities) {
        return; // Wait for cities to load
    }
    
    const filteredCities = window.indianCities.filter(city => 
        city.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results for better performance
    
    if (filteredCities.length > 0) {
        populateDropdown(filteredCities);
        showDropdown();
    } else {
        hideDropdown();
    }
}

function populateDropdown(cities) {
    searchDropdown.innerHTML = '';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = city;
        item.addEventListener('click', () => {
            searchInput.value = city;
            hideDropdown();
            getWeatherByCity(city);
        });
        searchDropdown.appendChild(item);
    });
}

function showDropdown() {
    searchDropdown.classList.add('show');
}

function hideDropdown() {
    searchDropdown.classList.remove('show');
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to retrieve your location. Please allow location access or search for a city.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser. Please search for a city instead.');
    }
}

function getWeatherByCity(city) {
    showLoading();
    
    // Store the city for future use
    localStorage.setItem('lastCity', city);
    lastSearchedCity = city;
    
    // Fetch current weather
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},in&appid=${API_KEY}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found or API error');
            }
            return response.json();
        })
        .then(data => {
            currentWeatherData = data;
            
            // Fetch 5-day forecast
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city},in&appid=${API_KEY}&units=metric`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Forecast data not available');
            }
            return response.json();
        })
        .then(data => {
            forecastData = data;
            
            // Fetch AQI data
            const lat = currentWeatherData.coord.lat;
            const lon = currentWeatherData.coord.lon;
            return fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQI_API_KEY}`);
        })
        .then(response => response.json())
        .then(data => {
            aqiData = data;
            updateUI();
            showWeather();
        })
        .catch(error => {
            console.error('Weather fetch error:', error);
            showError('Could not fetch weather data for ' + city + '. Please try another city.');
        });
}

function getWeatherByCoords(lat, lon) {
    showLoading();
    
    // Fetch current weather by coordinates
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Location not found or API error');
            }
            return response.json();
        })
        .then(data => {
            // Check if the location is in India
            if (data.sys.country !== 'IN') {
                throw new Error('Location is not in India');
            }
            
            currentWeatherData = data;
            localStorage.setItem('lastCity', data.name);
            lastSearchedCity = data.name;
            
            // Fetch 5-day forecast
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Forecast data not available');
            }
            return response.json();
        })
        .then(data => {
            forecastData = data;
            
            // Fetch AQI data
            return fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${AQI_API_KEY}`);
        })
        .then(response => response.json())
        .then(data => {
            aqiData = data;
            updateUI();
            showWeather();
        })
        .catch(error => {
            console.error('Weather fetch error:', error);
            if (error.message === 'Location is not in India') {
                showError('This app only supports Indian locations. Please search for an Indian city.');
            } else {
                showError('Could not fetch weather data for your location. Please try searching for a city.');
            }
        });
}

function updateUI() {
    if (!currentWeatherData) return;
    
    // Update current weather
    document.getElementById('cityName').textContent = currentWeatherData.name;
    
    const temp = isMetric ? currentWeatherData.main.temp : celsiusToFahrenheit(currentWeatherData.main.temp);
    document.getElementById('currentTemp').textContent = Math.round(temp) + '°';
    document.getElementById('tempUnit').textContent = isMetric ? 'C' : 'F';
    
    const feelsLike = isMetric ? currentWeatherData.main.feels_like : celsiusToFahrenheit(currentWeatherData.main.feels_like);
    document.getElementById('feelsLike').textContent = Math.round(feelsLike) + '°' + (isMetric ? 'C' : 'F');
    
    document.getElementById('weatherDescription').textContent = capitalizeFirstLetter(currentWeatherData.weather[0].description);
    
    // Update weather icon
    const iconCode = currentWeatherData.weather[0].icon;
    const iconClass = weatherIcons[iconCode] || 'ri-cloudy-line';
    document.getElementById('weatherIcon').innerHTML = `<i class="${iconClass}"></i>`;
    
    // Update date
    const currentDate = new Date();
    document.getElementById('currentDate').textContent = formatDate(currentDate);
    
    // Update metrics
    document.getElementById('humidityValue').textContent = currentWeatherData.main.humidity + '%';
    
    const windSpeed = isMetric ? 
        currentWeatherData.wind.speed : // Already in m/s
        currentWeatherData.wind.speed * 2.237; // Convert to mph
    
    document.getElementById('windValue').textContent = 
        Math.round(windSpeed) + (isMetric ? ' km/h' : ' mph');
    
    document.getElementById('windDirection').textContent = getWindDirection(currentWeatherData.wind.deg);
    
    // Update sunrise/sunset
    const sunriseTime = new Date(currentWeatherData.sys.sunrise * 1000);
    const sunsetTime = new Date(currentWeatherData.sys.sunset * 1000);
    document.getElementById('sunriseValue').textContent = formatTime(sunriseTime);
    document.getElementById('sunsetValue').textContent = formatTime(sunsetTime);
    
    // Update AQI
    updateAQI();
    
    // Update forecast
    updateForecast();
}

function updateAQI() {
    if (aqiData && aqiData.data && aqiData.status === 'ok') {
        const aqi = aqiData.data.aqi;
        document.getElementById('aqiValue').textContent = aqi;
        
        let aqiStatus, aqiMessage, aqiClass, aqiWidth;
        
        if (aqi <= 50) {
            aqiStatus = 'Good';
            aqiMessage = '✨ Excellent air quality! Perfect for outdoor activities.';
            aqiClass = 'aqi-good';
            aqiWidth = '20%';
        } else if (aqi <= 100) {
            aqiStatus = 'Moderate';
            aqiMessage = '👌 Generally safe, but sensitive individuals should limit prolonged outdoor exposure.';
            aqiClass = 'aqi-moderate';
            aqiWidth = '40%';
        } else if (aqi <= 150) {
            aqiStatus = 'Unhealthy for Sensitive Groups';
            aqiMessage = '⚠️ Children, elderly, and those with respiratory conditions should avoid outdoor activities.';
            aqiClass = 'aqi-moderate';
            aqiWidth = '60%';
        } else if (aqi <= 200) {
            aqiStatus = 'Unhealthy';
            aqiMessage = '😷 Everyone should reduce outdoor activities. Wear masks if going outside.';
            aqiClass = 'aqi-poor';
            aqiWidth = '75%';
        } else if (aqi <= 300) {
            aqiStatus = 'Very Unhealthy';
            aqiMessage = '🚫 Avoid outdoor activities. Keep windows closed. Use air purifiers if available.';
            aqiClass = 'aqi-severe';
            aqiWidth = '90%';
        } else {
            aqiStatus = 'Hazardous';
            aqiMessage = '⚠️ Emergency conditions! Stay indoors and follow local health advisory.';
            aqiClass = 'aqi-hazardous';
            aqiWidth = '100%';
        }
        
        document.getElementById('aqiStatus').textContent = aqiStatus;
        document.getElementById('aqiMessage').textContent = aqiMessage;
        document.getElementById('aqiBar').style.width = aqiWidth;
        document.getElementById('aqiIndicator').className = `aqi-indicator ${aqiClass}`;
    } else {
        // Default AQI if data not available
        document.getElementById('aqiValue').textContent = 'N/A';
        document.getElementById('aqiStatus').textContent = 'Data Unavailable';
        document.getElementById('aqiMessage').textContent = 'Air quality data is currently unavailable.';
        document.getElementById('aqiBar').style.width = '0%';
        document.getElementById('aqiIndicator').className = 'aqi-indicator aqi-moderate';
    }
}

function updateForecast() {
    if (!forecastData || !forecastData.list) return;
    
    // Get one forecast per day (noon time)
    const dailyForecasts = getDailyForecasts(forecastData.list);
    
    for (let i = 0; i < 5; i++) {
        if (dailyForecasts[i]) {
            const forecast = dailyForecasts[i];
            const day = new Date(forecast.dt * 1000);
            const dayName = formatDay(day);
            const iconCode = forecast.weather[0].icon;
            const iconClass = weatherIcons[iconCode] || 'ri-cloudy-line';
            const description = capitalizeFirstLetter(forecast.weather[0].description);
            
            const maxTemp = isMetric ? 
                forecast.main.temp_max : 
                celsiusToFahrenheit(forecast.main.temp_max);
                
            const minTemp = isMetric ? 
                forecast.main.temp_min : 
                celsiusToFahrenheit(forecast.main.temp_min);
            
            document.getElementById(`day${i+1}`).textContent = dayName;
            document.getElementById(`day${i+1}Icon`).innerHTML = `<i class="${iconClass}"></i>`;
            document.getElementById(`day${i+1}Desc`).textContent = description;
            document.getElementById(`day${i+1}Max`).textContent = Math.round(maxTemp) + '°';
            document.getElementById(`day${i+1}Min`).textContent = Math.round(minTemp) + '°';
        }
    }
}

function getDailyForecasts(forecastList) {
    const dailyForecasts = [];
    const dayMap = new Map();
    
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toDateString();
        
        // Skip today
        if (date.getDate() === new Date().getDate()) {
            return;
        }
        
        // Get forecast for around noon (12-15) for each day
        const hour = date.getHours();
        if (hour >= 12 && hour <= 15) {
            if (!dayMap.has(day)) {
                dayMap.set(day, forecast);
                dailyForecasts.push(forecast);
            }
        }
    });
    
    // If we don't have enough forecasts, add any time from missing days
    if (dailyForecasts.length < 5) {
        forecastList.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toDateString();
            
            // Skip today
            if (date.getDate() === new Date().getDate()) {
                return;
            }
            
            if (!dayMap.has(day) && dailyForecasts.length < 5) {
                dayMap.set(day, forecast);
                dailyForecasts.push(forecast);
            }
        });
    }
    
    return dailyForecasts.slice(0, 5);
}

function toggleTemperatureUnit() {
    isMetric = !tempUnitToggle.checked;
    
    if (currentWeatherData) {
        updateUI();
    }
}

function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    weatherContent.classList.add('hidden');
}

function showError(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    errorMessage.textContent = message;
}

function showWeather() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    weatherContent.classList.remove('hidden');
}

// Helper Functions
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function formatDay(date) {
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getWindDirection(degrees) {
    const directions = ['North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}