class AppController {
    constructor(apiService) {
        this.apiService = apiService; 

        this.usdaApiKey = 'lua753nIouKqYip8J8EDfxKM03vGOhQF9eDAqPts'; 

        this.formAlimento = document.getElementById('form-alimento');
        this.formGasto = document.getElementById('form-gasto-calorico');
        this.listaAlimentosUI = document.getElementById('lista-alimentos');
        this.resultadoGastoUI = document.getElementById('resultado-gasto-calorico');
        this.resumoDiarioUI = document.getElementById('resumo-diario');
        
        this.btnBuscar = document.getElementById('btn-busca'); 
        this.inputBusca = document.getElementById('busca-alimento');
    }

    init() {
        this.formAlimento.addEventListener('submit', this.handleAdicionarAlimento.bind(this));
        this.formGasto.addEventListener('submit', this.handleDefinirMeta.bind(this));
        this.listaAlimentosUI.addEventListener('click', this.handleDeletarAlimento.bind(this));
        this.btnBuscar.addEventListener('click', this.handleBuscarAlimento.bind(this));

        this.carregarEstadoDoServidor();
    }

    async handleBuscarAlimento() {
        const termoBusca = this.inputBusca.value.trim();
        if (!termoBusca) {
            alert('Por favor, digite um alimento para buscar.');
            return;
        }
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(termoBusca)}&dataType=Foundation,SR%20Legacy&pageSize=1&api_key=${this.usdaApiKey}`;
        try {
            this.btnBuscar.textContent = 'Buscando...';
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro da API do USDA: ${response.statusText}`);
            const data = await response.json();
            if (data.foods && data.foods.length > 0) {
                const alimentoEncontrado = data.foods[0];
                if (alimentoEncontrado && Array.isArray(alimentoEncontrado.foodNutrients)) {
                    const nutrientes = alimentoEncontrado.foodNutrients;
                    const proteinas = nutrientes.find(n => n.nutrientId === 1003)?.value || 0;
                    const gorduras = nutrientes.find(n => n.nutrientId === 1004)?.value || 0;
                    const carboidratos = nutrientes.find(n => n.nutrientId === 1005)?.value || 0;
                    document.getElementById('nome').value = alimentoEncontrado.description;
                    document.getElementById('carboidratos').value = carboidratos.toFixed(1);
                    document.getElementById('proteinas').value = proteinas.toFixed(1);
                    document.getElementById('gorduras').value = gorduras.toFixed(1);
                    alert(`Dados de '${alimentoEncontrado.description}' carregados!`);
                } else {
                    alert(`O alimento '${alimentoEncontrado.description}' foi encontrado, mas não contém dados detalhados de macronutrientes.`);
                    document.getElementById('nome').value = alimentoEncontrado.description;
                }
            } else {
                alert('Nenhum alimento encontrado. Tente usar termos em inglês.');
            }
        } catch (error) {
            console.error('ERRO DETALHADO AO BUSCAR ALIMENTO:', error);
            alert('Ocorreu um erro ao buscar os dados. Verifique o console.');
        } finally {
             this.btnBuscar.textContent = 'Buscar';
        }
    }
    
    async carregarEstadoDoServidor() {
        try {
            const estado = await this.apiService.getState();
            this.renderizarTudo(estado);
        } catch (error) {
            console.error('Falha ao carregar estado inicial do servidor.', error);
        }
    }

    async handleAdicionarAlimento(e) {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const carboidratos = document.getElementById('carboidratos').value;
        const proteinas = document.getElementById('proteinas').value;
        const gorduras = document.getElementById('gorduras').value;
        try {
            const novoEstado = await this.apiService.addAlimento({ nome, carboidratos, proteinas, gorduras });
            this.renderizarTudo(novoEstado);
            this.formAlimento.reset();
        } catch (error) {
            console.error('Falha ao adicionar alimento.', error);
        }
    }

    async handleDeletarAlimento(e) {
        if (e.target.classList.contains('btn-delete')) {
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
        const peso = document.getElementById('peso').value;
        const objetivo = document.getElementById('objetivo').value;
        try {
            const novoEstado = await this.apiService.definirMeta({ peso, objetivo });
            this.renderizarTudo(novoEstado);
        } catch (error) {
            console.error('Falha ao definir meta.', error);
        }
    }

    renderizarTudo(estado) {
        this.renderizarListaAlimentos(estado.alimentos);
        if (estado.metaDiaria) {
            this.renderizarResultadoGastoInicial(estado.metaDiaria);
            this.renderizarResumoDiario(estado.metaDiaria, estado.resumo);
        } else {
            this.resultadoGastoUI.innerHTML = '';
            this.resumoDiarioUI.innerHTML = '<p>Calcule seu gasto diário para definir uma meta e acompanhar seu progresso.</p>';
        }
    }

    renderizarListaAlimentos(alimentos = []) {
        this.listaAlimentosUI.innerHTML = '';
        if (!alimentos || alimentos.length === 0) {
            this.listaAlimentosUI.innerHTML = '<li>Nenhum alimento cadastrado hoje.</li>';
            return;
        }
        alimentos.forEach(alimento => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${alimento.nome}</strong> (${alimento.calorias.toFixed(1)} kcal)
                <button class="btn-delete" data-id="${alimento.id}">X</button>
                <br>
                <small>C: ${alimento.carboidratos}g, P: ${alimento.proteinas}g, G: ${alimento.gorduras}g</small>
            `;
            this.listaAlimentosUI.appendChild(li);
        });
    }

    renderizarResultadoGastoInicial(metaDiaria) {
        this.resultadoGastoUI.innerHTML = `
            <h4>Detalhamento de Macronutrientes:</h4>
            <p><strong>Carboidratos:</strong> ${metaDiaria.macros.carboidratos.toFixed(1)}g</p>
            <p><strong>Proteínas:</strong> ${metaDiaria.macros.proteinas.toFixed(1)}g</p>
            <p><strong>Gorduras:</strong> ${metaDiaria.macros.gorduras.toFixed(1)}g</p>
        `;
    }

    renderizarResumoDiario(metaDiaria, resumo) {
        const classeCor = resumo.restantes >= 0 ? 'positivo' : 'negativo';
        this.resumoDiarioUI.innerHTML = `
            <h4>Resumo Diário (${metaDiaria.objetivo})</h4>
            <div class="resumo-item">
                <p>Meta de Calorias:</p>
                <span>${metaDiaria.total.toFixed(1)} kcal</span>
            </div>
            <div class="resumo-item">
                <p>Calorias Consumidas:</p>
                <span>${resumo.consumidas.toFixed(1)} kcal</span>
            </div>
            <div class="resumo-item">
                <p>Calorias Restantes:</p>
                <span class="${classeCor}">${resumo.restantes.toFixed(1)} kcal</span>
            </div>
        `;
    }
}
