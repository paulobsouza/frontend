document.addEventListener("DOMContentLoaded", () => {
  const api = new ApiService("https://backend-yr71.onrender.com/");

  const app = new AppController(api);
  app.init();
});
