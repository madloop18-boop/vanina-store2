import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { useState, useEffect } from "react";
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
        if (p.observacion) t += `  📝 ${p.observacion}\n`;
      });
      t += `\n`;
    }
    t += `💰 *Total pendiente: $${fmt(deudor.saldo)}*\n`;
    t += `━━━━━━━━━━━━━━━━━━\n`;
    t += `¡Gracias! 🌸`;
    return t;
  };

  const copiar = () => {
    navigator.clipboard.writeText(textoWsp());
  };

  const abrirWsp = () => {
    const tel = String(deudor.tel || "").replace(/\D/g, "");
    const msg = encodeURIComponent(textoWsp());
    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(26,10,18,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
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
            whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 160, overflowY: "auto",
            lineHeight: 1.6,
          }}>
            {textoWsp()}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={copiar} style={{
              flex: 1, padding: "12px 0", background: "var(--surface-2)",
              border: "1.5px solid #E91E8C", borderRadius: 12,
              fontWeight: 700, fontSize: 14, color: "var(--rose)",
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>
              📋 Copiar
            </button>
            {deudor.tel && (
              <button onClick={abrirWsp} style={{
                flex: 1, padding: "12px 0",
                background: "linear-gradient(135deg,#25D366,#128C7E)",
                border: "none", borderRadius: 12,
                fontWeight: 700, fontSize: 14, color: "white",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>
                💬 WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
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
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
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
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>
            Pago registrado
          </div>
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
            }}>
              {ticket.nombre?.charAt(0).toUpperCase()}
            </div>
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
          }}>
            ✓ Listo
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function Pagos({ showToast }) {
  const [deudores, setDeudores]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pagando, setPagando]           = useState({});
  const [ticket, setTicket]             = useState(null);
  const [ticketDeudor, setTicketDeudor] = useState(null);

  // Por deudor: monto general, método, modo ('general'|'producto'), montos por producto
  const [montos, setMontos]       = useState({});
  const [metodos, setMetodos]     = useState({});
  const [modos, setModos]         = useState({});
  const [prodMontos, setProdMontos] = useState({});

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.getDeudores();
      setDeudores(res.deudores || []);
    } catch (e) {
      showToast("❌ Error al cargar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

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
    setProdMontos(p => ({
      ...p,
      [deudorId]: { ...(p[deudorId] || {}), [prodKey]: val }
    }));
  };

  // Clave única por producto: id_pedido + id_producto + variable + observacion
  const prodKey = (p) =>
    `${p.id_pedido}|${p.id_producto || p.nombre}|${p.variable || ""}|${p.observacion || ""}`;

  const totalPorProductos = (id) =>
    Object.values(prodMontos[id] || {}).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

  const pagar = async (d) => {
    const modo   = modos[d.id] || "general";
    const metodo = metodos[d.id] || "Efectivo";
    let monto    = 0;
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
      const res = await api.registrarPago({
        nombre: d.nombre,
        monto,
        metodo,
        imputaciones,
      });

      setTicket({
        nombre:      d.nombre,
        montoPagado: monto,
        saldoNuevo:  res.saldo_nuevo ?? Math.max(0, d.saldo - monto),
        detalle:     modo === "producto" ? imputaciones : [],
      });

      // Limpiar estado de este deudor
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

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700, margin: "0 auto" }} className="tab-padding">
      <PagoConfirmadoModal ticket={ticket} onClose={() => setTicket(null)} />
      <TicketModal deudor={ticketDeudor} onClose={() => setTicketDeudor(null)} />

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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setTicketDeudor(d)}
                  style={{
                    padding: "6px 12px", background: "#F0FBF7",
                    border: "1px solid #A7E9D5", borderRadius: 8,
                    fontSize: 13, fontWeight: 700, color: "var(--green)",
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  📋 Ticket
                </button>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 22, color: "var(--red)", fontFamily: "'Playfair Display',serif" }}>
                    ${fmt(d.saldo)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-2)" }}>debe</div>
                </div>
              </div>
            </div>

            {/* Lista de productos */}
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

            {d.detalle && (
              <div style={{ fontSize: 12, color: "var(--muted-2)", marginBottom: 12, paddingTop: 10, borderTop: "1px solid #F0D6E4" }}>
                📋 {d.detalle}
              </div>
            )}

            {/* Selector modo */}
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
                  style={{ flex: 1, padding: "11px 16px", border: "1px solid #F0D6E4", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
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
                          {p.observacion && (
                            <div style={{ fontSize: 11, color: "var(--muted-2)" }}>📝 {p.observacion}</div>
                          )}
                          <div style={{ fontSize: 11, color: "var(--rose)", fontWeight: 700 }}>
                            Subtotal: ${fmt(p.subtotal)}
                          </div>
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
          </div>
        );
      })}

      <style>{`@media(max-width:768px){.tab-padding{padding:16px !important;}}`}</style>
    </div>
  );
}
