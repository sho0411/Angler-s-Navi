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
  const apiKey = "504b3fc6fd4a78eb428714b8393715dd"; // ご自身のAPIキーに置き換えてください
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ja`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("ポイントが見つかりません");
    const data = await res.json();
    displayWeather(data);
  } catch (error) {
    alert("エラー：" + error.message);
  }
});

function displayWeather(data) {
  const container = document.getElementById("weather-cards");
  container.innerHTML = ""; // 前回の結果をクリア
  document.getElementById("search-results").style.display = "block";

  const now = new Date();

const filteredList = data.list.filter(item => {
  const itemDate = new Date(item.dt_txt);
  const hour = itemDate.getHours();

  return hour % 3 === 0 && itemDate > now && hour >= 0 && hour <= 21;
});

  const dailyGroups = {};
  filteredList.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyGroups[date]) {
      dailyGroups[date] = [];
    }
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

      card.innerHTML = `
        <h4>${time}時</h4>
        <img src="${iconUrl}" alt="${item.weather[0].description}" />
        <p>${item.weather[0].description}</p>
        <p>気温: ${item.main.temp.toFixed(1)}°C</p>
        <p>湿度: ${item.main.humidity}%</p>
        <p>風速: ${item.wind.speed}m/s</p>
      `;

      rowContainer.appendChild(card);
    });

    daySection.appendChild(rowContainer);
    container.appendChild(daySection);
  }
}
