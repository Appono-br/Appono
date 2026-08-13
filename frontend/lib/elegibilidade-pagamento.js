export function reservaAceitaPagamento(reserva, agora = new Date()) {
    if (!reserva) return false;
    const status = reserva.status_reserva ?? reserva.status;
    const data = reserva.data_reserva ?? reserva.date;
    const horario = reserva.horario_inicio ?? reserva.time;
    if (status !== "CONFIRMADA" || !data || !horario) return false;
    const limite = new Date(`${data}T${String(horario).slice(0, 8)}`);
    return !Number.isNaN(limite.getTime()) && agora.getTime() < limite.getTime();
}
