class AppController {
    constructor() {
        this.alimentos = [];
        this.metaDiaria = null;

        this.formAlimento = document.getElementById('form-alimento');
        this.formGasto = document.getElementById('form-gasto-calorico');
        this.listaAlimentosUI = document.getElementById('lista-alimentos');
        this.resultadoGastoUI = document.getElementById('resultado-gasto-calorico');
        this.resumoDiarioUI = document.getElementById('resumo-diario');
    }

    init() {
        this.formAlimento.addEventListener('submit', this.handleAdicionarAlimento.bind(this));
        this.formGasto.addEventListener('submit', this.handleDefinirMeta.bind(this));
        this.listaAlimentosUI.addEventListener('click', this.handleDeletarAlimento.bind(this));
        this.carregarDadosDoLocalStorage();
    }

    salvarDadosNoLocalStorage() {
        localStorage.setItem('alimentos', JSON.stringify(this.alimentos));
        localStorage.setItem('metaDiaria', JSON.stringify(this.metaDiaria));
    }

    carregarDadosDoLocalStorage() {
        const alimentosSalvos = JSON.parse(localStorage.getItem('alimentos'));
        if (alimentosSalvos) {
            this.alimentos = alimentosSalvos.map(a => new Alimento(a.id, a.nome, a.carboidratos, a.proteinas, a.gorduras, a.calorias));
        }

        const metaSalva = JSON.parse(localStorage.getItem('metaDiaria'));
        if (metaSalva) {
            this.metaDiaria = metaSalva;
        }
        this.renderizarTudo();
    }
    
    _calcularCalorias(carboidratos, proteinas, gorduras) {
        return (carboidratos * 4) + (proteinas * 4) + (gorduras * 9);
    }

    _calcularGastoDiario(peso, objetivo) {
        let macros = { carboidratos: 0, proteinas: 0, gorduras: 0 };
        const nomeObjetivo = objetivo === 'ganho-massa' ? 'Ganho de Massa' : 'Perda de Peso';

        if (objetivo === 'ganho-massa') {
            macros.carboidratos = 4 * peso;
            macros.proteinas = 2 * peso;
            macros.gorduras = 1 * peso;
        } else if (objetivo === 'perda-peso') {
            macros.carboidratos = 3.5 * peso;
            macros.proteinas = 2.5 * peso;
            macros.gorduras = 0.5 * peso;
        }
        
        const totalCalorias = this._calcularCalorias(macros.carboidratos, macros.proteinas, macros.gorduras);
        
        return { total: totalCalorias, objetivo: nomeObjetivo, macros };
    }

    handleAdicionarAlimento(e) {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const carboidratos = parseFloat(document.getElementById('carboidratos').value);
        const proteinas = parseFloat(document.getElementById('proteinas').value);
        const gorduras = parseFloat(document.getElementById('gorduras').value);

        if (!nome.trim() || isNaN(carboidratos) || isNaN(proteinas) || isNaN(gorduras)) {
            alert('Por favor, preencha todos os campos do alimento com valores válidos.');
            return;
        }

        const calorias = this._calcularCalorias(carboidratos, proteinas, gorduras);
        const id = new Date().getTime(); 
        const novoAlimento = new Alimento(id, nome, carboidratos, proteinas, gorduras, calorias);

        this.alimentos.push(novoAlimento);
        this.salvarDadosNoLocalStorage(); 
        this.renderizarTudo();
        this.formAlimento.reset();
    }

    handleDeletarAlimento(e) {
        if (e.target.classList.contains('btn-delete')) {
            const id = parseInt(e.target.dataset.id);
            this.alimentos = this.alimentos.filter(a => a.id !== id);
            this.salvarDadosNoLocalStorage(); 
            this.renderizarTudo();
        }
    }

    handleDefinirMeta(e) {
        e.preventDefault();
        const peso = parseFloat(document.getElementById('peso').value);
        const objetivo = document.getElementById('objetivo').value;
        
        if (isNaN(peso) || objetivo === '') {
            alert('Por favor, preencha peso e objetivo.');
            return;
        }
        
        this.metaDiaria = this._calcularGastoDiario(peso, objetivo);
        this.salvarDadosNoLocalStorage();
        this.renderizarTudo();
    }

    renderizarTudo() {
        this.renderizarListaAlimentos();
        this.renderizarResumoDiario();
    }

    renderizarListaAlimentos() {
        this.listaAlimentosUI.innerHTML = '';
        if (this.alimentos.length === 0) {
            this.listaAlimentosUI.innerHTML = '<li>Nenhum alimento cadastrado hoje.</li>';
            return;
        }
        this.alimentos.forEach(alimento => {
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
    
    renderizarResumoDiario() {
        if (!this.metaDiaria) {
            this.resultadoGastoUI.innerHTML = '';
            this.resumoDiarioUI.innerHTML = '<p>Calcule seu gasto diário para definir uma meta e acompanhar seu progresso.</p>';
            return;
        }

        const caloriasConsumidas = this.alimentos.reduce((total, alimento) => total + alimento.calorias, 0);
        const caloriasRestantes = this.metaDiaria.total - caloriasConsumidas;
        const classeCor = caloriasRestantes >= 0 ? 'positivo' : 'negativo';

        this.resultadoGastoUI.innerHTML = `
            <h4>Detalhamento de Macronutrientes:</h4>
            <p><strong>Carboidratos:</strong> ${this.metaDiaria.macros.carboidratos.toFixed(1)}g</p>
            <p><strong>Proteínas:</strong> ${this.metaDiaria.macros.proteinas.toFixed(1)}g</p>
            <p><strong>Gorduras:</strong> ${this.metaDiaria.macros.gorduras.toFixed(1)}g</p>
        `;

        this.resumoDiarioUI.innerHTML = `
            <h4>Resumo Diário (${this.metaDiaria.objetivo})</h4>
            <div class="resumo-item">
                <p>Meta de Calorias:</p>
                <span>${this.metaDiaria.total.toFixed(1)} kcal</span>
            </div>
            <div class="resumo-item">
                <p>Calorias Consumidas:</p>
                <span>${caloriasConsumidas.toFixed(1)} kcal</span>
            </div>
            <div class="resumo-item">
                <p>Calorias Restantes:</p>
                <span class="${classeCor}">${caloriasRestantes.toFixed(1)} kcal</span>
            </div>
        `;
    }
}
