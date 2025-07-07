
async function buscarDetalhesDoAlimento(fdcId) {
    const modal = document.getElementById('modal-selecao');
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${usdaApiKey}`;
    try {
        const res = await fetch(url);
        const alimento = await res.json();
        console.log("🔍 Alimento recebido:", alimento);

        const nutrientes = alimento.foodNutrients || [];
        console.log("📊 Nutrientes:", nutrientes.map(n => ({
            id: n.nutrientId, name: n.nutrientName, value: n.value
        })));

        const c = nutrientes.find(n => n.nutrientId === 1005)?.value;
        const p = nutrientes.find(n => n.nutrientId === 1003)?.value;
        const g = nutrientes.find(n => n.nutrientId === 1004)?.value;

        if (c == null && p == null && g == null) {
            alert('O alimento foi encontrado, mas os dados de macronutrientes não estão disponíveis.');
        }

        document.getElementById('nome').value = alimento.description;
        document.getElementById('carboidratos').value = (c ?? 0).toFixed(1);
        document.getElementById('proteinas').value = (p ?? 0).toFixed(1);
        document.getElementById('gorduras').value = (g ?? 0).toFixed(1);

        modal.classList.add('hidden');
        alert(`Dados de '${alimento.description}' carregados!`);
    } catch (e) {
        console.error('❌ Erro ao buscar detalhes do alimento:', e);
        alert('Erro ao obter dados detalhados.');
    }
}
