export function calcularTempoPreparoItens(itens = []) {
    return itens.reduce((total, item) => {
        const quantidade = Number(item.quantidade ?? 0);
        const tempoProduto = Number(item.tempo_preparo_minutos ?? item.produtos?.tempo_preparo_minutos ?? 30);

        if (
            !Number.isFinite(quantidade) ||
            quantidade <= 0 ||
            !Number.isFinite(tempoProduto) ||
            tempoProduto <= 0
        ) {
            return total;
        }

        return total + tempoProduto * quantidade;
    }, 0);
}

export function obterTimestampPreparo(valor) {
    if (!valor) {
        return null;
    }

    const normalizado = String(valor).replace(" ", "T");
    const temTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalizado);
    const data = new Date(temTimezone ? normalizado : `${normalizado}-03:00`);
    return Number.isNaN(data.getTime()) ? null : data.getTime();
}

export function preparoEstaLiberado(valor) {
    const timestamp = obterTimestampPreparo(valor);
    return !timestamp || Date.now() >= timestamp;
}

export function formatarHorarioPreparo(valor) {
    if (!valor) {
        return "--:--";
    }

    return String(valor).slice(11, 16);
}
