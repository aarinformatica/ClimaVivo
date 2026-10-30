/* =========================================================
   CLIMAVIVO — MOTOR METEOROLÓGICO
   API: OpenWeather
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const CONFIG = {
  API_KEY: "8a60b2de14f7a17c7a11706b2cfcd87c",
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  DEFAULT_CITY: "São Paulo",
  REFRESH_INTERVAL: 10 * 60 * 1000,
  REQUEST_TIMEOUT: 12000
};

/* =========================================================
   ELEMENTOS DA INTERFACE
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const elements = {
  welcomeScreen: $("#welcomeScreen"),
  weatherApp: $("#weatherApp"),

  welcomeForm: $("#welcomeForm"),
  welcomeCityInput: $("#welcomeCityInput"),
  welcomeLocationButton: $("#welcomeLocationButton"),
  welcomeError: $("#welcomeError"),

  searchForm: $("#searchForm"),
  cityInput: $("#cityInput"),
  locationButton: $("#locationButton"),
  refreshButton: $("#refreshButton"),
  homeButton: $("#homeButton"),
  backToWelcome: $("#backToWelcome"),

  cityName: $("#cityName"),
  locationCountry: $("#locationCountry"),
  localDate: $("#localDate"),
  localTime: $("#localTime"),
  currentTemp: $("#currentTemp"),
  feelsLike: $("#feelsLike"),
  weatherDescription: $("#weatherDescription"),
  todayMax: $("#todayMax"),
  todayMin: $("#todayMin"),
  lastUpdated: $("#lastUpdated"),

  humidity: $("#humidity"),
  humidityBar: $("#humidityBar"),
  humidityDescription: $("#humidityDescription"),

  windSpeed: $("#windSpeed"),
  windDirection: $("#windDirection"),
  windCompass: $("#windCompass"),
  windDescription: $("#windDescription"),

  pressure: $("#pressure"),
  pressureStatus: $("#pressureStatus"),

  visibility: $("#visibility"),
  visibilityBar: $("#visibilityBar"),
  visibilityDescription: $("#visibilityDescription"),

  mainWeatherIcon: $("#mainWeatherIcon"),
  hourlyForecast: $("#hourlyForecast"),
  dailyForecast: $("#dailyForecast"),

  adviceIcon: $("#adviceIcon"),
  adviceTitle: $("#adviceTitle"),
  adviceText: $("#adviceText"),

  sunOrb: $("#sunOrb"),
  moonOrb: $("#moonOrb"),
  starsLayer: $("#starsLayer"),
  cloudsLayer: $("#cloudsLayer"),
  citySilhouette: $("#citySilhouette"),
  weatherParticles: $("#weatherParticles"),
  fogLayer: $("#fogLayer"),
  lightningLayer: $("#lightningLayer"),
  roadReflection: $("#roadReflection"),

  toast: $("#toast"),
  toastMessage: $("#toastMessage"),
  loadingOverlay: $("#loadingOverlay")
};

/* =========================================================
   ESTADO DO APLICATIVO
   ========================================================= */

const state = {
  currentWeather: null,
  forecast: null,
  cityName: "",
  country: "",
  timezoneOffset: 0,
  currentScene: "night",
  currentWeatherType: "clear",
  lastUpdated: null,
  loading: false,
  refreshTimer: null,
  clockTimer: null,
  toastTimer: null,
  lightningTimer: null,
  particlesTimer: null,
  isInitialized: false
};

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function safeText(value, fallback = "--") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function capitalize(text) {
  if (!text) return "";

  return text.charAt(0).toLocaleUpperCase("pt-BR") +
    text.slice(1);
}

