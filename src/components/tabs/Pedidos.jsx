import { useState, useEffect } from "react";
import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const FILTROS = [
  { id: "todos",     label: "Todos" },
  { id: "pendiente", label: "🟡 Pendiente" },
  { id: "parcial",   label: "📦 Parcial" },
  { id: "con-sena",  label: "Con seña" },
  { id: "sin-sena",  label: "Sin seña" },
];

const ESTADOS_ITEM = ["Pedido", "Recibido", "Entregado"];
const ESTADO_COLORS = {
  Pedido:     { bg: "#FFF8E1", color: "#F57F17", border: "#FFE082" },
  Recibido:   { bg: "var(--blue-bg)", color: "var(--blue)", border: "#BBDEFB" },
  Entregado:  { bg: "var(--green-bg)", color: "var(--green)", border: "#A7E9D5" },
};
const ESTADO_EMOJIS = { Pedido: "🟡", Recibido: "📦", Entregado: "✅" };

// ── Modal de cantidad parcial ────────────────────────────────────
function ModalCantidad({ modal, onConfirm, onCancel }) {
  const [cant, setCant] = useState(modal?.maxCant ?? 1);

  useEffect(() => {
    setCant(modal?.maxCant ?? 1);
  }, [modal]);

  if (!modal) return null;

  const { it, estadoNuevo, maxCant } = modal;
  const label = estadoNuevo === "Recibido" ? "¿Cuántos llegaron al local?" : "¿Cuántos entregás al cliente?";
  const emoji = ESTADO_EMOJIS[estadoNuevo];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 18, padding: 28,
        width: "100%", maxWidth: 340,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
          {it.nombre}{it.variable ? ` (${it.variable})` : ""}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted-2)", marginBottom: 18 }}>
          {label} <strong style={{ color: "var(--rose)" }}>(máx {maxCant})</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 24 }}>
          <button
            onClick={() => setCant(c => Math.max(1, c - 1))}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "2px solid #F0D6E4",
              background: "var(--surface-2)", fontSize: 22, cursor: "pointer", color: "var(--rose)",
              fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}>−</button>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--rose)", minWidth: 48, textAlign: "center" }}>
            {cant}
          </div>
          <button
            onClick={() => setCant(c => Math.min(maxCant, c + 1))}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: "var(--rose)", fontSize: 22, cursor: "pointer", color: "white",
              fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>
        </div>

        {cant < maxCant && (
          <div style={{
            fontSize: 12, color: "#E65100", background: "#FFF3E8",
            border: "1px solid #FFD0A8", borderRadius: 8, padding: "8px 12px",
            marginBottom: 16, textAlign: "center",
          }}>
            📦 Quedarán <strong>{maxCant - cant}</strong> en estado anterior
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #F0D6E4",
              background: "var(--surface-2)", color: "var(--muted-2)", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>
            Cancelar
          </button>
          <button onClick={() => onConfirm(cant)}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
              background: "var(--rose)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
            {emoji} Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Ticket completo ────────────────────────────────────────
// ✅ FIX: muestra TODOS los ítems entregados del grupo (no solo uno),
// y agrega precio sugerido de venta para mayoristas
function ModalTicket({ grupo, onClose, showToast }) {
  if (!grupo) return null;

  const esMayorista = (grupo.tipo || "").toLowerCase() === "mayorista";
  const itemsEntregados = grupo.items.filter(it =>
    (it.estado_item || "Pedido") === "Entregado"
  );
  // Si no hay nada entregado todavía, mostrar todos igualmente
  const itemsMostrar = itemsEntregados.length > 0 ? itemsEntregados : grupo.items;

  const fecha = new Date().toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const totalEntregado = itemsMostrar.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const totalSugerido  = esMayorista
    ? itemsMostrar.reduce((s, it) => {
        const pm = Number(it.precio_minorista) || 0;
        return s + (pm > 0 ? pm * (Number(it.cantidad) || 1) : 0);
      }, 0)
    : 0;

  const textoWsp = () => {
    let t = `🌸 *Vanina Store*\n`;
    t += `📅 ${fecha} · ${hora}\n`;
    t += `━━━━━━━━━━━━━━━━━━\n`;
    t += `👤 *${grupo.cliente}*\n\n`;
    t += `📦 *Detalle entregado:*\n`;
    itemsMostrar.forEach(it => {
      const nombreMostrar = (it.nombre || "").toLowerCase().includes("personalizado") && it.observacion
        ? `${it.nombre} — ${it.observacion}`
        : it.nombre;
      t += `• ${nombreMostrar}${it.variable ? ` (${it.variable})` : ""} x${it.cantidad} — $${fmt(it.subtotal)}\n`;
      if (esMayorista && Number(it.precio_minorista) > 0) {
        const sugerido = Number(it.precio_minorista) * (Number(it.cantidad) || 1);
        t += `  💵 _Precio sugerido: $${fmt(sugerido)}_\n`;
      }
    });
    t += `\n💰 *Total: $${fmt(totalEntregado)}*\n`;
    if (esMayorista && totalSugerido > 0) {
      t += `💵 *Puede revender en: $${fmt(totalSugerido)}*\n`;
    }
    if (grupo.saldo > 0) {
      t += `⚠️ *Saldo pendiente: $${fmt(grupo.saldo)}*\n`;
    } else {
      t += `✅ Pagado\n`;
    }
    t += `━━━━━━━━━━━━━━━━━━\n`;
    t += `¡Gracias! 🌸`;
    return t;
  };

  const copiar = () => {
    navigator.clipboard.writeText(textoWsp());
    showToast("📋 Ticket copiado");
  };

  const abrirWsp = () => {
    const tel = String(grupo.tel || "").replace(/\D/g, "");
    const msg = encodeURIComponent(textoWsp());
    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
  };

 const enviarTelegram = async () => {
    try {
      await api.enviarTicket({
        id_pedido:     grupo.ids[0],                    // ← NUEVO
        cliente:       grupo.cliente,
        tel:           grupo.tel,
        tipo_cliente:  grupo.tipo,
        items:         itemsMostrar.map(it => ({        // ← NUEVO: mapear con id_producto
          ...it,
          id_producto: it.id_producto || "",
        })),
        total:         totalEntregado,
        saldo:         grupo.saldo,
      });
      showToast("🎫 Ticket enviado por Telegram");
    } catch (e) {
      showToast("❌ Error: " + e.message);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(26,10,18,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(233,30,140,0.25)",
        overflow: "hidden", animation: "slideUp 0.25s ease",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#E91E8C,#B5006E)",
          padding: "20px 24px 16px", color: "white", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Ticket de pedido</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginTop: 2 }}>
              {grupo.cliente}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {itemsMostrar.length} producto{itemsMostrar.length !== 1 ? "s" : ""} entregados
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: "white",
            borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Contenido scrollable */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

          {/* Lista de ítems */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Detalle
            </div>
            <div style={{ background: "var(--surface-3)", borderRadius: 12, padding: "10px 14px" }}>
              {itemsMostrar.map((it, i) => {
                const precioSugerido = esMayorista && Number(it.precio_minorista) > 0
                  ? Number(it.precio_minorista) * (Number(it.cantidad) || 1)
                  : 0;
                return (
                  <div key={i} style={{
                    fontSize: 13, lineHeight: 1.7, color: "var(--text)",
                    borderBottom: i < itemsMostrar.length - 1 ? "1px solid #F0D6E4" : "none",
                    paddingBottom: i < itemsMostrar.length - 1 ? 10 : 0,
                    marginBottom: i < itemsMostrar.length - 1 ? 10 : 0,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>
                        • {it.nombre}{it.variable ? ` (${it.variable})` : ""} x{it.cantidad}
                      </span>
                      <span style={{ fontWeight: 700 }}>${fmt(it.subtotal)}</span>
                    </div>
                    {it.observacion && (
                      <div style={{ fontSize: 11, color: "var(--muted-2)", marginLeft: 10 }}>📝 {it.observacion}</div>
                    )}
                    {precioSugerido > 0 && (
                      <div style={{ fontSize: 11, color: "var(--green)", marginLeft: 10, fontWeight: 600 }}>
                        💵 Precio sugerido venta: ${fmt(precioSugerido)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totales */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 14px", background: "var(--surface-3)", borderRadius: 10,
              marginBottom: 8, border: "1px solid #F0D6E4",
            }}>
              <span style={{ fontSize: 13, color: "var(--muted-2)" }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--rose)", fontFamily: "'Playfair Display',serif" }}>
                ${fmt(totalEntregado)}
              </span>
            </div>
            {esMayorista && totalSugerido > 0 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#F0FBF7", borderRadius: 10,
                border: "1px solid #A7E9D5", marginBottom: 8,
              }}>
                <span style={{ fontSize: 13, color: "var(--green)" }}>💵 Puede revender en</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>
                  ${fmt(totalSugerido)}
                </span>
              </div>
            )}
            {grupo.saldo > 0 ? (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#FFF3E8", borderRadius: 10,
                border: "1px solid #FFD0A8",
              }}>
                <span style={{ fontSize: 13, color: "#E65100" }}>⚠️ Saldo pendiente</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#E65100" }}>
                  ${fmt(grupo.saldo)}
                </span>
              </div>
            ) : (
              <div style={{
                padding: "10px 14px", background: "var(--green-bg)", borderRadius: 10,
                border: "1px solid #A7E9D5", textAlign: "center",
                fontSize: 13, fontWeight: 700, color: "var(--green)",
              }}>
                ✅ Pagado completo
              </div>
            )}
          </div>

          {/* Preview texto WhatsApp */}
          <div style={{
            background: "#F0FBF7", border: "1px solid #A7E9D5", borderRadius: 12,
            padding: "12px 14px", fontSize: 12, color: "#1A5C45", fontFamily: "monospace",
            whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 160, overflowY: "auto",
            lineHeight: 1.6,
          }}>
            {textoWsp()}
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copiar} style={{
              flex: 1, padding: "12px 0", background: "var(--surface-2)",
              border: "1.5px solid #E91E8C", borderRadius: 12,
              fontWeight: 700, fontSize: 13, color: "var(--rose)", cursor: "pointer",
            }}>
              📋 Copiar
            </button>
            <button onClick={enviarTelegram} style={{
              flex: 1, padding: "12px 0",
              background: "linear-gradient(135deg,#0088cc,#006699)",
              border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 13, color: "white", cursor: "pointer",
            }}>
              ✈️ Telegram
            </button>
            {grupo.tel && (
              <button onClick={abrirWsp} style={{
                flex: 1, padding: "12px 0",
                background: "linear-gradient(135deg,#25D366,#128C7E)",
                border: "none", borderRadius: 12,
                fontWeight: 700, fontSize: 13, color: "white", cursor: "pointer",
              }}>
                💬 WA
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────

export default function Pedidos({ showToast }) {
  const [pedidos, setPedidos]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState("todos");
  const [cambiando, setCambiando]     = useState({});
  const [modal, setModal]             = useState(null);
  const [ticketGrupo, setTicketGrupo] = useState(null); // ✅ nuevo: grupo para ticket

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.getPedidosPendientes();
      setPedidos(res.pedidos || []);
    } catch (e) {
      showToast("❌ Error al cargar pedidos: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Agrupar por cliente
  const grupos = (() => {
    const map = {};
    pedidos.forEach(p => {
      const key = p.cliente.toLowerCase().trim();
      if (!map[key]) {
        map[key] = {
          key, cliente: p.cliente, tel: p.tel, tipo: p.tipo,
          ids: [], items: [], total: 0, pagado: 0, saldo: 0,
          fechaMin: p.fecha, nota: p.nota, estados: [],
        };
      }
      const g = map[key];
      if (!g.ids.includes(p.id)) g.ids.push(p.id);
      g.estados.push(p.estado || "Pendiente");
      p.items.forEach(it => g.items.push({ ...it, id_pedido: p.id }));
      g.total  += Number(p.total)  || 0;
      g.pagado += Number(p.pagado) || 0;
      g.saldo  += Number(p.saldo)  || 0;
    });
    return Object.values(map);
  })();

  const filtrados = grupos.filter(g => {
    if (filtro === "pendiente") return g.estados.every(e => e === "Pendiente" || e === "Listo");
    if (filtro === "parcial")   return g.estados.some(e => e === "Entrega parcial");
    if (filtro === "con-sena")  return g.pagado > 0;
    if (filtro === "sin-sena")  return g.pagado === 0;
    return true;
  });

  const totalPorCobrar = grupos.reduce((s, g) => s + g.saldo, 0);

  const solicitarCambioEstado = (g, it, estadoNuevo) => {
    const estadoActual = it.estado_item || "Pedido";
    const esAvance = ESTADOS_ITEM.indexOf(estadoNuevo) > ESTADOS_ITEM.indexOf(estadoActual);
    const esDesdeInicio = estadoActual === "Pedido";

    if (it.cantidad > 1 && esAvance && esDesdeInicio) {
      setModal({ g, it, estadoNuevo, maxCant: it.cantidad });
    } else {
      ejecutarCambioEstado(g, it, estadoNuevo, it.cantidad);
    }
  };

  const ejecutarCambioEstado = async (g, it, estadoNuevo, cantConfirmada) => {
    setModal(null);
    const key = `${it.id_pedido}-${it.nombre}-${it.variable}`;
    setCambiando(c => ({ ...c, [key]: true }));

    try {
      await api.cambiarEstadoItem({
        id_pedido:          it.id_pedido,
        nombre:             it.nombre,
        variable:           it.variable || "",
        observacion:        it.observacion || "",
        estado_item_actual: it.estado_item || "Pedido",
        cantidad:           it.cantidad,
        cantidad_parcial:   cantConfirmada,
        estado_nuevo:       estadoNuevo,
        cliente_nombre:     g.cliente,
        cliente_tel:        g.tel,
      });

      const parcial = cantConfirmada < it.cantidad;
      showToast(`${ESTADO_EMOJIS[estadoNuevo]} ${it.nombre}${parcial ? ` (${cantConfirmada}/${it.cantidad})` : ""} → ${estadoNuevo}`);

      await new Promise(r => setTimeout(r, 800));
      await cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
      await cargar();
    } finally {
      setCambiando(c => ({ ...c, [key]: false }));
    }
  };

  const eliminarItem = async (g, it) => {
    if (!confirm(`¿Eliminar "${it.nombre}" del pedido de ${g.cliente}?`)) return;
    try {
      await api.eliminarItemPedido({
        id_pedido: it.id_pedido,
        nombre:    it.nombre,
        variable:  it.variable || "",
        cantidad:  it.cantidad,
      });
      showToast(`🗑️ Item eliminado`);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }} className="tab-padding">
      <style>{skeletonCSS}</style>

      {/* MODAL CANTIDAD */}
      <ModalCantidad
        modal={modal}
        onConfirm={(cant) => ejecutarCambioEstado(modal.g, modal.it, modal.estadoNuevo, cant)}
        onCancel={() => setModal(null)}
      />

      {/* ✅ MODAL TICKET COMPLETO */}
      {ticketGrupo && (
        <ModalTicket
          grupo={ticketGrupo}
          onClose={() => setTicketGrupo(null)}
          showToast={showToast}
        />
      )}

      {/* RESUMEN */}
      {!loading && grupos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {[
            { label: "CLIENTES CON PEDIDOS", val: grupos.length,  isNum: true,  color: "var(--rose)" },
            { label: "TOTAL POR COBRAR",     val: totalPorCobrar, isNum: false, color: "var(--red)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: 14, padding: 20, border: "1px solid #F0D6E4" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'Playfair Display', serif" }}>
                {s.isNum ? s.val : "$" + fmt(s.val)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
              borderColor: filtro === f.id ? "var(--rose)" : "var(--border)",
              background:  filtro === f.id ? "var(--rose)" : "var(--surface-2)",
              color:       filtro === f.id ? "var(--surface-2)" : "var(--muted-2)",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div><style>{skeletonCSS}</style>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-2)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: 16 }}>¡No hay pedidos pendientes!</p>
        </div>
      ) : (
        filtrados.map(g => {
          const entregados = g.items.filter(it => (it.estado_item || "Pedido") === "Entregado").length;
          const totalItems = g.items.length;
          const estadoGrupo = entregados === totalItems ? "Completo"
            : entregados > 0 ? "Entrega parcial"
            : "Pendiente";

          return (
            <div key={g.key} style={{ background: "var(--surface-2)", borderRadius: 14, padding: 20, marginBottom: 12, border: "1px solid #F0D6E4", boxShadow: "0 1px 3px rgba(233,30,140,0.06)" }}>

              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--rose-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--rose)", flexShrink: 0 }}>
                    {g.cliente.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{g.cliente}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>
                      📅 {g.fechaMin}{g.tel ? ` · 📱 ${g.tel}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "var(--rose)", fontFamily: "'Playfair Display', serif" }}>
                    ${fmt(g.total)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{entregados}/{totalItems} entregados</div>
                </div>
              </div>

              {/* BADGE ESTADO */}
              <div style={{ marginBottom: 12 }}>
                {estadoGrupo === "Completo" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "var(--green-bg)", color: "var(--green)", border: "1px solid #A7E9D5" }}>
                    ✅ Completo
                  </span>
                ) : estadoGrupo === "Entrega parcial" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#FFF3E8", color: "#E65100", border: "1px solid #FFD0A8" }}>
                    📦 Entrega parcial
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#FFF8E1", color: "#F57F17", border: "1px solid #FFE082" }}>
                    🟡 Pendiente
                  </span>
                )}
              </div>

              {/* ITEMS CON ESTADOS */}
              <div style={{ marginBottom: 12 }}>
                {g.items.map((it, i) => {
                  const estadoItem   = it.estado_item || "Pedido";
                  const estiloEstado = ESTADO_COLORS[estadoItem];
                  const key          = `${it.id_pedido}-${it.nombre}-${it.variable}`;
                  const cargando     = cambiando[key];
                  const idxActual    = ESTADOS_ITEM.indexOf(estadoItem);

                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", marginBottom: 6, borderRadius: 10,
                      background: estiloEstado.bg,
                      border: `1px solid ${estiloEstado.border}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          {it.nombre}{it.variable ? ` (${it.variable})` : ""} x{it.cantidad}
                        </div>
                        {it.id_producto && (
                          <div style={{ fontSize: 10, color: "var(--muted-2)", fontFamily: "monospace", marginTop: 1 }}>
                            ID: {it.id_producto}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "var(--muted-2)" }}>${fmt(it.subtotal)}</div>
                        {it.observacion && !it.observacion.includes("[ENTREGADO]") && (
                          <div style={{ fontSize: 11, color: "var(--muted-2)" }}>📝 {it.observacion}</div>
                        )}
                      </div>

                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                        background: estiloEstado.bg, color: estiloEstado.color,
                        border: `1px solid ${estiloEstado.border}`, whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {ESTADO_EMOJIS[estadoItem]} {estadoItem}
                      </span>

                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {idxActual > 0 && (
                          <button
                            onClick={() => solicitarCambioEstado(g, it, ESTADOS_ITEM[idxActual - 1])}
                            disabled={cargando}
                            title={`Volver a ${ESTADOS_ITEM[idxActual - 1]}`}
                            style={{ width: 28, height: 28, border: "1px solid #F0D6E4", background: "var(--surface-2)", borderRadius: 8, fontSize: 13, cursor: "pointer", opacity: cargando ? 0.5 : 1 }}>
                            ←
                          </button>
                        )}
                        {idxActual < ESTADOS_ITEM.length - 1 && (
                          <button
                            onClick={() => solicitarCambioEstado(g, it, ESTADOS_ITEM[idxActual + 1])}
                            disabled={cargando}
                            title={`Pasar a ${ESTADOS_ITEM[idxActual + 1]}`}
                            style={{ width: 28, height: 28, border: "none", background: estiloEstado.color, color: "white", borderRadius: 8, fontSize: 13, cursor: "pointer", opacity: cargando ? 0.5 : 1, fontWeight: 700 }}>
                            →
                          </button>
                        )}
                        <button
                          onClick={() => eliminarItem(g, it)}
                          disabled={cargando}
                          style={{ width: 28, height: 28, border: "none", background: "var(--red-bg)", color: "var(--red)", borderRadius: 8, fontSize: 12, cursor: "pointer", opacity: cargando ? 0.5 : 1 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SEÑA */}
              {g.pagado > 0 && g.estados.every(e => e === "Pendiente" || e === "Listo") && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, marginBottom: 12, background: "var(--blue-bg)", border: "1px solid #BBDEFB" }}>
                  <span style={{ fontSize: 13, color: "var(--blue)" }}>💵 Seña ya pagada</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)" }}>${fmt(g.pagado)}</span>
                </div>
              )}

              {g.nota && <div style={{ fontSize: 12, color: "var(--muted-2)", marginBottom: 12 }}>📝 {g.nota}</div>}

              {/* FOOTER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #F0D6E4", flexWrap: "wrap", gap: 8 }}>
                <div>
                  {(() => {
                    const saldoReal = g.items
                      .filter(it => (it.estado_item || "Pedido") !== "Entregado")
                      .reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
                    return saldoReal > 0 ? (
                      <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 700 }}>
                        ⚠️ Saldo pendiente: ${fmt(saldoReal)}
                      </div>
                    ) : entregados > 0 ? (
                      <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>✅ Saldo saldado</div>
                    ) : null;
                  })()}
                </div>
                {/* ✅ Ahora abre el ModalTicket completo en vez de llamar a api.enviarTicket directo */}
                <button
                  onClick={() => setTicketGrupo(g)}
                  style={{ padding: "9px 16px", background: "var(--rose-soft)", color: "var(--rose)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  🎫 Ticket
                </button>
              </div>

            </div>
          );
        })
      )}

      <style>{`
        @media (max-width: 768px) { .tab-padding { padding: 16px !important; } }
      `}</style>
    </div>
  );
}