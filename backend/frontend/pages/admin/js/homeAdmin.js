import { headerMenu } from "./header.js";
import "../../js/app.js";
import "./app.js";

window.addEventListener("DOMContentLoaded", async () => {
  headerMenu();

  // Llamada al backend
  const res = await fetch("/api/admin/estadisticas/entregas-finalizadas");
  const data = await res.json();

  const { solicitudesCompletas = 0, donacionesCompletas = 0 } =
    data.data || {};

  const ctxDona = document.getElementById("graficaDona");
  const ctxBarra = document.getElementById("graficaBarra");
  const ctxLinea = document.getElementById("graficaLinea");
  const ctxRadar = document.getElementById("graficaRadar");

  // Configuración base
  Chart.defaults.font.family = "Poppins, sans-serif";
  Chart.defaults.color = "#333";

  // Gráfica DONA (Entregas completadas)
  new Chart(ctxDona, {
    type: "doughnut",
    data: {
      labels: ["Solicitudes", "Donaciones"],
      datasets: [
        {
          data: [solicitudesCompletas, donacionesCompletas],
          backgroundColor: ["#80ed99", "#ffb703"],
          borderColor: "#fff",
          hoverOffset: 15,
        },
      ],
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: { enabled: true },
      },
      animation: { animateScale: true },
    },
  });

  // Gráfica BARRA (Tipos de donaciones)
  const donacionTipos = ["Alimentos", "Ropa", "Higiene", "Medicinas"];
  const cantidades = [12, 5, 8, 3];
  new Chart(ctxBarra, {
    type: "bar",
    data: {
      labels: donacionTipos,
      datasets: [
        {
          label: "Donaciones registradas",
          data: cantidades,
          backgroundColor: [
            "#8ac926",
            "#ffca3a",
            "#ff595e",
            "#1982c4",
          ],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 2 } },
      },
      plugins: { legend: { display: false } },
    },
  });

  // Gráfica LÍNEA (Actividad semanal)
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const nuevasSolicitudes = [2, 3, 4, 5, 3, 6, 7];
  const nuevasDonaciones = [1, 2, 3, 2, 4, 3, 5];
  new Chart(ctxLinea, {
    type: "line",
    data: {
      labels: dias,
      datasets: [
        {
          label: "Solicitudes",
          data: nuevasSolicitudes,
          borderColor: "#80ed99",
          fill: true,
          backgroundColor: "rgba(128, 237, 153, 0.3)",
          tension: 0.3,
          pointRadius: 5,
        },
        {
          label: "Donaciones",
          data: nuevasDonaciones,
          borderColor: "#ffb703",
          fill: true,
          backgroundColor: "rgba(255, 183, 3, 0.3)",
          tension: 0.3,
          pointRadius: 5,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  // Gráfica RADAR (Impacto ambiental simulado)
  const ejes = [
    "Kg de comida salvada",
    "Voluntarios activos",
    "Km recorridos",
    "Centros participantes",
    "Beneficiarios apoyados",
  ];
  const valores = [80, 65, 70, 50, 90];
  new Chart(ctxRadar, {
    type: "radar",
    data: {
      labels: ejes,
      datasets: [
        {
          label: "Impacto global",
          data: valores,
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderColor: "#1b4332",
          borderWidth: 2,
          pointBackgroundColor: "#80ed99",
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { r: { beginAtZero: true, grid: { color: "#ddd" } } },
    },
  });
});
