document.addEventListener('DOMContentLoaded', () => {
    const api = new ApiService('https://backend-yr71.onrender.com/api');
    
    const app = new AppController(api);

    app.init();
});
