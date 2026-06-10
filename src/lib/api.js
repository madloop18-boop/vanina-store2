const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9Ek2CW5jhGg0rW-0eoqML_KyRUkuhuhmb2cKUsZ9fFMSY8YIEpXTxiILBNb1F_UkrzA/exec";

// Timeout por request. GAS a veces tarda; 30s da margen sin colgar la UI para siempre.
const TIMEOUT_MS = 30000;

// fetch con timeout via AbortController.
async function fetchConTimeout(url, opts = {}) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("El servidor tardó demasiado en responder. Reintentá en un momento.");
    }
    throw new Error("No se pudo conectar con el servidor. Revisá tu conexión.");
  } finally {
    clearTimeout(timer);
  }
}

// Parseo seguro: si GAS devuelve HTML (login, 302, error 500) el .json() explota.
// Acá lo capturamos y damos un mensaje claro en vez de un "Unexpected token <".
async function parsearRespuesta(res) {
  const texto = await res.text();
  let data;
  try {
    data = JSON.parse(texto);
  } catch {
    if (texto.includes("<html") || texto.includes("Moved Temporarily") || texto.includes("accounts.google")) {
      throw new Error("El backend redirigió a una página de Google. Reviá el deploy del Apps Script (debe ser 'Cualquiera').");
    }
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
  if (!res.ok) throw new Error(data.error || `Error del servidor (${res.status})`);
  if (!data.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

async function get(action, params = {}, { reintentos = 1 } = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  let ultimoError;
  for (let i = 0; i <= reintentos; i++) {
    try {
      const res = await fetchConTimeout(`${APPS_SCRIPT_URL}?${query}`);
      return await parsearRespuesta(res);
    } catch (e) {
      ultimoError = e;
      // Solo reintentamos errores de red/timeout, no errores de negocio.
      const esRed = /conectar|tardó/.test(e.message);
      if (!esRed || i === reintentos) break;
      await new Promise(r => setTimeout(r, 600));
    }
  }
  throw ultimoError;
}

async function post(payload) {
  const res = await fetchConTimeout(APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return await parsearRespuesta(res);
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