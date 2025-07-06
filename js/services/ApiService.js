class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async _request(endpoint = "", options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      return response.status === 204 ? null : response.json();
    } catch (error) {
      console.error("API Service Error:", error);
      alert(`Erro na comunicação com o servidor: ${error.message}`);
      throw error;
    }
  }

  getState() {
    return this._request("/estado");
  }

  addAlimento(data) {
    return this._request("/alimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  deleteAlimento(id) {
    return this._request(`/alimentos/${id}`, { method: "DELETE" });
  }

  definirMeta(data) {
    return this._request("/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
}
