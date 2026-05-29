import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

// ─── TICKET WHATSAPP ─────────────────────────────────────────────
function TicketModal({ deudor, onClose }) {
  if (!deudor) return null;

  const fecha = new Date().toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const textoWsp = () => {
    let t = `🌸 *Vanina Store*\n`;
    t += `📅 ${fecha} · ${hora}\n`;
    t += `━━━━━━━━━━━━━━━━━━\n`;
    t += `👤 *${deudor.nombre}*\n\n`;
    if (deudor.productos?.length > 0) {
      t += `📦 *Detalle pendiente:*\n`;
      deudor.productos.forEach(p => {
        const nombreMostrar = (p.nombre || "").toLowerCase().includes("personalizado") && p.observacion
          ? `${p.nombre} — ${p.observacion}`
          : p.nombre;
        t += `• ${nombreMostrar}${p.variable ? ` (${p.variable})` : ""} x${p.cantidad} — $${fmt(p.subtotal)}\n`;
      });
      t += `\n`;
    }
    t += `💰 *Total pendiente: $${fmt(deudor.saldo)}*\n`;
    t += `━━━━━━━━━━━━━━━━━━\n`;
    t += `¡Gracias! 🌸`;
    return t;
  };

  const copiar = () => navigator.clipboard.writeText(textoWsp());
  const abrirWsp = () => {
    const tel = String(deudor.tel || "").replace(/\D/g, "");
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(textoWsp())}`, "_blank");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(26,10,18,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 80px rgba(233,30,140,0.25)",
        overflow: "hidden", animation: "slideUp 0.25s ease",
      }}>
        <div style={{
          background: "linear-gradient(135deg,#E91E8C,#B5006E)",
          padding: "20px 24px 16px", color: "white",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Resumen de deuda</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginTop: 2 }}>
              {deudor.nombre}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: "white",
            borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            textAlign: "center", padding: "16px 0 20px",
            borderBottom: "1px dashed #F0D6E4", marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: "var(--muted-2)", marginBottom: 4 }}>Total pendiente</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: "var(--red)" }}>
              ${fmt(deudor.saldo)}
            </div>
          </div>
          {deudor.productos?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Detalle
              </div>
              <div style={{ background: "var(--surface-3)", borderRadius: 12, padding: "10px 14px" }}>
                {deudor.productos.map((p, i) => (
                  <div key={i} style={{
                    fontSize: 13, lineHeight: 1.7, color: "var(--text)",
                    borderBottom: i < deudor.productos.length - 1 ? "1px solid #F0D6E4" : "none",
                    paddingBottom: i < deudor.productos.length - 1 ? 8 : 0,
                    marginBottom: i < deudor.productos.length - 1 ? 8 : 0,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>• {p.nombre}{p.variable ? ` (${p.variable})` : ""} x{p.cantidad}</span>
                      <span style={{ fontWeight: 700 }}>${fmt(p.subtotal)}</span>
                    </div>
                    {p.observacion && (
                      <div style={{ fontSize: 11, color: "var(--muted-2)", marginLeft: 10 }}>📝 {p.observacion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{
            background: "#F0FBF7", border: "1px solid #A7E9D5", borderRadius: 12,
            padding: "12px 14px", fontSize: 12, color: "#1A5C45", fontFamily: "monospace",
            whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 160, overflowY: "auto", lineHeight: 1.6,
          }}>
            {textoWsp()}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={copiar} style={{
              flex: 1, padding: "12px 0", background: "var(--surface-2)",
              border: "1.5px solid #E91E8C", borderRadius: 12,
              fontWeight: 700, fontSize: 14, color: "var(--rose)",
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>📋 Copiar</button>
            {deudor.tel && (
              <button onClick={abrirWsp} style={{
                flex: 1, padding: "12px 0",
                background: "linear-gradient(135deg,#25D366,#128C7E)",
                border: "none", borderRadius: 12,
                fontWeight: 700, fontSize: 14, color: "white",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>💬 WhatsApp</button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── MODAL PAGO CONFIRMADO ────────────────────────────────────────
function PagoConfirmadoModal({ ticket, onClose }) {
  if (!ticket) return null;
  const fecha = new Date().toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(26,10,18,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(233,30,140,0.25)",
        overflow: "hidden", animation: "slideUp 0.25s ease",
      }}>
        <div style={{
          background: "linear-gradient(135deg,#E91E8C,#B5006E)",
          padding: "24px 24px 20px", textAlign: "center", color: "white",
        }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>Pago registrado</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{fecha} · {hora}</div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            padding: "14px 16px", background: "var(--surface-3)", borderRadius: 12,
            border: "1px solid #F0D6E4",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg,#E91E8C,#B5006E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "white", flexShrink: 0,
            }}>{ticket.nombre?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{ticket.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>Cliente</div>
            </div>
          </div>
          <div style={{ borderTop: "1px dashed #F0D6E4", borderBottom: "1px dashed #F0D6E4", padding: "14px 0", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, alignItems: "center" }}>
              <span style={{ color: "var(--muted-2)" }}>Pago recibido</span>
              <span style={{ fontWeight: 700, color: "var(--green)", fontSize: 22, fontFamily: "'Playfair Display',serif" }}>
                ${fmt(ticket.montoPagado)}
              </span>
            </div>
            {ticket.saldoNuevo > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, alignItems: "center" }}>
                <span style={{ color: "var(--muted-2)" }}>Saldo pendiente</span>
                <span style={{ fontWeight: 700, color: "var(--red)", fontSize: 18, fontFamily: "'Playfair Display',serif" }}>
                  ${fmt(ticket.saldoNuevo)}
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "6px 0", color: "var(--green)", fontWeight: 700, fontSize: 14 }}>
                ✅ Deuda saldada completamente
              </div>
            )}
          </div>
          {ticket.detalle?.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 14, background: "var(--surface-3)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--muted-2)" }}>IMPUTADO A:</div>
              {ticket.detalle.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>• {d.nombre}{d.observacion ? ` — ${d.observacion}` : ""}</span>
                  <span style={{ fontWeight: 700 }}>${fmt(d.monto)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: ticket.saldoNuevo > 0 ? "#FFF3E8" : "var(--green-bg)",
            border: `1px solid ${ticket.saldoNuevo > 0 ? "#FFD0A8" : "#A7E9D5"}`,
            fontSize: 13, fontWeight: 600,
            color: ticket.saldoNuevo > 0 ? "#7A3800" : "var(--green-dark)",
            textAlign: "center", marginBottom: 20,
          }}>
            {ticket.saldoNuevo > 0
              ? `⚠️ Queda pendiente: $${fmt(ticket.saldoNuevo)}`
              : "🎉 Cliente al día — sin deuda pendiente"}
          </div>
          <button onClick={onClose} style={{
            width: "100%", padding: "14px", border: "none",
            background: "linear-gradient(135deg,#E91E8C,#B5006E)",
            color: "white", borderRadius: 12, fontWeight: 700, fontSize: 15,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>✓ Listo</button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── MODAL EDITAR PAGO ────────────────────────────────────────────
function ModalEditarPago({ pago, onConfirm, onClose }) {
  const [monto, setMonto] = useState(String(pago?.monto || ""));
  useEffect(() => { setMonto(String(pago?.monto || "")); }, [pago]);
  if (!pago) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(26,10,18,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 360,
        boxShadow: "0 24px 80px rgba(233,30,140,0.2)",
        animation: "slideUp 0.25s ease", overflow: "hidden",
      }}>
        <div style={{ background: "linear-gradient(135deg,#E91E8C,#B5006E)", padding: "20px 24px", color: "white" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>✏️ Editar pago</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{pago.cliente} · {pago.fecha_str} {pago.hora_str}</div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: 8 }}>
            Nuevo monto
          </label>
          <input
            type="number" value={monto} onChange={e => setMonto(e.target.value)}
            autoFocus
            style={{
              width: "100%", padding: "13px 16px", border: "1.5px solid #F0D6E4",
              borderRadius: 12, fontSize: 18, fontFamily: "'DM Sans',sans-serif",
              outline: "none", marginBottom: 16, fontWeight: 700,
              background: "var(--surface-2)", color: "var(--text)",
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "13px", border: "1.5px solid #F0D6E4",
              background: "var(--surface-2)", borderRadius: 12, fontWeight: 700,
              fontSize: 14, cursor: "pointer", color: "var(--muted-2)", fontFamily: "'DM Sans',sans-serif",
            }}>Cancelar</button>
            <button onClick={() => onConfirm(parseFloat(monto) || 0)} style={{
              flex: 2, padding: "13px", border: "none",
              background: "linear-gradient(135deg,#E91E8C,#B5006E)",
              color: "white", borderRadius: 12, fontWeight: 700,
              fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>✓ Guardar</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── MODAL CONFIRMAR BORRADO ──────────────────────────────────────
function ModalConfirmarBorrar({ pago, onConfirm, onClose }) {
  if (!pago) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(26,10,18,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 360,
        boxShadow: "0 24px 80px rgba(198,40,40,0.2)",
        animation: "slideUp 0.25s ease", overflow: "hidden",
      }}>
        <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🗑️</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            ¿Borrar este pago?
          </div>
          <div style={{ fontSize: 14, color: "var(--muted-2)", marginBottom: 6 }}>
            {pago.cliente} · {pago.fecha_str} {pago.hora_str}
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>
            ${fmt(pago.monto)}
          </div>
          <div style={{
            background: "#FFF3E8", border: "1px solid #FFD0A8",
            borderRadius: 10, padding: "10px 14px", fontSize: 13,
            color: "#7A3800", marginBottom: 20,
          }}>
            ⚠️ Esto recalcula las deudas — el cliente volverá a deber este monto.
          </div>
        </div>
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "13px", border: "1.5px solid #F0D6E4",
            background: "var(--surface-2)", borderRadius: 12, fontWeight: 700,
            fontSize: 14, cursor: "pointer", color: "var(--muted-2)", fontFamily: "'DM Sans',sans-serif",
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 2, padding: "13px", border: "none",
            background: "var(--red)", color: "white", borderRadius: 12,
            fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>🗑️ Sí, borrar</button>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── HISTORIAL INLINE POR CLIENTE ────────────────────────────────
function HistorialCliente({ nombre, todosPagos, onEditar, onBorrar }) {
  const pagosCliente = todosPagos
    .filter(p => (p.cliente || "").toLowerCase() === (nombre || "").toLowerCase())
    .slice(0, 10); // últimos 10

  if (!pagosCliente.length) return (
    <div style={{ fontSize: 12, color: "var(--muted-2)", padding: "8px 0", textAlign: "center" }}>
      Sin pagos registrados aún
    </div>
  );

  return (
    <div style={{ marginTop: 4 }}>
      {pagosCliente.map((p, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 8,
          background: i % 2 === 0 ? "var(--surface-3)" : "transparent",
          marginBottom: 2,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>
              +${fmt(p.monto)}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-2)" }}>
              {p.fecha_str} {p.hora_str} · {p.concepto || "Pago"}{p.metodo ? ` · ${p.metodo}` : ""}
            </div>
          </div>
          <button onClick={() => onEditar(p)} style={{
            padding: "4px 9px", border: "1.5px solid #F0D6E4",
            background: "var(--surface-2)", borderRadius: 7, cursor: "pointer",
            fontSize: 12, color: "var(--rose)", fontWeight: 700,
            fontFamily: "'DM Sans',sans-serif",
          }}>✏️</button>
          <button onClick={() => onBorrar(p)} style={{
            padding: "4px 9px", border: "none",
            background: "var(--red-bg)", borderRadius: 7, cursor: "pointer",
            fontSize: 12, color: "var(--red)", fontWeight: 700,
            fontFamily: "'DM Sans',sans-serif",
          }}>🗑️</button>
        </div>
      ))}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function Pagos({ showToast }) {
  const [deudores, setDeudores]         = useState([]);
  const [todosPagos, setTodosPagos]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pagando, setPagando]           = useState({});
  const [ticket, setTicket]             = useState(null);
  const [ticketDeudor, setTicketDeudor] = useState(null);
  const [historialAbierto, setHistorialAbierto] = useState({});
  const [editandoPago, setEditandoPago] = useState(null);
  const [borrandoPago, setBorrandoPago] = useState(null);
  const [procesando, setProcesando]     = useState(false);

  const [montos, setMontos]         = useState({});
  const [metodos, setMetodos]       = useState({});
  const [modos, setModos]           = useState({});
  const [prodMontos, setProdMontos] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [resDeud, resPagos] = await Promise.all([
        api.getDeudores(),
        api.getHistorialPagos(),
      ]);
      setDeudores(resDeud.deudores || []);
      setTodosPagos(resPagos.pagos || []);
    } catch (e) {
      showToast("❌ Error al cargar: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { cargar(); }, [cargar]);

  const recalcular = async () => {
    try {
      const res = await api.recalcularDeudas();
      showToast(`✅ Deudas recalculadas. ${res.actualizados || 0} actualizados.`);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    }
  };

  const setModo = (id, modo) => {
    setModos(m => ({ ...m, [id]: modo }));
    setMontos(m => ({ ...m, [id]: "" }));
    setProdMontos(p => ({ ...p, [id]: {} }));
  };

  const setProdMonto = (deudorId, prodKey, val) => {
    setProdMontos(p => ({ ...p, [deudorId]: { ...(p[deudorId] || {}), [prodKey]: val } }));
  };

  const prodKey = (p) => `${p.id_pedido}|${p.id_producto || p.nombre}|${p.variable || ""}|${p.observacion || ""}`;

  const totalPorProductos = (id) =>
    Object.values(prodMontos[id] || {}).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

  const pagar = async (d) => {
    const modo   = modos[d.id] || "general";
    const metodo = metodos[d.id] || "Efectivo";
    let monto = 0;
    let imputaciones = [];

    if (modo === "general") {
      monto = parseFloat(montos[d.id] || 0);
      if (!monto || monto <= 0) { showToast("⚠️ Ingresá un monto válido"); return; }
      if (monto > d.saldo)      { showToast("⚠️ El monto supera el saldo"); return; }
      imputaciones = [{ concepto: "Pago general", monto }];
    } else {
      const sel = prodMontos[d.id] || {};
      imputaciones = d.productos
        .filter(p => parseFloat(sel[prodKey(p)] || 0) > 0)
        .map(p => ({
          id_pedido:   p.id_pedido,
          id_producto: p.id_producto || "",
          nombre:      p.nombre,
          variable:    p.variable || "",
          observacion: p.observacion || "",
          monto:       parseFloat(sel[prodKey(p)]),
        }));
      if (!imputaciones.length) { showToast("⚠️ Ingresá al menos un monto"); return; }
      monto = imputaciones.reduce((acc, i) => acc + i.monto, 0);
    }

    setPagando(p => ({ ...p, [d.id]: true }));
    try {
      const res = await api.registrarPago({ nombre: d.nombre, monto, metodo, imputaciones });
      setTicket({
        nombre:      d.nombre,
        montoPagado: monto,
        saldoNuevo:  res.saldo_nuevo ?? Math.max(0, d.saldo - monto),
        detalle:     modo === "producto" ? imputaciones : [],
      });
      setMontos(m    => ({ ...m,    [d.id]: "" }));
      setProdMontos(p => ({ ...p,   [d.id]: {} }));
      setModos(m     => ({ ...m,    [d.id]: "general" }));
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setPagando(p => ({ ...p, [d.id]: false }));
    }
  };

  // ── EDITAR PAGO ──────────────────────────────────────────────
  const confirmarEdicion = async (nuevoMonto) => {
    if (!nuevoMonto || nuevoMonto <= 0) { showToast("⚠️ Ingresá un monto válido"); return; }
    setProcesando(true);
    try {
      await api.editarPago({
        cliente:     editandoPago.cliente,
        fecha_str:   editandoPago.fecha_str,
        hora_str:    editandoPago.hora_str,
        monto_viejo: editandoPago.monto,
        monto_nuevo: nuevoMonto,
      });
      showToast("✅ Pago actualizado — deudas recalculadas");
      setEditandoPago(null);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setProcesando(false);
    }
  };

  // ── BORRAR PAGO ──────────────────────────────────────────────
  const confirmarBorrado = async () => {
    setProcesando(true);
    try {
      await api.eliminarPago({
        cliente:   borrandoPago.cliente,
        fecha_str: borrandoPago.fecha_str,
        hora_str:  borrandoPago.hora_str,
        monto:     borrandoPago.monto,
      });
      showToast("🗑️ Pago eliminado — deudas recalculadas");
      setBorrandoPago(null);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setProcesando(false);
    }
  };

  const toggleHistorial = (id) => {
    setHistorialAbierto(h => ({ ...h, [id]: !h[id] }));
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700, margin: "0 auto" }} className="tab-padding">

      {/* MODALES */}
      <PagoConfirmadoModal ticket={ticket} onClose={() => { setTicket(null); }} />
      <TicketModal deudor={ticketDeudor} onClose={() => setTicketDeudor(null)} />
      <ModalEditarPago
        pago={editandoPago}
        onConfirm={confirmarEdicion}
        onClose={() => setEditandoPago(null)}
      />
      <ModalConfirmarBorrar
        pago={borrandoPago}
        onConfirm={confirmarBorrado}
        onClose={() => setBorrandoPago(null)}
      />

      <button onClick={recalcular} style={{
        width: "100%", padding: "12px 20px", background: "var(--surface-2)",
        border: "1px solid #F0D6E4", borderRadius: 12, fontWeight: 700, fontSize: 14,
        color: "var(--rose)", cursor: "pointer", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "'DM Sans',sans-serif",
      }}>
        🔄 Recalcular deudas desde Pedidos
      </button>

      {loading ? (
        <div><style>{skeletonCSS}</style>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}</div>
      ) : deudores.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-2)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 16 }}>¡Sin deudores! Todo al día 🎉</p>
        </div>
      ) : deudores.map((d) => {
        const modo      = modos[d.id] || "general";
        const totalProd = totalPorProductos(d.id);
        const histAbierto = historialAbierto[d.id] || false;

        return (
          <div key={d.id} style={{
            background: "var(--surface-2)", borderRadius: 14, padding: 20, marginBottom: 12,
            border: "1px solid #F0D6E4", boxShadow: "0 1px 3px rgba(233,30,140,0.06)",
          }}>
            {/* Cabecera */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,#E91E8C,#B5006E)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "white", flexShrink: 0,
                }}>
                  {d.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{d.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{d.tel}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setTicketDeudor(d)} style={{
                  padding: "6px 10px", background: "#F0FBF7",
                  border: "1px solid #A7E9D5", borderRadius: 8,
                  fontSize: 12, fontWeight: 700, color: "var(--green)",
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>📋 Ticket</button>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 22, color: "var(--red)", fontFamily: "'Playfair Display',serif" }}>
                    ${fmt(d.saldo)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-2)" }}>debe</div>
                </div>
              </div>
            </div>

            {/* Lista de productos pendientes */}
            {d.productos?.length > 0 && (
              <div style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.8, color: "var(--text-2)", background: "var(--surface-3)", borderRadius: 10, padding: "10px 14px" }}>
                {d.productos.map((p, i) => (
                  <div key={i}>
                    • {p.nombre}{p.variable ? ` (${p.variable})` : ""} x{p.cantidad} — ${fmt(p.subtotal)}
                    {p.observacion && (
                      <div style={{ fontSize: 11, color: "var(--muted-2)", marginLeft: 12 }}>📝 {p.observacion}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selector modo pago */}
            {d.productos?.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["general", "producto"].map(m => (
                  <button key={m} onClick={() => setModo(d.id, m)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                    border: modo === m ? "2px solid #E91E8C" : "1px solid #F0D6E4",
                    background: modo === m ? "#FFF0F7" : "var(--surface-2)",
                    color: modo === m ? "var(--rose)" : "var(--muted-2)",
                  }}>
                    {m === "general" ? "💰 Pago general" : "📦 Por producto"}
                  </button>
                ))}
              </div>
            )}

            {/* MODO GENERAL */}
            {modo === "general" && (
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={metodos[d.id] || "Efectivo"}
                  onChange={e => setMetodos(m => ({ ...m, [d.id]: e.target.value }))}
                  style={{
                    padding: "11px 10px", border: "1px solid #F0D6E4", borderRadius: 10,
                    fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif",
                    background: "var(--surface-2)", color: "var(--text)",
                  }}
                >
                  {["Efectivo","Transferencia","Mercado Pago","Débito","Crédito"].map(op => (
                    <option key={op}>{op}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Monto a pagar"
                  value={montos[d.id] || ""}
                  onChange={e => setMontos(m => ({ ...m, [d.id]: e.target.value }))}
                  style={{ flex: 1, padding: "11px 16px", border: "1px solid #F0D6E4", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", background: "var(--surface-2)", color: "var(--text)" }}
                  min="1" max={d.saldo}
                />
                <button
                  onClick={() => pagar(d)}
                  disabled={pagando[d.id]}
                  style={{
                    padding: "11px 20px",
                    background: pagando[d.id] ? "#ccc" : "var(--green)",
                    color: "white", border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 14,
                    cursor: pagando[d.id] ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {pagando[d.id] ? "..." : "Pagar ✓"}
                </button>
              </div>
            )}

            {/* MODO POR PRODUCTO */}
            {modo === "producto" && d.productos?.length > 0 && (
              <div>
                <div style={{ background: "var(--surface-3)", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                  {d.productos.map((p, i) => {
                    const key = prodKey(p);
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        paddingBottom: i < d.productos.length - 1 ? 10 : 0,
                        marginBottom: i < d.productos.length - 1 ? 10 : 0,
                        borderBottom: i < d.productos.length - 1 ? "1px solid #F0D6E4" : "none",
                      }}>
                        <div style={{ flex: 1, fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>
                          <div>{p.nombre}{p.variable ? ` (${p.variable})` : ""} x{p.cantidad}</div>
                          {p.observacion && <div style={{ fontSize: 11, color: "var(--muted-2)" }}>📝 {p.observacion}</div>}
                          <div style={{ fontSize: 11, color: "var(--rose)", fontWeight: 700 }}>Subtotal: ${fmt(p.subtotal)}</div>
                        </div>
                        <input
                          type="number"
                          placeholder={`$${fmt(p.subtotal)}`}
                          value={(prodMontos[d.id] || {})[key] || ""}
                          onChange={e => setProdMonto(d.id, key, e.target.value)}
                          style={{
                            width: 110, padding: "8px 10px",
                            border: "1px solid #F0D6E4", borderRadius: 8,
                            fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif",
                            background: "var(--surface-2)", color: "var(--text)",
                          }}
                          min="0" max={p.subtotal}
                        />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={metodos[d.id] || "Efectivo"}
                    onChange={e => setMetodos(m => ({ ...m, [d.id]: e.target.value }))}
                    style={{
                      padding: "11px 10px", border: "1px solid #F0D6E4", borderRadius: 10,
                      fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif",
                      background: "var(--surface-2)", color: "var(--text)",
                    }}
                  >
                    {["Efectivo","Transferencia","Mercado Pago","Débito","Crédito"].map(op => (
                      <option key={op}>{op}</option>
                    ))}
                  </select>
                  <div style={{ flex: 1, textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                    Total: <span style={{ color: "var(--green)" }}>${fmt(totalProd)}</span>
                  </div>
                  <button
                    onClick={() => pagar(d)}
                    disabled={pagando[d.id] || totalProd <= 0}
                    style={{
                      padding: "11px 20px",
                      background: pagando[d.id] || totalProd <= 0 ? "#ccc" : "var(--green)",
                      color: "white", border: "none", borderRadius: 10,
                      fontWeight: 700, fontSize: 14,
                      cursor: pagando[d.id] || totalProd <= 0 ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {pagando[d.id] ? "..." : "Pagar ✓"}
                  </button>
                </div>
              </div>
            )}

            {/* ── HISTORIAL DE PAGOS INLINE ── */}
            <div style={{ marginTop: 14, borderTop: "1px solid #F0D6E4", paddingTop: 10 }}>
              <button
                onClick={() => toggleHistorial(d.id)}
                style={{
                  width: "100%", padding: "7px 12px",
                  background: histAbierto ? "var(--surface-3)" : "transparent",
                  border: "1px solid #F0D6E4", borderRadius: 8,
                  fontSize: 12, fontWeight: 700, color: "var(--muted-2)",
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.15s",
                }}
              >
                <span>🕐 Historial de pagos</span>
                <span>{histAbierto ? "▲" : "▼"}</span>
              </button>

              {histAbierto && (
                <div style={{
                  marginTop: 8, padding: "8px 4px",
                  animation: "slideDown 0.2s ease",
                }}>
                  <HistorialCliente
                    nombre={d.nombre}
                    todosPagos={todosPagos}
                    onEditar={p => setEditandoPago(p)}
                    onBorrar={p => setBorrandoPago(p)}
                  />
                </div>
              )}
            </div>

          </div>
        );
      })}

      <style>{`
        @media(max-width:768px){.tab-padding{padding:16px !important;}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}