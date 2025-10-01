// -------------------------
// 🌦 Weather App Script
// -------------------------

const API_KEY = "83d92a2781a311e1b2180ceee8c3d522"; // 🔑 Replace with your own key
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const geoBtn = document.getElementById("geo-btn");
const forecastList = document.getElementById("forecast-list");

// -------------------------
// Event Listeners
// -------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    getWeatherByCity(city);
  }
});

geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (err) => alert("Location access denied ❌")
    );
  }
});

// -------------------------
// API Calls
// -------------------------
async function getWeatherByCity(city) {
  try {
    const res = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    if (data.cod !== 200) {
      alert(data.message);
      return;
    }
    updateCurrentWeather(data);
    getForecast(data.coord.lat, data.coord.lon);
    getAirQuality(data.coord.lat, data.coord.lon);
  } catch (error) {
    console.error(error);
  }
}

async function getWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await res.json();
    updateCurrentWeather(data);
    getForecast(lat, lon);
    getAirQuality(lat, lon);
  } catch (error) {
    console.error(error);
  }
}

async function getForecast(lat, lon) {
  const res = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  const data = await res.json();
  updateForecast(data);
}

async function getAirQuality(lat, lon) {
  const res = await fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  const data = await res.json();
  updateAirQuality(data);
}

// -------------------------
// Update DOM
// -------------------------
function updateCurrentWeather(data) {
  document.querySelector("[data-city]").textContent = `${data.name}, ${data.sys.country}`;
  document.querySelector("[data-datetime]").textContent = new Date().toLocaleString();
  document.querySelector("[data-temp]").textContent = `${Math.round(data.main.temp)}°C`;
  document.querySelector("[data-condition]").textContent = data.weather[0].description;

  document.querySelector("[data-humidity]").textContent = `${data.main.humidity}%`;
  document.querySelector("[data-wind]").textContent = `${data.wind.speed} km/h`;
  document.querySelector("[data-pressure]").textContent = `${data.main.pressure} hPa`;
  document.querySelector("[data-visibility]").textContent = `${data.visibility / 1000} km`;

  document.querySelector("[data-sunrise]").textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.querySelector("[data-sunset]").textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function updateForecast(data) {
  forecastList.innerHTML = ""; // clear old data

  // Group forecast data by day (every 8 steps = ~24h)
  const daily = {};
  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) {
      daily[date] = item;
    }
  });

  Object.keys(daily)
    .slice(0, 5) // only 5 days
    .forEach((date) => {
      const item = daily[date];
      const day = new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(item.main.temp);
      const desc = item.weather[0].description;

      const card = document.createElement("article");
      card.className = "forecast card";
      card.innerHTML = `
        <header class="forecast-head">
          <h3 class="day">${day}</h3>
          <p class="date">${date}</p>
        </header>
        <div class="forecast-main">
          <div class="big">${temp}°C</div>
          <div class="small">${desc}</div>
        </div>
        <footer class="forecast-foot">
          <span>H: <strong>${Math.round(item.main.temp_max)}°</strong></span>
          <span>L: <strong>${Math.round(item.main.temp_min)}°</strong></span>
        </footer>
      `;
      forecastList.appendChild(card);
    });
}

function updateAirQuality(data) {
  const aqi = data.list[0].main.aqi;
  const components = data.list[0].components;

  document.querySelector("[data-aqi-badge]").textContent = aqi;
  document.querySelector("[data-pm25]").textContent = components.pm2_5;
  document.querySelector("[data-pm10]").textContent = components.pm10;
  document.querySelector("[data-co]").textContent = components.co;
  document.querySelector("[data-so2]").textContent = components.so2;
  document.querySelector("[data-no2]").textContent = components.no2;
  document.querySelector("[data-o3]").textContent = components.o3;

  let note = "";
  let color = "";
  switch (aqi) {
    case 1: note = "Good 😊"; color = "linear-gradient(180deg,#34e39d,#16a34a)"; break;
    case 2: note = "Fair 🙂"; color = "linear-gradient(180deg,#9be734,#60a917)"; break;
    case 3: note = "Moderate 😐"; color = "linear-gradient(180deg,#f4d03f,#f39c12)"; break;
    case 4: note = "Poor 😷"; color = "linear-gradient(180deg,#e67e22,#d35400)"; break;
    case 5: note = "Very Poor ☠️"; color = "linear-gradient(180deg,#e74c3c,#c0392b)"; break;
  }
  document.querySelector("[data-aqi-note]").textContent = note;
  document.querySelector("[data-aqi-badge]").style.background = color;
}

function setWeatherBackground(condition) {
  const container = document.querySelector('.weather-container');
  
  const map = {
    clear: 'sunny',
    clouds: 'cloudy',
    rain: 'rain',
    snow: 'snow',
    thunderstorm: 'rain',
    drizzle: 'rain',
    mist: 'cloudy'
  };

  const cls = map[condition.toLowerCase()] || 'default';
  container.className = 'weather-container ' + cls;
}

setWeatherBackground(data.weather[0].main);

// -------------------------
// Init (default city)
// -------------------------
getWeatherByCity("");