function roundNumber(value) {
  return Math.round(Number(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTemperature(value) {
  if (!Number.isFinite(Number(value))) return "--";

  return `${Math.round(Number(value))}°`;
}

function getLocalDateFromTimestamp(timestamp, timezoneOffset) {
  /*
    O timestamp da API é UTC.
    Aplicamos o offset da cidade e usamos getters UTC
    para não aplicar novamente o fuso do computador.
  */

  return new Date(
    (timestamp + timezoneOffset) * 1000
  );
}

function getDateKey(timestamp, timezoneOffset) {
  const date = getLocalDateFromTimestamp(
    timestamp,
    timezoneOffset
  );

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function formatTime(timestamp, timezoneOffset) {
  const date = getLocalDateFromTimestamp(
    timestamp,
    timezoneOffset
  );

  return date.toLocaleTimeString("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(timestamp, timezoneOffset, options = {}) {
  const date = getLocalDateFromTimestamp(
    timestamp,
    timezoneOffset
  );

  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    ...options
  });
}

function getWeatherDescription(data) {
  return capitalize(
    data?.weather?.[0]?.description || "Condição indisponível"
  );
}

function getWeatherCode(data) {
  return Number(data?.weather?.[0]?.id || 800);
}

/* =========================================================
   ÍCONES METEOROLÓGICOS
   ========================================================= */

function getWeatherIcon(code, isNight = false) {
  if (code >= 200 && code < 300) {
    return "fa-cloud-bolt";
  }

  if (code >= 300 && code < 400) {
    return "fa-cloud-rain";
  }

  if (code >= 500 && code < 600) {
    if (code === 511) return "fa-snowflake";
    if (code >= 520) return "fa-cloud-showers-heavy";

    return "fa-cloud-rain";
  }

  if (code >= 600 && code < 700) {
    return "fa-snowflake";
  }

  if (code >= 700 && code < 800) {
    return "fa-smog";
  }

  if (code === 800) {
    return isNight ? "fa-moon" : "fa-sun";
  }

  if (code === 801) {
    return isNight ? "fa-cloud-moon" : "fa-cloud-sun";
  }

  if (code === 802) {
    return "fa-cloud-sun";
  }

  return "fa-cloud";
}

function getWeatherType(data) {
  const code = getWeatherCode(data);

  if (code >= 200 && code < 300) return "thunderstorm";
  if (code >= 300 && code < 400) return "drizzle";
  if (code >= 500 && code < 600) return "rain";
  if (code >= 600 && code < 700) return "snow";
  if (code === 701) return "mist";
  if (code === 711) return "smoke";
  if (code === 721) return "haze";
  if (code === 731 || code === 751 || code === 761) return "dust";
  if (code === 741) return "fog";
  if (code === 762) return "ash";
  if (code === 771 || code === 781) return "wind";
  if (code === 800) return "clear";
  if (code === 801 || code === 802) return "partly-cloudy";

  return "clouds";
}

/* =========================================================
   NOTIFICAÇÕES
   ========================================================= */

function showToast(message, type = "info") {
  elements.toastMessage.textContent = message;

  const icon = elements.toast.querySelector("i");

  if (icon) {
    icon.className = type === "error"
      ? "fa-solid fa-circle-exclamation"
      : type === "success"
        ? "fa-solid fa-circle-check"
        : "fa-solid fa-circle-info";
  }

  elements.toast.classList.add("visible");

  clearTimeout(state.toastTimer);

  state.toastTimer = setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 4000);
}

function showWelcomeError(message = "") {
  elements.welcomeError.textContent = message;
}

function setLoading(active) {
  state.loading = active;

  elements.loadingOverlay.hidden = !active;

  elements.refreshButton.classList.toggle(
    "is-loading",
    active
  );

  elements.refreshButton.disabled = active;
  elements.locationButton.disabled = active;
}

/* =========================================================
   REQUISIÇÕES HTTP
   ========================================================= */

async function apiRequest(endpoint, parameters = {}) {
  if (!CONFIG.API_KEY || CONFIG.API_KEY === "SUA_API_KEY") {
    throw new Error("Configure sua chave da API OpenWeather.");
  }

  const url = new URL(
    `${CONFIG.BASE_URL}/${endpoint}`
  );

  url.searchParams.set("appid", CONFIG.API_KEY);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "pt_br");

  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage = data?.message || "";

      if (response.status === 401) {
        throw new Error(
          "A API recusou a chave. Confira se ela está correta e ativa."
        );
      }

      if (response.status === 404) {
        throw new Error(
          "Não encontramos essa cidade. Confira o nome e tente novamente."
        );
      }

      if (response.status === 429) {
        throw new Error(
          "Limite de consultas da API atingido. Tente novamente mais tarde."
        );
      }

      throw new Error(
        apiMessage
          ? `Erro meteorológico: ${apiMessage}`
          : `Erro HTTP ${response.status}.`
      );
    }

    return data;

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "A consulta demorou demais. Verifique sua conexão e tente novamente."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   PESQUISAR UMA CIDADE
   ========================================================= */

async function loadWeatherByCity(city) {
  const cleanCity = String(city || "").trim();

  if (!cleanCity) {
    showToast("Digite o nome de uma cidade.", "error");
    return;
  }

  if (state.loading) return;

  setLoading(true);
  showWelcomeError("");

  try {
    /*
      As duas consultas são realizadas em paralelo.
      A previsão de 5 dias da API inclui intervalos de 3 horas.
    */

    const [weather, forecast] = await Promise.all([
      apiRequest("weather", {
        q: cleanCity
      }),

      apiRequest("forecast", {
        q: cleanCity
      })
    ]);

    renderWeather(weather, forecast);
    showApp();

    showToast(
      `Previsão atualizada: ${weather.name}.`,
      "success"
    );

  } catch (error) {
    showWelcomeError(error.message);
    showToast(error.message, "error");

  } finally {
    setLoading(false);
  }
}

/* =========================================================
   PESQUISAR PELA LOCALIZAÇÃO
   ========================================================= */

function loadWeatherByCoordinates(latitude, longitude) {
  if (state.loading) return;

  setLoading(true);
  showWelcomeError("");

  Promise.all([
    apiRequest("weather", {
      lat: latitude,
      lon: longitude
    }),

    apiRequest("forecast", {
      lat: latitude,
      lon: longitude
    })
  ])
    .then(([weather, forecast]) => {
      renderWeather(weather, forecast);
      showApp();

      showToast(
        `Localização encontrada: ${weather.name}.`,
        "success"
      );
    })
    .catch(error => {
      showWelcomeError(error.message);
      showToast(error.message, "error");
    })
    .finally(() => {
      setLoading(false);
    });
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    showToast(
      "Seu navegador não oferece suporte à localização.",
      "error"
    );
    return;
  }

  if (state.loading) return;

  if (!window.isSecureContext) {
    showToast(
      "Para usar a localização, abra o aplicativo em HTTPS ou localhost.",
      "error"
    );
    return;
  }

  setLoading(true);

  navigator.geolocation.getCurrentPosition(
    position => {
      loadWeatherByCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
    },

    error => {
      setLoading(false);

      const messages = {
        1: "Permita o acesso à localização no navegador.",
        2: "Não foi possível determinar sua localização.",
        3: "A localização demorou demais para responder."
      };

      const message = messages[error.code] ||
        "Não foi possível obter sua localização.";

      showWelcomeError(message);
      showToast(message, "error");
    },

    {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000
    }
  );
}

