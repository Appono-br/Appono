export function calcularTempoPreparoItens(itens = []) {
    return itens.reduce((total, item) => {
        const quantidade = Number(item.quantidade ?? 0);
        const tempoProduto = Number(item.tempo_preparo_minutos ?? item.produtos?.tempo_preparo_minutos ?? 30);
        if (!Number.isFinite(quantidade) || quantidade <= 0 || !Number.isFinite(tempoProduto) || tempoProduto <= 0) {
            return total;
        }
        return total + tempoProduto * quantidade;
    }, 0);
}
