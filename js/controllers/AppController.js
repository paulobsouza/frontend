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

    console.log('Iniciando busca pelo termo:', termoBusca);

    if (this.usdaApiKey === 'lua753nIouKqYip8J8EDfxKM03vGOhQF9eDAqPts') {
        alert('ERRO: Por favor, insira sua chave de API do USDA no arquivo AppController.js');
        return;
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(termoBusca)}&dataType=Foundation,SR%20Legacy&pageSize=1&api_key=${this.usdaApiKey}`;
    
    console.log('Buscando na URL:', url);

    try {
        this.btnBuscar.textContent = 'Buscando...';
        const response = await fetch(url);
        
        console.log('Resposta da API (bruta):', response);

        if (!response.ok) {
            console.error('A resposta da rede não foi OK. Status:', response.status);
            throw new Error(`Erro da API: ${response.statusText} (Status: ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos (JSON):', data);

        if (data.foods && data.foods.length > 0) {
            const alimentoEncontrado = data.foods[0];
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
            alert('Nenhum alimento encontrado com esse nome. Tente usar termos em inglês.');
        }

    } catch (error) {
        console.error('ERRO DETALHADO:', error);
        alert('Ocorreu um erro ao buscar os dados. Verifique o console para mais detalhes.');
    } finally {
         this.btnBuscar.textContent = 'Buscar';
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
        if (alimentos.length === 0) {
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
