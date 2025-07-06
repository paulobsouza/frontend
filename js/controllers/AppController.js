class AppController {
  constructor(apiService) {
    this.apiService = apiService;
    this.formAlimento = document.getElementById('form-alimento');
    this.formGasto = document.getElementById('form-gasto-calorico');
    this.listaAlimentosUI = document.getElementById('lista-alimentos');
    this.resultadoGastoUI = document.getElementById('resultado-gasto-calorico'); 
    this.resumoDiarioUI = document.getElementById('resumo-diario');         
}

  init() {
    this.formAlimento.addEventListener(
      "submit",
      this.handleAdicionarAlimento.bind(this)
    );
    this.formGasto.addEventListener(
      "submit",
      this.handleDefinirMeta.bind(this)
    );
    this.listaAlimentosUI.addEventListener(
      "click",
      this.handleDeletarAlimento.bind(this)
    );

    this.carregarEstadoDoServidor();
  }

  async carregarEstadoDoServidor() {
    try {
      const estado = await this.apiService.getState();
      this.renderizarTudo(estado);
    } catch (error) {
      console.error("Falha ao carregar estado do servidor.", error);
    }
  }

  async handleAdicionarAlimento(e) {
    console.log('Botão Adicionar Alimento foi clicado!');
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const carboidratos = document.getElementById("carboidratos").value;
    const proteinas = document.getElementById("proteinas").value;
    const gorduras = document.getElementById("gorduras").value;

    try {
      const novoEstado = await this.apiService.addAlimento({
        nome,
        carboidratos,
        proteinas,
        gorduras,
      });
      this.renderizarTudo(novoEstado);
      this.formAlimento.reset();
    } catch (error) {
      console.error("Falha ao adicionar alimento.", error);
    }
  }

  async handleDeletarAlimento(e) {
    if (e.target.classList.contains("btn-delete")) {
      const id = parseInt(e.target.dataset.id);
      try {
        const novoEstado = await this.apiService.deleteAlimento(id);
        this.renderizarTudo(novoEstado);
      } catch (error) {
        console.error(`Falha ao deletar alimento ${id}.`, error);
      }
    }
  }

  async handleDefinirMeta(e) {
    e.preventDefault();
    const peso = document.getElementById("peso").value;
    const objetivo = document.getElementById("objetivo").value;

    try {
      const novoEstado = await this.apiService.definirMeta({ peso, objetivo });
      this.renderizarTudo(novoEstado);
    } catch (error) {
      console.error("Falha ao definir meta.", error);
    }
  }

  renderizarTudo(estado) {
    this.renderizarListaAlimentos(estado.alimentos);
    if (estado.metaDiaria) {
      this.renderizarResultadoGastoInicial(estado.metaDiaria);
      this.renderizarResumoDiario(estado.metaDiaria, estado.resumo);
    } else {
      this.resultadoGastoUI.innerHTML = "";
      this.resumoDiarioUI.innerHTML =
        "<p>Calcule seu gasto diário para definir uma meta e acompanhar seu progresso.</p>";
    }
  }

  renderizarListaAlimentos(alimentos = []) {
    this.listaAlimentosUI.innerHTML = "";
    if (alimentos.length === 0) {
      this.listaAlimentosUI.innerHTML =
        "<li>Nenhum alimento cadastrado hoje.</li>";
      return;
    }
    alimentos.forEach((alimento) => {
      const li = document.createElement("li");
      li.innerHTML = `...`; // Mesma lógica de antes
      this.listaAlimentosUI.appendChild(li);
    });
  }

  renderizarResultadoGastoInicial(metaDiaria) {
    this.resultadoGastoUI.innerHTML = `
            <h4>Detalhamento de Macronutrientes:</h4>
            <p><strong>Carboidratos:</strong> ${metaDiaria.macros.carboidratos.toFixed(
              1
            )}g</p>
            <p><strong>Proteínas:</strong> ${metaDiaria.macros.proteinas.toFixed(
              1
            )}g</p>
            <p><strong>Gorduras:</strong> ${metaDiaria.macros.gorduras.toFixed(
              1
            )}g</p>
        `;
  }

  renderizarResumoDiario(metaDiaria, resumo) {
    const classeCor = resumo.restantes >= 0 ? "positivo" : "negativo";
    this.resumoDiarioUI.innerHTML = `
            <h4>Resumo Diário (${metaDiaria.objetivo})</h4>
            <div class="resumo-item"> ... </div>
        `;
  }
}
