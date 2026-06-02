import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

// ────────────────────────────────────────────────────────────────
//  VISTA DE OPERACIONES — página separada para gestión rápida
//  Tu clienta la abre en otra pestaña del navegador y puede:
//  - Ver todos los pedidos/encargos de una
//  - Marcar recibido, entregado, etc.
//  - Sin que cada acción la lleve a otra pantalla
//
//  Para usarla: agregar la ruta en App.jsx, ver instrucciones abajo
// ────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const ESTADOS_ITEM = ["Pedido", "Recibido", "Entregado"];
const ESTADO_COLORS = {
  Pedido:    { bg: "#FFF8E1", color: "#F57F17", border: "#FFE082", emoji: "🟡" },
  Recibido:  { bg: "#E3F2FD", color: "#1565C0", border: "#BBDEFB", emoji: "📦" },
  Entregado: { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7", emoji: "✅" },
};

// ── Toast simple interno ─────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "#1a1a2e", color: "white", padding: "12px 24px",
      borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
      animation: "toastIn 0.2s ease",
    }}>
      {msg}
    </div>
  );
}

// ── Fila de un ítem ──────────────────────────────────────────────
function ItemRow({ it, grupo, onCambiar, cargando }) {
  const estado = it.estado_item || "Pedido";
  const estilo = ESTADO_COLORS[estado];
  const idx    = ESTADOS_ITEM.indexOf(estado);
  const key    = `${it.id_pedido}-${it.nombre}-${it.variable}`;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 10px", borderRadius: 8, marginBottom: 4,
      background: estilo.bg, border: `1px solid ${estilo.border}`,
      opacity: cargando[key] ? 0.6 : 1, transition: "opacity 0.2s",
    }}>
      {/* Emoji estado */}
      <span style={{ fontSize: 16, flexShrink: 0 }}>{estilo.emoji}</span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", lineHeight: 1.3 }}>
          {it.nombre}{it.variable ? ` (${it.variable})` : ""} ×{it.cantidad}
        </div>
        {it.observacion && !it.observacion.includes("[ENTREGADO]") && (
          <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>📝 {it.observacion}</div>
        )}
        <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>${fmt(it.subtotal)}</div>
      </div>

      {/* Botones avanzar/retroceder */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {idx > 0 && (
          <button
            onClick={() => onCambiar(grupo, it, ESTADOS_ITEM[idx - 1])}
            disabled={!!cargando[key]}
            title={`← ${ESTADOS_ITEM[idx - 1]}`}
            style={{
              width: 32, height: 32, border: "1px solid #ddd",
              background: "white", borderRadius: 8, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>←</button>
        )}
        {idx < ESTADOS_ITEM.length - 1 && (
          <button
            onClick={() => onCambiar(grupo, it, ESTADOS_ITEM[idx + 1])}
            disabled={!!cargando[key]}
            title={`${ESTADOS_ITEM[idx + 1]} →`}
            style={{
              width: 32, height: 32, border: "none",
              background: estilo.color, color: "white",
              borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>→</button>
        )}
      </div>
    </div>
  );
}

// ── Card de cliente ──────────────────────────────────────────────
function ClienteCard({ grupo, onCambiar, cargando }) {
  const [collapsed, setCollapsed] = useState(false);
  const entregados = grupo.items.filter(it => (it.estado_item || "Pedido") === "Entregado").length;
  const total      = grupo.items.length;
  const pct        = total > 0 ? Math.round((entregados / total) * 100) : 0;

  // Color borde según progreso
  const borderColor = pct === 100 ? "#A5D6A7" : pct > 0 ? "#FFD0A8" : "#F0D6E4";

  return (
    <div style={{
      background: "white", borderRadius: 14, marginBottom: 10,
      border: `1.5px solid ${borderColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden",
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          padding: "12px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, userSelect: "none",
          background: collapsed ? "#fafafa" : "white",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#E91E8C,#B5006E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 14,
        }}>
          {grupo.cliente.charAt(0).toUpperCase()}
        </div>

        {/* Nombre + barra progreso */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 4 }}>
            {grupo.cliente}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: "#F0D6E4", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, transition: "width 0.4s ease",
                background: pct === 100 ? "#2E7D32" : pct > 0 ? "#E65100" : "#E91E8C",
                width: pct + "%",
              }} />
            </div>
            <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
              {entregados}/{total}
            </span>
          </div>
        </div>

        {/* Total + colapsar */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#E91E8C", fontFamily: "'Playfair Display',serif" }}>
            ${fmt(grupo.total)}
          </div>
          {grupo.saldo > 0 && (
            <div style={{ fontSize: 10, color: "#E65100", fontWeight: 700 }}>
              debe ${fmt(grupo.saldo)}
            </div>
          )}
        </div>

        <span style={{
          fontSize: 12, color: "#bbb",
          transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform 0.2s",
        }}>▼</span>
      </div>

      {/* Items */}
      {!collapsed && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #F0D6E4" }}>
          <div style={{ height: 10 }} />
          {grupo.items.map((it, i) => (
            <ItemRow
              key={i}
              it={it}
              grupo={grupo}
              onCambiar={onCambiar}
              cargando={cargando}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function VistaOperaciones() {
  const [pedidos,   setPedidos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [cargando,  setCargando]  = useState({});
  const [toast,     setToast]     = useState("");
  const [filtro,    setFiltro]    = useState(""); // búsqueda por nombre
  const [autoRef,   setAutoRef]   = useState(false); // auto-refresh cada 30s
  const [lastUpdate, setLastUpdate] = useState(null);

  const showToast = (msg) => setToast(msg);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPedidosPendientes();
      setPedidos(res.pedidos || []);
      setLastUpdate(new Date());
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Auto-refresh opcional cada 30 segundos
  useEffect(() => {
    if (!autoRef) return;
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [autoRef, cargar]);

  // Agrupar por cliente
  const grupos = (() => {
    const map = {};
    pedidos.forEach(p => {
      const key = p.cliente.toLowerCase().trim();
      if (!map[key]) {
        map[key] = {
          key, cliente: p.cliente, tel: p.tel, tipo: p.tipo,
          ids: [], items: [], total: 0, pagado: 0, saldo: 0,
        };
      }
      const g = map[key];
      if (!g.ids.includes(p.id)) g.ids.push(p.id);
      p.items.forEach(it => g.items.push({ ...it, id_pedido: p.id }));
      g.total  += Number(p.total)  || 0;
      g.pagado += Number(p.pagado) || 0;
      g.saldo  += Number(p.saldo)  || 0;
    });
    return Object.values(map);
  })();

  // Filtrar por nombre
  const gruposFiltrados = grupos.filter(g =>
    !filtro.trim() || g.cliente.toLowerCase().includes(filtro.toLowerCase())
  );

  // Stats rápidas
  const totalItems     = grupos.reduce((s, g) => s + g.items.length, 0);
  const itemsEntregados = grupos.reduce((s, g) => s + g.items.filter(it => (it.estado_item || "") === "Entregado").length, 0);
  const totalSaldo     = grupos.reduce((s, g) => s + g.saldo, 0);

  const cambiarEstado = async (g, it, estadoNuevo) => {
    const key = `${it.id_pedido}-${it.nombre}-${it.variable}`;
    setCargando(c => ({ ...c, [key]: true }));
    try {
      await api.cambiarEstadoItem({
        id_pedido:          it.id_pedido,
        nombre:             it.nombre,
        variable:           it.variable || "",
        observacion:        it.observacion || "",
        estado_item_actual: it.estado_item || "Pedido",
        cantidad:           it.cantidad,
        cantidad_parcial:   it.cantidad,
        estado_nuevo:       estadoNuevo,
        cliente_nombre:     g.cliente,
        cliente_tel:        g.tel,
      });
      showToast(`${ESTADO_COLORS[estadoNuevo].emoji} ${it.nombre} → ${estadoNuevo}`);
      await new Promise(r => setTimeout(r, 600));
      await cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
      await cargar();
    } finally {
      setCargando(c => ({ ...c, [key]: false }));
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #FFF0F7 0%, #FFF5FA 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg,#E91E8C,#B5006E)",
        padding: "16px 20px",
        color: "white",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(233,30,140,0.3)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>
                🌸 Vista Operaciones
              </div>
              {lastUpdate && (
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>
                  Actualizado: {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRef(a => !a)}
                title={autoRef ? "Auto-refresh ON (cada 30s)" : "Auto-refresh OFF"}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: autoRef ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  color: "white", cursor: "pointer",
                }}>
                {autoRef ? "⏱️ Auto" : "⏱️ Off"}
              </button>
              <button
                onClick={cargar}
                disabled={loading}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
                  color: "white", cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "..." : "🔄 Actualizar"}
              </button>
            </div>
          </div>

          {/* Stats rápidas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "Clientes", val: grupos.length, isNum: true },
              { label: "Ítems", val: `${itemsEntregados}/${totalItems}`, isNum: false, raw: true },
              { label: "Pendiente", val: totalSaldo, isNum: false, prefix: "$" },
              { label: "Listo", val: totalItems > 0 ? Math.round(itemsEntregados/totalItems*100) : 0, isNum: false, suffix: "%" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.15)", borderRadius: 10,
                padding: "8px 10px", textAlign: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
                  {s.raw ? s.val : s.prefix ? s.prefix + fmt(s.val) : s.val + (s.suffix || "")}
                </div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: "16px 16px 80px", maxWidth: 700, margin: "0 auto" }}>

        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px 10px 36px",
              border: "1.5px solid #F0D6E4", borderRadius: 10,
              fontSize: 14, outline: "none", background: "white",
              boxSizing: "border-box",
            }}
          />
          {filtro && (
            <button onClick={() => setFiltro("")} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#bbb",
            }}>✕</button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <p>Cargando pedidos...</p>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 16 }}>
              {filtro ? "Sin resultados" : "¡No hay pedidos pendientes!"}
            </p>
          </div>
        ) : (
          gruposFiltrados.map(g => (
            <ClienteCard
              key={g.key}
              grupo={g}
              onCambiar={cambiarEstado}
              cargando={cargando}
            />
          ))
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </div>
  );
}
