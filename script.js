//DOMの読み込み完了後ハンバーガーメニューの有効化

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

//天気と潮汐データを取得
document.getElementById("weather-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const city = document.getElementById("city").value.trim();
  const weatherApiKey = "504b3fc6fd4a78eb428714b8393715dd";
  const tideApiKey = "1d5de4a3-9442-4d11-a5f5-c787875807cb";

  const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric&lang=ja`;

  try {

    //天気APIの呼び出し
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("天気が取得できません");
    const weatherData = await weatherRes.json();

    const { lat, lon } = weatherData.city.coord;

    //潮汐APIの呼び出し
    const tideUrl = `https://www.worldtides.info/api/v3?extremes&lat=${lat}&lon=${lon}&key=${tideApiKey}`;
    const tideRes = await fetch(tideUrl);
    if (!tideRes.ok) throw new Error("潮汐情報取得エラー");
    const tideData = await tideRes.json();

    displayWeatherAndTide(weatherData, tideData);
  } catch (err) {
    alert("エラー: " + err.message);
  }
});

//指定日時に近い潮汐データを探す関数
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

//天気を自然な日本語表現にするマッピング
const weatherDescriptionMap = {
  "適度な雨": "雨",
  "厚い雲": "曇り",
  "曇りがち": "曇り時々晴れ",
  "晴天": "快晴",
  "晴れがち": "晴れ時々曇り",
  "雷雨": "雷を伴う雨",
  "弱い雪": "小雪",
};

//天気と潮汐データを表示する関数
function displayWeatherAndTide(weatherData, tideData) {
  const container = document.getElementById("weather-cards");
  container.innerHTML = "";
  document.getElementById("search-results").style.display = "block";

  const now = new Date();

  //3時間ごとの天気情報を抽出
  const filteredList = weatherData.list.filter(item => {
    const itemDate = new Date(item.dt_txt);
    const hour = itemDate.getHours();
    return hour % 3 === 0 && itemDate > now && hour >= 0 && hour <= 21;
  });

  //日付ごとにデータをグループ分け
  const dailyGroups = {};
  filteredList.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyGroups[date]) dailyGroups[date] = [];
    dailyGroups[date].push(item);
  });

  //天気と潮汐情報をカード形式で表示
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

      // 風向きを変換
      const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
                          '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
      const deg = item.wind.deg;
      const dirIndex = Math.round(deg / 22.5) % 16;
      const windDir = directions[dirIndex];

      // 潮汐情報の取得
      const closestTide = findClosestTide(tideData.extremes, item.dt_txt);
      const tideLabel = closestTide
        ? `${new Date(closestTide.date).getHours()}時 ${closestTide.type === "High" ? "満潮" : "干潮"}`
        : "潮情報なし";

      //天気の表現を変換
      const rawDescription = item.weather[0].description;
      const translatedDescription = weatherDescriptionMap[rawDescription] || rawDescription;

      //HTMLにカードを生成
      card.innerHTML = `
        <h4>${time}時</h4>
        <img src="${iconUrl}" alt="${translatedDescription}" />
        <p>${translatedDescription}</p>
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