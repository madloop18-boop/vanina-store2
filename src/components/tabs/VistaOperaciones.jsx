import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const ESTADOS_ITEM = ["Pedido", "Recibido", "Entregado"];
const ESTADO_COLORS = {
  Pedido:    { bg: "rgba(245,127,23,0.12)", color: "#F57F17", border: "rgba(245,127,23,0.3)", emoji: "🟡" },
  Recibido:  { bg: "rgba(33,150,243,0.12)", color: "#64B5F6", border: "rgba(33,150,243,0.3)", emoji: "📦" },
  Entregado: { bg: "rgba(0,200,120,0.12)",  color: "#00C878", border: "rgba(0,200,120,0.3)",  emoji: "✅" },
};

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
      background: "#E91E8C", color: "white", padding: "12px 24px",
      borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999,
      boxShadow: "0 8px 32px rgba(233,30,140,0.4)", whiteSpace: "nowrap",
      animation: "toastIn 0.2s ease",
    }}>
      {msg}
    </div>
  );
}

function ItemRow({ it, grupo, onCambiar, cargando }) {
  const estado = it.estado_item || "Pedido";
  const estilo = ESTADO_COLORS[estado];
  const idx    = ESTADOS_ITEM.indexOf(estado);
  const key    = `${it.id_pedido}-${it.nombre}-${it.variable}`;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 12px", borderRadius: 10, marginBottom: 6,
      background: estilo.bg, border: `1px solid ${estilo.border}`,
      opacity: cargando[key] ? 0.6 : 1, transition: "opacity 0.2s",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{estilo.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
       <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text, #F0F0F5)", lineHeight: 1.3 }}>
  {it.nombre}{it.variable ? ` (${it.variable})` : ""} ×{it.cantidad}
</div>
{it.id_producto && (
  <div style={{ fontSize: 10, color: "var(--muted, #888)", marginTop: 1, fontFamily: "monospace" }}>
    ID: {it.id_producto}
  </div>
)}
{it.observacion && !it.observacion.includes("[ENTREGADO]") && (
  <div style={{ fontSize: 11, color: "var(--muted, #888)", marginTop: 2 }}>📝 {it.observacion}</div>
)}
<div style={{ fontSize: 11, color: estilo.color, marginTop: 1, fontWeight: 600 }}>${fmt(it.subtotal)}</div>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {idx > 0 && (
          <button
            onClick={() => onCambiar(grupo, it, ESTADOS_ITEM[idx - 1])}
            disabled={!!cargando[key]}
            style={{
              width: 32, height: 32, border: "1px solid var(--border, #2E2E38)",
              background: "var(--surface, #1A1A2E)", borderRadius: 8, fontSize: 14,
              cursor: "pointer", color: "var(--muted, #888)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>←</button>
        )}
        {idx < ESTADOS_ITEM.length - 1 && (
          <button
            onClick={() => onCambiar(grupo, it, ESTADOS_ITEM[idx + 1])}
            disabled={!!cargando[key]}
            style={{
              width: 32, height: 32, border: "none",
              background: estilo.color, color: "white",
              borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>→</button>
        )}
      </div>
    </div>
  );
}

function ClienteCard({ grupo, onCambiar, cargando }) {
  const [collapsed, setCollapsed] = useState(false);
  const entregados = grupo.items.filter(it => (it.estado_item || "Pedido") === "Entregado").length;
  const total      = grupo.items.length;
  const pct        = total > 0 ? Math.round((entregados / total) * 100) : 0;
  const borderColor = pct === 100 ? "rgba(0,200,120,0.4)" : pct > 0 ? "rgba(230,81,0,0.4)" : "var(--border, #2E2E38)";

  return (
    <div style={{
      background: "var(--surface-2, #16162A)", borderRadius: 14, marginBottom: 10,
      border: `1.5px solid ${borderColor}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)", overflow: "hidden",
    }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          padding: "12px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, userSelect: "none",
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#E91E8C,#B5006E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 15,
        }}>
          {grupo.cliente.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #F0F0F5)", marginBottom: 5 }}>
            {grupo.cliente}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: "var(--surface-4, #2E2E38)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, transition: "width 0.4s ease",
                background: pct === 100 ? "#00C878" : pct > 0 ? "#E65100" : "#E91E8C",
                width: pct + "%",
              }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--muted, #888)", whiteSpace: "nowrap" }}>
              {entregados}/{total}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#E91E8C", fontFamily: "'Playfair Display',serif" }}>
            ${fmt(grupo.total)}
          </div>
          {grupo.saldo > 0 && (
            <div style={{ fontSize: 10, color: "#FF6B6B", fontWeight: 700 }}>
              debe ${fmt(grupo.saldo)}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 12, color: "var(--muted, #888)", transition: "transform 0.2s",
          display: "inline-block", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
        }}>▼</span>
      </div>

      {!collapsed && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border, #2E2E38)" }}>
          <div style={{ height: 10 }} />
          {grupo.items.map((it, i) => (
            <ItemRow key={i} it={it} grupo={grupo} onCambiar={onCambiar} cargando={cargando} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VistaOperaciones() {
  const [pedidos,    setPedidos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cargando,   setCargando]   = useState({});
  const [toast,      setToast]      = useState("");
  const [filtro,     setFiltro]     = useState("");
  const [autoRef,    setAutoRef]    = useState(false);
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

  useEffect(() => {
    if (!autoRef) return;
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [autoRef, cargar]);

  const grupos = (() => {
    const map = {};
    pedidos.forEach(p => {
      const key = p.cliente.toLowerCase().trim();
      if (!map[key]) {
        map[key] = { key, cliente: p.cliente, tel: p.tel, tipo: p.tipo, ids: [], items: [], total: 0, pagado: 0, saldo: 0 };
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

  const gruposFiltrados = grupos.filter(g =>
    !filtro.trim() || g.cliente.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalItems      = grupos.reduce((s, g) => s + g.items.length, 0);
  const itemsEntregados = grupos.reduce((s, g) => s + g.items.filter(it => (it.estado_item || "") === "Entregado").length, 0);
  const totalSaldo      = grupos.reduce((s, g) => s + g.saldo, 0);

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
      const emojis = { Pedido: "🟡", Recibido: "📦", Entregado: "✅" };
      showToast(`${emojis[estadoNuevo] || ""} ${it.nombre} → ${estadoNuevo}`);
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
      background: "var(--ink, #0D0D0F)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg,#E91E8C,#B5006E)",
        padding: "16px 20px",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 20px rgba(233,30,140,0.4)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "white" }}>
                🌸 Vista Operaciones
              </div>
              {lastUpdate && (
                <div style={{ fontSize: 11, opacity: 0.75, color: "white", marginTop: 2 }}>
                  Actualizado: {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setAutoRef(a => !a)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: autoRef ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  color: "white", cursor: "pointer",
                }}>
                {autoRef ? "⏱️ Auto ON" : "⏱️ Auto OFF"}
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

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "Clientes",  val: grupos.length,        raw: true },
              { label: "Ítems",     val: `${itemsEntregados}/${totalItems}`, raw: true },
              { label: "Pendiente", val: "$" + fmt(totalSaldo), raw: true },
              { label: "Listo",     val: totalItems > 0 ? Math.round(itemsEntregados / totalItems * 100) + "%" : "0%", raw: true },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.15)", borderRadius: 10,
                padding: "8px 10px", textAlign: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{s.val}</div>
                <div style={{ fontSize: 10, opacity: 0.75, color: "white" }}>{s.label}</div>
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
              border: "1px solid var(--border, #2E2E38)", borderRadius: 10,
              fontSize: 14, outline: "none",
              background: "var(--surface-2, #16162A)",
              color: "var(--text, #F0F0F5)",
              boxSizing: "border-box",
            }}
          />
          {filtro && (
            <button onClick={() => setFiltro("")} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              border: "none", background: "none", cursor: "pointer", fontSize: 16, color: "#888",
            }}>✕</button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted, #888)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <p>Cargando pedidos...</p>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted, #888)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 16 }}>
              {filtro ? "Sin resultados" : "¡No hay pedidos pendientes!"}
            </p>
          </div>
        ) : (
          gruposFiltrados.map(g => (
            <ClienteCard key={g.key} grupo={g} onCambiar={cambiarEstado} cargando={cargando} />
          ))
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        input::placeholder { color: #666; }
      `}</style>
    </div>
  );
}