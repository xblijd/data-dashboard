const dashboard = document.getElementById("dashboard");
const chartCtx = document.getElementById("priceChart").getContext("2d");
const coinFilter = document.getElementById("coinFilter");
const toggleTheme = document.getElementById("toggleTheme");
const timeButtons = document.querySelectorAll(".time-filters button");
const chartTypeSelect = document.getElementById("chartType");

let priceChart;
let selectedCoin = coinFilter.value;
let selectedDays = "7";
let selectedChartType = chartTypeSelect.value;
const vsCurrency = "eur";

// Theme toggle
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleTheme.textContent = document.body.classList.contains("dark")
    ? "☀️ Lichte modus"
    : "🌙 Donkere modus";
});

// Coin & tijdsfilter
coinFilter.addEventListener("change", () => {
  selectedCoin = coinFilter.value;
  fetchAll();
});
timeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    timeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDays = btn.dataset.days;
    fetchAll();
  });
});

// Chart type switch
chartTypeSelect.addEventListener("change", () => {
  selectedChartType = chartTypeSelect.value;
  fetchAll();
});

function showCurrentPrice(data) {
  dashboard.innerHTML = "";
  const price = data[selectedCoin][vsCurrency];
  const div = document.createElement("div");
  div.className = "coin";
  div.innerText = `${selectedCoin.toUpperCase()}: €${price.toLocaleString("nl-NL", {
    minimumFractionDigits: 2,
  })}`;
  dashboard.appendChild(div);
}

function updateChart(data) {
  if (priceChart) priceChart.destroy();

  const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim();
  const accentBg = getComputedStyle(document.body).getPropertyValue("--accent-bg").trim();

  if (selectedChartType === "candlestick") {
    const candlestickData = data.map(([timestamp, o, h, l, c]) => ({
      x: new Date(timestamp),
      o, h, l, c,
    }));

    priceChart = new Chart(chartCtx, {
      type: "candlestick",
      data: {
        datasets: [{
          label: `Candlestick (${selectedCoin.toUpperCase()})`,
          data: candlestickData,
          borderColor: accent,
          backgroundColor: accentBg,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { type: "time", time: { tooltipFormat: 'dd MMM yyyy' } },
          y: { beginAtZero: false }
        }
      }
    });
  } else {
    const labels = data.map(p => new Date(p[0]).toLocaleDateString("nl-NL"));
    const values = data.map(p => p[1]);

    priceChart = new Chart(chartCtx, {
      type: selectedChartType,
      data: {
        labels,
        datasets: [{
          label: `Prijs van ${selectedCoin.toUpperCase()} (EUR)`,
          data: values,
          borderColor: accent,
          backgroundColor: accentBg,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000 },
        scales: {
          y: { beginAtZero: false }
        }
      }
    });
  }
}

async function fetchAll() {
  try {
    const priceRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=${vsCurrency}`
    );
    const priceData = await priceRes.json();
    showCurrentPrice(priceData);

    let chartData;

    if (selectedChartType === "candlestick" && selectedDays === "1") {
      // Candlestick data only works for 1D
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${selectedCoin}/ohlc?vs_currency=${vsCurrency}&days=1`
      );
      chartData = await res.json();
    } else {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${selectedCoin}/market_chart?vs_currency=${vsCurrency}&days=${selectedDays}`
      );
      const json = await res.json();
      chartData = json.prices;
    }

    updateChart(chartData);
  } catch (err) {
    console.error("Fout bij laden:", err);
    dashboard.innerHTML = "Gegevens konden niet worden geladen.";
  }
}

fetchAll();
setInterval(fetchAll, 60000);
