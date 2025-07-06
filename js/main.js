document.addEventListener("DOMContentLoaded", () => {
  const api = new ApiService("https://sua-calculadora-api.onrender.com/api");

  const app = new AppController(api);
  app.init();
});
