const dashboard = document.getElementById("dashboard");
const chartCtx = document.getElementById("priceChart").getContext("2d");
const coinFilter = document.getElementById("coinFilter");
const toggleTheme = document.getElementById("toggleTheme");
const timeButtons = document.querySelectorAll(".time-filters button");
const chartTypeSelect = document.getElementById("chartType");

let selectedCoin = coinFilter.value;
let selectedDays = "7";
let selectedChartType = chartTypeSelect.value;
const vsCurrency = "eur";

// 🌗 Donkere modus
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleTheme.textContent = document.body.classList.contains("dark")
    ? "Dark Mode"
    : "Light Mode";
});

// 🔁 Event Listeners
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
chartTypeSelect.addEventListener("change", () => {
  selectedChartType = chartTypeSelect.value;
  fetchAll();
});

// 💶 Prijs tonen
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

// 📊 Grafiek tekenen
function updateChart(data) {
  const existingChart = Chart.getChart("priceChart");
  if (existingChart) existingChart.destroy();

  let accent = "";
  let accentBg = "";
  const firstValue = data[0][1];
  const lastValue = data[data.length - 1][1];
  const isRising = lastValue > firstValue;

  if (isRising) {
    accent = "#2ecc71"; // groen
    accentBg = "rgba(46, 204, 113, 0.2)";
  } else {
    accent = "#e74c3c"; // rood
    accentBg = "rgba(231, 76, 60, 0.2)";
  }

  if (selectedChartType === "candlestick") {
    const candlestickData = data.map(([t, o, h, l, c]) => ({
      x: new Date(t),
      o, h, l, c
    }));

    new Chart(chartCtx, {
      type: "candlestick",
      data: {
        datasets: [{
          label: "Candlestick",
          data: candlestickData,
          borderColor: "rgba(0,0,0,0.6)",
          color: {
            up: "#26a69a",
            down: "#ef5350",
            unchanged: "#999",
          },
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            type: "time",
            time: { tooltipFormat: "dd MMM yyyy HH:mm" },
            ticks: {
              source: 'auto',
              maxRotation: 0,
              autoSkip: true
            }
          },
          y: {
            grid: { display: false },
            position: 'right',
            beginAtZero: false
          }
        },
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.body).getPropertyValue("--text").trim()
            }
          }
        }
      }
    });
  } else {
    const labels = data.map(p => new Date(p[0]).toLocaleDateString("nl-NL"));
    const values = data.map(p => p[1]);
    new Chart(chartCtx, {
      type: selectedChartType,
      data: {
        labels,
        datasets: [{
          label: `Prijs van ${selectedCoin.toUpperCase()} (EUR)`,
          data: values,
          borderColor: accent,
          backgroundColor: accentBg,
          fill: true,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            position: 'right',
            beginAtZero: false,
            grid: { display: false }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}

// 📡 API data ophalen
async function fetchAll() {
  try {
    const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=${vsCurrency}`);
    if (!priceRes.ok) throw new Error("Rate limit van CoinGecko bereikt");
    const priceData = await priceRes.json();
    showCurrentPrice(priceData);

    let chartData;

    if (selectedChartType === "candlestick") {
      const allowedDays = ["1", "7", "14", "30", "90", "180"];
      const ohlcDays = allowedDays.includes(selectedDays) ? selectedDays : "7";
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin}/ohlc?vs_currency=${vsCurrency}&days=${ohlcDays}`);
      if (!res.ok) throw new Error("Geen candlestick data beschikbaar");
      chartData = await res.json();
    } else {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin}/market_chart?vs_currency=${vsCurrency}&days=${selectedDays}`);
      if (!res.ok) throw new Error("Chart data kon niet worden geladen");
      const json = await res.json();
      chartData = json.prices;
    }

    updateChart(chartData);
  } catch (err) {
    console.error("Fout bij laden:", err);
    dashboard.innerHTML = `<div class="coin">Gegevens konden niet worden geladen.</div>`;
  }
}

fetchAll(); // eerste load

// 🧠 ML-predictie grafiek laden
function loadForecastChart() {
  fetch('data/predicted_btc.csv')
    .then(response => response.text())
    .then(data => {
      const rows = data.trim().split('\n').slice(1);
      const labels = [], actual = [], predicted = [];

      rows.forEach(row => {
        const [date, price, pred] = row.split(',');
        labels.push(date);
        actual.push(parseFloat(price));
        predicted.push(parseFloat(pred));
      });

      const ctx = document.getElementById('forecastChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Werkelijke Prijs',
              data: actual,
              borderColor: '#2d6cdf',
              tension: 0.3,
              fill: false
            },
            {
              label: 'Voorspelde Prijs',
              data: predicted,
              borderColor: '#ff5e57',
              borderDash: [6, 6],
              tension: 0.3,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Bitcoin Prijsvoorspelling (Machine Learning)'
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: { display: false }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    });
}

// Laad ML-voorspelling na DOM is geladen
document.addEventListener("DOMContentLoaded", () => {
  loadForecastChart();

  const header = document.querySelector('.header');
  const observerSections = document.querySelectorAll('.observer-section');

  const headerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const color = entry.target.dataset.headerColor;
          if (color) {
            header.style.backgroundColor = color;
          }
        }
      });
    },
    {
      root: null,
      threshold: 0.1,
      rootMargin: '-60px 0px 0px 0px',
    }
  );

  observerSections.forEach((section) => {
    headerObserver.observe(section);
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY === 0) {
      header.style.backgroundColor = 'var(--bg-header-light)';
    }
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
});