/* =========================================================
   MOSTRAR E ESCONDER TELAS
   ========================================================= */

function showApp() {
  elements.welcomeScreen.hidden = true;
  elements.weatherApp.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showWelcome() {
  elements.weatherApp.hidden = true;
  elements.welcomeScreen.hidden = false;

  showWelcomeError("");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   ATUALIZAR TODOS OS DADOS
   ========================================================= */

function renderWeather(weather, forecast) {
  state.currentWeather = weather;
  state.forecast = forecast;
  state.cityName = weather.name || "";
  state.country = weather.sys?.country || "";
  state.timezoneOffset = Number(weather.timezone || 0);
  state.lastUpdated = Date.now();

  /*
    A cidade retornada pela API pode ser diferente da entrada
    original, por exemplo quando há acentos ou nomes equivalentes.
  */

  elements.cityName.textContent = weather.name || "Cidade";
  elements.locationCountry.textContent = state.country || "--";

  elements.cityInput.value = weather.name || "";
  elements.welcomeCityInput.value = "";

  renderCurrentWeather(weather);
  renderHourlyForecast(forecast);
  renderDailyForecast(forecast);
  renderWeatherAdvice(weather);
  updateAtmosphere(weather);
  updateClock();

  if (!state.isInitialized) {
    state.isInitialized = true;
    startAutomaticRefresh();
  }

  elements.lastUpdated.textContent =
    `Atualizado às ${new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })}`;
}

/* =========================================================
   DADOS ATUAIS
   ========================================================= */

function renderCurrentWeather(data) {
  const temperature = data.main?.temp;
  const feelsLike = data.main?.feels_like;
  const tempMax = data.main?.temp_max;
  const tempMin = data.main?.temp_min;

  elements.currentTemp.textContent =
    Number.isFinite(temperature) ? roundNumber(temperature) : "--";

  elements.feelsLike.textContent = formatTemperature(feelsLike);
  elements.todayMax.textContent = formatTemperature(tempMax);
  elements.todayMin.textContent = formatTemperature(tempMin);

  elements.weatherDescription.textContent =
    getWeatherDescription(data);

  const code = getWeatherCode(data);
  const scene = getSceneFromLocalTime(data);

  elements.mainWeatherIcon.innerHTML =
    `<i class="fa-solid ${getWeatherIcon(
      code,
      scene === "night"
    )}"></i>`;

  /* Umidade */

  const humidity = Number(data.main?.humidity ?? 0);

  elements.humidity.textContent = humidity;
  elements.humidityBar.style.width =
    `${clamp(humidity, 0, 100)}%`;

  if (humidity >= 75) {
    elements.humidityDescription.textContent =
      "Ar bastante úmido";
  } else if (humidity >= 45) {
    elements.humidityDescription.textContent =
      "Umidade moderada";
  } else {
    elements.humidityDescription.textContent =
      "Ar relativamente seco";
  }

  /* Vento */

  const windMetersPerSecond = Number(data.wind?.speed ?? 0);
  const windKmh = windMetersPerSecond * 3.6;

  elements.windSpeed.textContent = Math.round(windKmh);

  const windDegrees = Number(data.wind?.deg ?? 0);

  elements.windCompass.style.transform =
    `rotate(${windDegrees}deg)`;

  elements.windDirection.textContent =
    getWindDirection(windDegrees);

  if (windKmh >= 40) {
    elements.windDescription.textContent =
      "Vento forte";
  } else if (windKmh >= 20) {
    elements.windDescription.textContent =
      "Vento moderado";
  } else {
    elements.windDescription.textContent =
      "Vento leve";
  }

  /* Pressão */

  const pressure = Number(data.main?.pressure ?? 0);

  elements.pressure.textContent =
    pressure ? Math.round(pressure) : "----";

  if (pressure >= 1020) {
    elements.pressureStatus.textContent = "Pressão elevada";
  } else if (pressure <= 1000) {
    elements.pressureStatus.textContent = "Pressão baixa";
  } else {
    elements.pressureStatus.textContent = "Pressão estável";
  }

  /* Visibilidade */

  const visibilityKm = Number(data.visibility ?? 0) / 1000;

  elements.visibility.textContent =
    visibilityKm.toLocaleString("pt-BR", {
      maximumFractionDigits: 1
    });

  elements.visibilityBar.style.width =
    `${clamp((visibilityKm / 10) * 100, 0, 100)}%`;

  if (visibilityKm >= 8) {
    elements.visibilityDescription.textContent =
      "Boa visibilidade";
  } else if (visibilityKm >= 4) {
    elements.visibilityDescription.textContent =
      "Visibilidade moderada";
  } else {
    elements.visibilityDescription.textContent =
      "Visibilidade reduzida";
  }

  elements.pressure.closest(".metric-card")
    ?.setAttribute("aria-label", `Pressão: ${pressure} hPa`);
}

function getWindDirection(degrees) {
  const directions = [
    "Norte",
    "Nordeste",
    "Leste",
    "Sudeste",
    "Sul",
    "Sudoeste",
    "Oeste",
    "Noroeste"
  ];

  const index = Math.round((degrees % 360) / 45) % 8;

  return directions[index];
}

/* =========================================================
   PREVISÃO POR HORA
   ========================================================= */

function renderHourlyForecast(forecast) {
  const items = forecast?.list || [];

  if (!items.length) {
    elements.hourlyForecast.innerHTML =
      '<div class="loading-text">Previsão por hora indisponível.</div>';
    return;
  }

  /*
    Exibimos os próximos 8 intervalos.
    A previsão gratuita do endpoint forecast normalmente
    é apresentada em intervalos de 3 horas.
  */

  const nextHours = items.slice(0, 8);

  elements.hourlyForecast.innerHTML = nextHours.map(
    (item, index) => {
      const time = formatTime(
        item.dt,
        state.timezoneOffset
      );

      const code = getWeatherCode(item);
      const scene = getSceneFromForecastItem(item);

      const icon = getWeatherIcon(
        code,
        scene === "night"
      );

      const temperature = roundNumber(item.main?.temp);

      const rainProbability = Math.round(
        Number(item.pop || 0) * 100
      );

      return `
        <article class="hour-item ${index === 0 ? "current-hour" : ""}">
          <span class="hour-time">${index === 0 ? "Agora" : time}</span>

          <span class="hour-icon">
            <i class="fa-solid ${icon}"></i>
          </span>

          <strong class="hour-temp">${temperature}°</strong>

          <span class="hour-rain">
            <i class="fa-solid fa-droplet"></i>
            ${rainProbability}%
          </span>
        </article>
      `;
    }
  ).join("");
}

/* =========================================================
   PREVISÃO PARA OS PRÓXIMOS 5 DIAS
   ========================================================= */

function renderDailyForecast(forecast) {
  const items = forecast?.list || [];

  if (!items.length) {
    elements.dailyForecast.innerHTML =
      '<div class="loading-text">Previsão diária indisponível.</div>';
    return;
  }

  const grouped = new Map();

  items.forEach(item => {
    const key = getDateKey(
      item.dt,
      state.timezoneOffset
    );

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(item);
  });

  const todayKey = getDateKey(
    forecast.city?.timezone !== undefined
      ? Math.floor(Date.now() / 1000) + state.timezoneOffset
      : Math.floor(Date.now() / 1000),
    0
  );

  /*
    Agrupa as previsões por dia no fuso da cidade.
    Os valores máximos e mínimos são calculados a partir
    das previsões de 3 em 3 horas.
  */

  const days = Array.from(grouped.entries())
    .map(([key, dayItems]) => {
      const temperatures = dayItems
        .map(item => Number(item.main?.temp))
        .filter(Number.isFinite);

      const max = temperatures.length
        ? Math.max(...temperatures)
        : null;

      const min = temperatures.length
        ? Math.min(...temperatures)
        : null;

      const representative = dayItems.reduce(
        (best, item) => {
          const hour = getLocalDateFromTimestamp(
            item.dt,
            state.timezoneOffset
          ).getUTCHours();

          const bestHour = getLocalDateFromTimestamp(
            best.dt,
            state.timezoneOffset
          ).getUTCHours();

          return Math.abs(hour - 12) <
            Math.abs(bestHour - 12)
            ? item
            : best;
        },
        dayItems[0]
      );

      const rainProbability = Math.round(
        Math.max(
          ...dayItems.map(item => Number(item.pop || 0))
        ) * 100
      );

      return {
        key,
        items: dayItems,
        max,
        min,
        representative,
        rainProbability
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  /*
    O primeiro dia pode ser parcial, dependendo do horário.
    Exibimos até cinco datas disponíveis na previsão.
  */

  const visibleDays = days.slice(0, 5);

  elements.dailyForecast.innerHTML = visibleDays.map(
    (day, index) => {
      const date = getLocalDateFromTimestamp(
        day.representative.dt,
        state.timezoneOffset
      );

      const weekday = date.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        weekday: "short"
      });

      const dayName = index === 0
        ? "Hoje"
        : capitalize(weekday.replace(".", ""));

      const code = getWeatherCode(day.representative);
      const scene = getSceneFromForecastItem(
        day.representative
      );

      const icon = getWeatherIcon(
        code,
        scene === "night"
      );

      const description = getWeatherDescription(
        day.representative
      );

      return `
        <article class="day-item">
          <span class="day-name">${dayName}</span>

          <span class="day-description">
            ${description}
          </span>

          <span class="day-icon">
            <i class="fa-solid ${icon}"></i>
          </span>

          <span class="day-temperatures">
            <strong class="day-max">${formatTemperature(day.max)}</strong>
            <span class="day-min">${formatTemperature(day.min)}</span>
          </span>

          <span class="day-rain">
            <i class="fa-solid fa-droplet"></i>
            ${day.rainProbability}%
          </span>
        </article>
      `;
    }
  ).join("");
}

/* =========================================================
   HORÁRIO DO DIA PARA CADA PREVISÃO
   ========================================================= */

function getSceneFromForecastItem(item) {
  const localDate = getLocalDateFromTimestamp(
    item.dt,
    state.timezoneOffset
  );

  const hour = localDate.getUTCHours();

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "sunset";

  return "night";
}

/* =========================================================
   DICA PERSONALIZADA
   ========================================================= */

function renderWeatherAdvice(data) {
  const code = getWeatherCode(data);
  const temperature = Number(data.main?.temp ?? 25);
  const feelsLike = Number(data.main?.feels_like ?? temperature);
  const humidity = Number(data.main?.humidity ?? 50);
  const windSpeed = Number(data.wind?.speed ?? 0) * 3.6;

  let icon = "fa-lightbulb";
  let title = "Aproveite o seu dia";
  let message =
    "Confira as condições do tempo antes de sair e planeje seu dia com tranquilidade.";

  if (code >= 200 && code < 300) {
    icon = "fa-cloud-bolt";
    title = "Atenção às tempestades";
    message =
      "Há indicação de trovoadas. Acompanhe as atualizações, evite áreas abertas durante raios e procure abrigo seguro.";
  } else if (code >= 500 && code < 600) {
    icon = "fa-umbrella";
    title = "Não esqueça o guarda-chuva";
    message =
      "A previsão indica chuva. Leve proteção, redobre a atenção no trânsito e cuidado com superfícies escorregadias.";
  } else if (code >= 300 && code < 400) {
    icon = "fa-cloud-rain";
    title = "Pode cair uma garoa";
    message =
      "O tempo está propício à garoa. Uma jaqueta leve ou um guarda-chuva pode ajudar.";
  } else if (code >= 600 && code < 700) {
    icon = "fa-snowflake";
    title = "Clima frio ou neve";
    message =
      "Vista-se adequadamente para as condições locais e fique atento a eventuais mudanças na previsão.";
  } else if (
    code === 701 ||
    code === 741 ||
    code === 721
  ) {
    icon = "fa-eye";
    title = "Visibilidade reduzida";
    message =
      "Neblina ou névoa pode dificultar a visão. Se for dirigir, reduza a velocidade e mantenha distância segura.";
  } else if (temperature >= 33 || feelsLike >= 35) {
    icon = "fa-sun";
    title = "Dia de calor intenso";
    message =
      "Prefira sombra nos horários mais quentes, beba água regularmente e evite esforço físico intenso sob o sol.";
  } else if (temperature <= 10) {
    icon = "fa-temperature-low";
    title = "O frio chegou";
    message =
      "Considere usar roupas quentes e proteja-se do vento para manter o conforto durante o dia.";
  } else if (humidity >= 80) {
    icon = "fa-droplet";
    title = "Umidade elevada";
    message =
      "O ar está bastante úmido. Pode haver sensação de abafamento; mantenha os ambientes ventilados quando possível.";
  } else if (humidity <= 30) {
    icon = "fa-glass-water";
    title = "Tempo seco";
    message =
      "A umidade está baixa. Beba água ao longo do dia e considere umidificar o ambiente se o ar estiver muito seco.";
  } else if (windSpeed >= 35) {
    icon = "fa-wind";
    title = "Ventos fortes";
    message =
      "Evite ficar perto de estruturas instáveis e objetos que possam ser levados pelo vento.";
  } else if (code === 800) {
    icon = "fa-sun";
    title = "Céu aberto";
    message =
      "Aproveite o tempo aberto! Se houver exposição ao sol, use proteção solar adequada.";
  }

  elements.adviceIcon.innerHTML =
    `<i class="fa-solid ${icon}"></i>`;

  elements.adviceTitle.textContent = title;
  elements.adviceText.textContent = message;
}

/* =========================================================
   CÁLCULO DO CÉU COM BASE NO HORÁRIO LOCAL
   ========================================================= */

function getSceneFromLocalTime(data) {
  const now = Math.floor(Date.now() / 1000);
  const offset = Number(data.timezone || 0);

  const sunrise = Number(data.sys?.sunrise);
  const sunset = Number(data.sys?.sunset);

  /*
    sunrise e sunset são timestamps Unix absolutos.
    A comparação com now deve ser feita diretamente:
    não somamos o offset a esses timestamps.
  */

  if (
    Number.isFinite(sunrise) &&
    Number.isFinite(sunset) &&
    sunrise > 0 &&
    sunset > 0
  ) {
    const dawnStart = sunrise - 40 * 60;
    const dawnEnd = sunrise + 40 * 60;

    const sunsetStart = sunset - 40 * 60;
    const sunsetEnd = sunset + 40 * 60;

    if (now < dawnStart || now > sunsetEnd) {
      return "night";
    }

    if (now >= dawnStart && now < dawnEnd) {
      return "dawn";
    }

    if (now >= sunsetStart && now <= sunsetEnd) {
      return "sunset";
    }

    return "day";
  }

  /*
    Fallback caso a resposta não contenha os horários solares.
  */

  const localDate = new Date((now + offset) * 1000);
  const hour = localDate.getUTCHours();

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "sunset";

  return "night";
}

/* =========================================================
   CENÁRIO: CIDADE, CÉU E ILUMINAÇÃO
   ========================================================= */

function updateAtmosphere(data) {
  const scene = getSceneFromLocalTime(data);
  const weatherType = getWeatherType(data);

  state.currentScene = scene;
  state.currentWeatherType = weatherType;

  document.body.dataset.scene = scene;
  document.body.dataset.weather = weatherType;

  /*
    Regra principal:
    primeiro escondemos os dois corpos celestes.
    Em seguida, mostramos apenas o correspondente ao horário.
  */

  elements.sunOrb.style.opacity = "0";
  elements.moonOrb.style.opacity = "0";

  if (scene === "day") {
    elements.sunOrb.style.opacity = "1";
    elements.sunOrb.style.transform = "scale(1)";

  } else if (scene === "dawn") {
    elements.sunOrb.style.opacity = ".9";
    elements.sunOrb.style.top = "29%";
    elements.sunOrb.style.transform = "scale(.8)";

  } else if (scene === "sunset") {
    elements.sunOrb.style.opacity = ".9";
    elements.sunOrb.style.top = "34%";
    elements.sunOrb.style.transform = "scale(.8)";

  } else {
    elements.moonOrb.style.opacity = "1";
    elements.moonOrb.style.transform =
      "scale(1) rotate(-15deg)";
  }

  /*
    Céu estrelado apenas à noite e no crepúsculo.
  */

  elements.starsLayer.style.opacity =
    scene === "night" ? "1" :
    scene === "dawn" || scene === "sunset" ? ".35" : "0";

  /*
    Ajustes de atmosfera.
  */

  const isWet =
    weatherType === "rain" ||
    weatherType === "drizzle" ||
    weatherType === "thunderstorm";

  elements.roadReflection.style.opacity =
    isWet ? ".9" : "0";

  const isFoggy = [
    "fog",
    "mist",
    "haze",
    "smoke",
    "dust",
    "ash"
  ].includes(weatherType);

  elements.fogLayer.style.opacity =
    isFoggy ? ".62" : "0";

  createWeatherParticles(weatherType);
  updateSceneCaption(scene, weatherType);
  updateCityLighting(scene, weatherType);
  configureLightning(weatherType);
}

function updateSceneCaption(scene, weatherType) {
  const sceneLabels = {
    day: "Céu diurno",
    dawn: "Amanhecer",
    sunset: "Pôr do sol",
    night: "Céu noturno"
  };

  const weatherLabels = {
    clear: "Céu limpo",
    "partly-cloudy": "Poucas nuvens",
    clouds: "Céu nublado",
    rain: "Chuva em andamento",
    drizzle: "Garoa em andamento",
    thunderstorm: "Tempestade",
    snow: "Neve em andamento",
    fog: "Neblina",
    mist: "Névoa",
    haze: "Bruma",
    smoke: "Fumaça",
    dust: "Poeira",
    ash: "Cinzas",
    wind: "Ventos fortes"
  };

  const caption = weatherLabels[weatherType] ||
    sceneLabels[scene] ||
    "Céu em tempo real";

  $("#sceneCaption").textContent = caption;
}

function updateCityLighting(scene, weatherType) {
  const windows = document.querySelectorAll(".building-window");

  const shouldLightWindows =
    scene === "night" ||
    scene === "sunset" ||
    scene === "dawn";

  windows.forEach(windowElement => {
    const isLit = shouldLightWindows && Math.random() > .42;

    if (isLit) {
      windowElement.style.background =
        "rgba(255, 208, 125, .55)";
      windowElement.style.boxShadow =
        "0 0 5px rgba(255, 199, 108, .12)";
    } else {
      windowElement.style.background =
        scene === "day"
          ? "rgba(145, 190, 225, .12)"
          : "rgba(157, 205, 255, .06)";

      windowElement.style.boxShadow = "none";
    }
  });

  /*
    Durante a chuva, o cenário ganha reflexos mais visíveis.
  */

  if (
    weatherType === "rain" ||
    weatherType === "drizzle" ||
    weatherType === "thunderstorm"
  ) {
    elements.roadReflection.style.opacity = ".9";
  }
}

/* =========================================================
   PARTÍCULAS DO CLIMA
   ========================================================= */

function createWeatherParticles(weatherType) {
  const container = elements.weatherParticles;

  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  let count = 0;

  if (weatherType === "rain") count = 115;
  if (weatherType === "drizzle") count = 55;
  if (weatherType === "thunderstorm") count = 150;
  if (weatherType === "snow") count = 75;

  /*
    Reduzimos a quantidade em dispositivos menores.
  */

  if (window.innerWidth < 680) {
    count = Math.round(count * .55);
  }

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");

    if (weatherType === "snow") {
      particle.className = "snowflake";
      particle.textContent = Math.random() > .5 ? "•" : "❄";

      particle.style.left = `${Math.random() * 100}%`;
      particle.style.fontSize =
        `${Math.random() * 8 + 5}px`;

      particle.style.opacity =
        `${Math.random() * .6 + .25}`;

      particle.style.animationDuration =
        `${Math.random() * 8 + 7}s`;

      particle.style.animationDelay =
        `${Math.random() * -15}s`;

    } else {
      particle.className = "raindrop";

      particle.style.left = `${Math.random() * 110}%`;

      particle.style.height =
        `${Math.random() * 12 + 9}px`;

      particle.style.opacity =
        `${Math.random() * .45 + .2}`;

      particle.style.animationDuration =
        `${Math.random() * .65 + (
          weatherType === "drizzle" ? 1.1 : .55
        )}s`;

      particle.style.animationDelay =
        `${Math.random() * -3}s`;
    }

    fragment.appendChild(particle);
  }

  container.appendChild(fragment);
}

/* =========================================================
   RELÂMPAGOS
   ========================================================= */

function configureLightning(weatherType) {
  clearInterval(state.lightningTimer);

  elements.lightningLayer.classList.remove("flash");

  if (weatherType !== "thunderstorm") return;

  state.lightningTimer = setInterval(() => {
    if (Math.random() > .48) {
      elements.lightningLayer.classList.add("flash");

      setTimeout(() => {
        elements.lightningLayer.classList.remove("flash");
      }, 100 + Math.random() * 150);

      /*
        Alguns relâmpagos recebem um segundo clarão.
      */

      if (Math.random() > .55) {
        setTimeout(() => {
          elements.lightningLayer.classList.add("flash");

          setTimeout(() => {
            elements.lightningLayer.classList.remove("flash");
          }, 70);
        }, 180);
      }
    }
  }, 3500);
}

/* =========================================================
   CONSTRUIR O CÉU ESTRELADO
   ========================================================= */

function createStars() {
  const container = elements.starsLayer;
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const count = window.innerWidth < 680 ? 65 : 125;

  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");

    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 70}%`;

    const size = Math.random() > .88 ? 3 : 2;

    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    star.style.animationDuration =
      `${Math.random() * 4 + 2}s`;

    star.style.animationDelay =
      `${Math.random() * 4}s`;

    fragment.appendChild(star);
  }

  container.appendChild(fragment);
}

/* =========================================================
   CONSTRUIR AS NUVENS
   ========================================================= */

function createClouds() {
  const container = elements.cloudsLayer;
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 7; i++) {
    const cloud = document.createElement("div");

    cloud.className = "cloud";

    cloud.style.top = `${5 + Math.random() * 45}%`;
    cloud.style.opacity = `${Math.random() * .15 + .04}`;

    cloud.style.transform =
      `scale(${Math.random() * .8 + .65})`;

    cloud.style.animationDuration =
      `${Math.random() * 70 + 75}s`;

    cloud.style.animationDelay =
      `${Math.random() * -100}s`;

    fragment.appendChild(cloud);
  }

  container.appendChild(fragment);
}

/* =========================================================
   CONSTRUIR A CIDADE
   ========================================================= */

function createCity() {
  const container = elements.citySilhouette;
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const screenWidth = window.innerWidth;

  const buildingCount = clamp(
    Math.round(screenWidth / 34),
    15,
    44
  );

  for (let i = 0; i < buildingCount; i++) {
    const building = document.createElement("div");

    building.className = "building";

    const width =
      Math.random() * 34 + 24;

    const height =
      Math.random() * 155 + 55;

    const left =
      (i / buildingCount) * 100;

    building.style.left = `${left}%`;
    building.style.width = `${width}px`;
    building.style.height = `${height}px`;

    if (Math.random() > .68) {
      const rooftop = document.createElement("div");
      rooftop.className = "rooftop";
      building.appendChild(rooftop);
    }

    if (Math.random() > .8) {
      const antenna = document.createElement("div");
      antenna.className = "rooftop-antenna";
      building.appendChild(antenna);
    }

    const windows = document.createElement("div");
    windows.className = "building-windows";

    const rows = Math.floor(height / 20);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 4; col++) {
        const windowElement = document.createElement("span");

        windowElement.className = "building-window";

        if (Math.random() > .76) {
          windowElement.style.background =
            "rgba(255, 207, 134, .35)";
        }

        windows.appendChild(windowElement);
      }
    }

    building.appendChild(windows);
    fragment.appendChild(building);
  }

  container.appendChild(fragment);

  createStreetDetails();
}

function createStreetDetails() {
  const container = elements.citySilhouette;

  /*
    Detalhes urbanos discretos: postes, semáforos e carros.
  */

  for (let i = 0; i < 4; i++) {
    const lamp = document.createElement("div");
    lamp.className = "street-lamp";

    lamp.style.left = `${8 + i * 27}%`;
    lamp.style.height = `${75 + Math.random() * 40}px`;

    const glow = document.createElement("span");
    glow.className = "lamp-glow";

    lamp.appendChild(glow);
    container.appendChild(lamp);
  }

  for (let i = 0; i < 2; i++) {
    const trafficLight = document.createElement("div");

    trafficLight.className = "traffic-light";
    trafficLight.style.left = `${30 + i * 43}%`;

    container.appendChild(trafficLight);
  }

  for (let i = 0; i < 3; i++) {
    const car = document.createElement("div");

    car.className = "street-car";

    car.style.left = `${Math.random() * 100}%`;
    car.style.animationDuration =
      `${Math.random() * 12 + 16}s`;

    car.style.animationDelay =
      `${Math.random() * -25}s`;

    const headlight = document.createElement("span");
    headlight.className = "headlight";

    car.appendChild(headlight);
    container.appendChild(car);
  }
}

/* =========================================================
   RELÓGIO LOCAL DA CIDADE
   ========================================================= */

function updateClock() {
  const data = state.currentWeather;

  if (!data) return;

  const nowSeconds = Math.floor(Date.now() / 1000);

  const localDate = getLocalDateFromTimestamp(
    nowSeconds,
    state.timezoneOffset
  );

  elements.localTime.textContent =
    localDate.toLocaleTimeString("pt-BR", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  elements.localDate.textContent =
    localDate.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
      weekday: "long",
      day: "2-digit",
      month: "long"
    });

  /*
    Reavalia o céu periodicamente.
    A consulta do clima não precisa ser refeita a cada segundo.
  */

  const nextScene = getSceneFromLocalTime(data);

  if (nextScene !== state.currentScene) {
    updateAtmosphere(data);

    const code = getWeatherCode(data);

    elements.mainWeatherIcon.innerHTML =
      `<i class="fa-solid ${getWeatherIcon(
        code,
        nextScene === "night"
      )}"></i>`;
  }
}

