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
    const termoBusca = this.inputBusca.value.trim().toLowerCase();
    if (!termoBusca) {
        alert('Por favor, digite um alimento para buscar.');
        return;
    }

    const dataTypes = ['Foundation', 'SR Legacy'];
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(termoBusca)}&dataType=${encodeURIComponent(dataTypes.join(','))}&pageSize=10&api_key=${this.usdaApiKey}`;

    try {
        this.btnBuscar.textContent = 'Buscando...';

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro da API do USDA: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log('Resposta completa da API USDA:', data);

        if (data.foods && data.foods.length > 0) {
            const alimentoEncontrado = this.exibirModalSelecao(data.foods);
        } else {
            alert('Nenhum alimento encontrado. Tente usar termos em inglês ou mais específicos.');
        }
            const nutrientes = alimentoEncontrado.foodNutrients;

            if (Array.isArray(nutrientes) && nutrientes.length > 0) {
                const proteinas = nutrientes.find(n => n.nutrientId === 1003)?.value || 0;
                const gorduras = nutrientes.find(n => n.nutrientId === 1004)?.value || 0;
                const carboidratos = nutrientes.find(n => n.nutrientId === 1005)?.value || 0;

                document.getElementById('nome').value = alimentoEncontrado.description || '';
                document.getElementById('carboidratos').value = carboidratos.toFixed(1);
                document.getElementById('proteinas').value = proteinas.toFixed(1);
                document.getElementById('gorduras').value = gorduras.toFixed(1);

                alert(`Dados de '${alimentoEncontrado.description}' carregados!`);
            } else {
                alert(`O alimento '${alimentoEncontrado.description}' foi encontrado, mas não possui dados detalhados de nutrientes.`);
                document.getElementById('nome').value = alimentoEncontrado.description || '';
                document.getElementById('carboidratos').value = '';
                document.getElementById('proteinas').value = '';
                document.getElementById('gorduras').value = '';
            }
        } catch (error) {
            console.error('Erro detalhado ao buscar alimento na USDA:', error);
            alert(`Erro ao buscar alimento: ${error.message}`);
        } finally {
            this.btnBuscar.textContent = 'Buscar';
        }    
}

exibirModalSelecao(opcoes) {
    const modal = document.getElementById('modal-selecao');
    const lista = document.getElementById('lista-opcoes');
    const close = modal.querySelector('.close-modal');

    lista.innerHTML = '';

    opcoes.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <button data-index="${index}" style="margin: 4px 0; width: 100%;">
                ${item.description}
            </button>
        `;
        lista.appendChild(li);
    });

    lista.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = parseInt(e.target.dataset.index);
            const alimento = opcoes[idx];
            await this.preencherFormularioComAlimento(alimento);
            modal.style.display = 'none';
        });
    });

    close.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    };

    modal.style.display = 'block';
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

    async preencherFormularioComAlimento(alimento) {
        const response = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${alimento.fdcId}?api_key=${this.usdaApiKey}`);
        const detalhes = await response.json();
    
        const nutrientes = detalhes.foodNutrients;
    
        const proteinas = nutrientes.find(n => n.nutrientId === 1003)?.value || 0;
        const gorduras = nutrientes.find(n => n.nutrientId === 1004)?.value || 0;
        const carboidratos = nutrientes.find(n => n.nutrientId === 1005)?.value || 0;
    
        document.getElementById('nome').value = detalhes.description || '';
        document.getElementById('carboidratos').value = carboidratos.toFixed(1);
        document.getElementById('proteinas').value = proteinas.toFixed(1);
        document.getElementById('gorduras').value = gorduras.toFixed(1);
    
        alert(`Dados de '${detalhes.description}' carregados!`);
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
