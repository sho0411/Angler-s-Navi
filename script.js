document.addEventListener("DOMContentLoaded", () => {
  const hamburgers = document.getElementsByClassName('hamburger');
  const navMenus = document.getElementsByClassName('nav-menu');

  for (let i = 0; i < hamburgers.length; i++) {
    const hamburger = hamburgers[i];
    const navMenu = navMenus[i];

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });
    }
  }
});

document.getElementById("weather-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const city = document.getElementById("city").value.trim();
  const weatherApiKey = "504b3fc6fd4a78eb428714b8393715dd"; // OpenWeatherMap用
  const tideApiKey = "1d5de4a3-9442-4d11-a5f5-c787875807cb"; // ← ここにあなたのWorldTides APIキーを入力

  const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric&lang=ja`;

  try {
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("天気が取得できません");
    const weatherData = await weatherRes.json();

    const { lat, lon } = weatherData.city.coord;

    const tideUrl = `https://www.worldtides.info/api/v3?extremes&lat=${lat}&lon=${lon}&key=${tideApiKey}`;
    const tideRes = await fetch(tideUrl);
    if (!tideRes.ok) throw new Error("潮汐情報取得エラー");
    const tideData = await tideRes.json();

    displayWeatherAndTide(weatherData, tideData);
  } catch (err) {
    alert("エラー: " + err.message);
  }
});

function findClosestTide(extremes, targetDateTimeStr) {
  const target = new Date(targetDateTimeStr);
  let closest = null;
  let minDiff = Infinity;

  extremes.forEach(tide => {
    const tideTime = new Date(tide.date);
    const diff = Math.abs(tideTime - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tide;
    }
  });

  return closest;
}

function displayWeatherAndTide(weatherData, tideData) {
  const container = document.getElementById("weather-cards");
  container.innerHTML = "";
  document.getElementById("search-results").style.display = "block";

  const now = new Date();

  const filteredList = weatherData.list.filter(item => {
    const itemDate = new Date(item.dt_txt);
    const hour = itemDate.getHours();
    return hour % 3 === 0 && itemDate > now && hour >= 0 && hour <= 21;
  });

  const dailyGroups = {};
  filteredList.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyGroups[date]) dailyGroups[date] = [];
    dailyGroups[date].push(item);
  });

  for (const [date, items] of Object.entries(dailyGroups)) {
    const daySection = document.createElement("div");
    daySection.className = "weather-day";

    const dateTitle = document.createElement("h3");
    dateTitle.textContent = date;
    daySection.appendChild(dateTitle);

    const rowContainer = document.createElement("div");
    rowContainer.className = "weather-row";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "weather-card";

      const time = new Date(item.dt_txt).getHours();
      const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;

      // 風向きを角度から方位へ変換
      const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
                          '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
      const deg = item.wind.deg;
      const dirIndex = Math.round(deg / 22.5) % 16;
      const windDir = directions[dirIndex];

      // 潮汐データから最も近い満潮/干潮を探す
      const closestTide = findClosestTide(tideData.extremes, item.dt_txt);
      const tideLabel = closestTide
        ? `${new Date(closestTide.date).getHours()}時 ${closestTide.type === "High" ? "満潮" : "干潮"}`
        : "潮情報なし";

      card.innerHTML = `
        <h4>${time}時</h4>
        <img src="${iconUrl}" alt="${item.weather[0].description}" />
        <p>${item.weather[0].description}</p>
        <p>気温: ${item.main.temp.toFixed(1)}°C</p>
        <p>風速: ${item.wind.speed}m/s</p>
        <p>風向: ${windDir}</p>
        <p>潮: ${tideLabel}</p>
      `;

      rowContainer.appendChild(card);
    });

    daySection.appendChild(rowContainer);
    container.appendChild(daySection);
  }
}