/* =========================================================
   ATUALIZAÇÃO AUTOMÁTICA
   ========================================================= */

function startAutomaticRefresh() {
  clearInterval(state.refreshTimer);
  clearInterval(state.clockTimer);

  state.clockTimer = setInterval(() => {
    updateClock();
  }, 1000);

  state.refreshTimer = setInterval(() => {
    refreshWeatherSilently();
  }, CONFIG.REFRESH_INTERVAL);
}

async function refreshWeatherSilently() {
  if (
    !state.currentWeather ||
    !state.cityName ||
    state.loading
  ) {
    return;
  }

  try {
    const [weather, forecast] = await Promise.all([
      apiRequest("weather", {
        q: `${state.cityName},${state.country}`
      }),

      apiRequest("forecast", {
        q: `${state.cityName},${state.country}`
      })
    ]);

    renderWeather(weather, forecast);

  } catch (error) {
    /*
      A previsão anterior continua visível se a atualização
      automática falhar.
    */

    console.warn(
      "Não foi possível atualizar a previsão automaticamente:",
      error.message
    );
  }
}

/* =========================================================
   EVENTOS
   ========================================================= */

function bindEvents() {
  elements.welcomeForm.addEventListener("submit", event => {
    event.preventDefault();

    loadWeatherByCity(
      elements.welcomeCityInput.value
    );
  });

  elements.searchForm.addEventListener("submit", event => {
    event.preventDefault();

    loadWeatherByCity(
      elements.cityInput.value
    );
  });

  elements.welcomeLocationButton.addEventListener(
    "click",
    requestUserLocation
  );

  elements.locationButton.addEventListener(
    "click",
    requestUserLocation
  );

  elements.refreshButton.addEventListener("click", async () => {
    if (!state.currentWeather || state.loading) return;

    await refreshWeatherManually();
  });

  elements.backToWelcome.addEventListener(
    "click",
    showWelcome
  );

  elements.homeButton.addEventListener("click", event => {
    event.preventDefault();
    showWelcome();
  });

  document.querySelectorAll("[data-city]").forEach(button => {
    button.addEventListener("click", () => {
      loadWeatherByCity(button.dataset.city);
    });
  });

  /*
    Redesenha a cidade e o céu após uma mudança significativa
    no tamanho da tela, evitando reconstruções constantes.
  */

  let resizeTimer;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      createStars();
      createClouds();
      createCity();

      if (state.currentWeather) {
        updateAtmosphere(state.currentWeather);
      }
    }, 250);
  });
}

