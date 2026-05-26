const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9Ek2CW5jhGg0rW-0eoqML_KyRUkuhuhmb2cKUsZ9fFMSY8YIEpXTxiILBNb1F_UkrzA/exec";

async function get(action, params={}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res   = await fetch(`${APPS_SCRIPT_URL}?${query}`);
  const data  = await res.json();
  if (!data.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

async function post(payload) {
  const res  = await fetch(APPS_SCRIPT_URL, { method:"POST", body:JSON.stringify(payload) });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

export const api = {
  // ── Datos ──
  getProductos:         ()     => get("getProductos"),
  getDeudores:          ()     => get("getDeudores"),
  getEncargos:          ()     => get("getEncargos"),
  getPedidosPendientes: ()     => get("getPedidosPendientes"),
  getHistorialPagos:    ()     => get("getHistorialPagos"),
  buscarCliente:        (q)    => get("buscarCliente", { q }),
  getVentasDirectas:    ()     => get("getVentasDirectas"),
  getStock:             ()     => get("getStock"),
  getHistorialCambios:  ()     => get("getHistorialCambios"),
  getDeudasCliente:     (n)    => get("getDeudasCliente", { nombre: n }),

  // ── Acciones ──
  getDashboard:         ()     => post({ action:"getDashboard" }),
  registrarVenta:       (d)    => post({ action:"registrarVenta",       ...d }),
  registrarPago:        (d)    => post({ action:"registrarPago",        ...d }),
  editarPago:           (d)    => post({ action:"editarPago",           ...d }),
  eliminarPago:         (d)    => post({ action:"eliminarPago",         ...d }),
  marcarListo:          (d)    => post({ action:"marcarListo",          ...d }),
  marcarEntregado:      (d)    => post({ action:"marcarEntregado",      ...d }),
  enviarTicket:         (d)    => post({ action:"enviarTicket",         ...d }),
  recalcularDeudas:     ()     => post({ action:"recalcularDeudas" }),
  agregarProducto:      (d)    => post({ action:"agregarProductoNuevo", ...d }),
  editarProducto:       (d)    => post({ action:"editarProducto",       ...d }),
  eliminarProducto:     (d)    => post({ action:"eliminarProducto",     ...d }),
  marcarEncargo:        (d)    => post({ action:"marcarEncargo",        ...d }),
  eliminarItemPedido:   (d)    => post({ action:"eliminarItemPedido",   ...d }),
  entregarParcial:      (d)    => post({ action:"entregarParcial",      ...d }),
  cambiarEstadoItem:    (d)    => post({ action:"cambiarEstadoItem",    ...d }),
  // Stock
  ajustarStock:         (d)    => post({ action:"ajustarStock",         ...d }),
  // Historial/Edición
  editarVenta:          (d)    => post({ action:"editarVenta",          ...d }),
  eliminarVenta:        (d)    => post({ action:"eliminarVenta",        ...d }),
  editarPedido:         (d)    => post({ action:"editarPedido",         ...d }),
  eliminarPedido:       (d)    => post({ action:"eliminarPedido",       ...d }),
};