async function refreshWeatherManually() {
  const data = state.currentWeather;

  if (!data) return;

  setLoading(true);

  try {
    const [weather, forecast] = await Promise.all([
      apiRequest("weather", {
        q: `${data.name},${data.sys?.country || ""}`
      }),

      apiRequest("forecast", {
        q: `${data.name},${data.sys?.country || ""}`
      })
    ]);

    renderWeather(weather, forecast);

    showToast(
      "Previsão atualizada com sucesso.",
      "success"
    );

  } catch (error) {
    showToast(error.message, "error");

  } finally {
    setLoading(false);
  }
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function initializeApp() {
  document.querySelectorAll(".current-year").forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  createStars();
  createClouds();
  createCity();
  bindEvents();

  /*
    Mantemos a tela de entrada como experiência inicial.
    O usuário pode pesquisar uma cidade ou usar os atalhos.
  */

  elements.welcomeScreen.hidden = false;
  elements.weatherApp.hidden = true;

  /*
    O cenário inicial é noturno e será ajustado assim que
    a API informar o nascer e o pôr do sol da cidade.
  */

  document.body.dataset.scene = "night";
  document.body.dataset.weather = "clear";

  /*
    Carregamento inicial automático.
    O aplicativo abre com São Paulo caso o usuário ainda
    não tenha escolhido uma cidade.
  */

  loadWeatherByCity(CONFIG.DEFAULT_CITY);
}

document.addEventListener("DOMContentLoaded", initializeApp);
