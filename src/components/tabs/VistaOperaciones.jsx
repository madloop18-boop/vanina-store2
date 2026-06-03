import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

export default function VistaOperaciones() {
  const [pedidos,    setPedidos]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtro,     setFiltro]     = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPedidosPendientes();
      setPedidos(res.pedidos || []);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Agrupar por cliente
  const grupos = (() => {
    const map = {};
    pedidos.forEach(p => {
      const key = p.cliente.toLowerCase().trim();
      if (!map[key]) {
        map[key] = { cliente: p.cliente, tel: p.tel, items: [], total: 0 };
      }
      p.items.forEach(it => map[key].items.push(it));
      map[key].total += Number(p.total) || 0;
    });
    return Object.values(map).sort((a, b) => a.cliente.localeCompare(b.cliente));
  })();

  // Lista consolidada de todo lo que hay que conseguir
  const listaCompras = (() => {
    const map = {};
    pedidos.forEach(p => {
      p.items.forEach(it => {
        const key = it.nombre + (it.variable ? ` (${it.variable})` : "") + (it.observacion ? ` — ${it.observacion}` : "");
        if (!map[key]) map[key] = { nombre: it.nombre, variable: it.variable, observacion: it.observacion, id_producto: it.id_producto || "", cantidad: 0 };
        map[key].cantidad += Number(it.cantidad) || 0;
      });
    });
    return Object.values(map).sort((a, b) => a.nombre.localeCompare(b.nombre));
  })();

  const gruposFiltrados = grupos.filter(g =>
    !filtro.trim() || g.cliente.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--ink, #0D0D0F)",
      fontFamily: "'DM Sans', sans-serif",
      color: "var(--text, #F0F0F5)",
    }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg,#E91E8C,#B5006E)",
        padding: "16px 20px",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 20px rgba(233,30,140,0.4)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              {grupos.length} clientes · {listaCompras.length} productos
            </div>
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
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#888" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <p>Cargando...</p>
        </div>
      ) : (
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "16px",
          display: "grid", gridTemplateColumns: "1fr 320px", gap: 16,
        }} className="ops-grid">

          {/* ── COLUMNA IZQUIERDA: cards por cliente ── */}
          <div>
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

            {gruposFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <p>{filtro ? "Sin resultados" : "¡No hay pedidos pendientes!"}</p>
              </div>
            ) : (
              gruposFiltrados.map((g, gi) => (
                <div key={gi} style={{
                  background: "var(--surface-2, #16162A)", borderRadius: 14,
                  border: "1px solid var(--border, #2E2E38)",
                  marginBottom: 10, overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}>
                  {/* Header cliente */}
                  <div style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--border, #2E2E38)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#E91E8C,#B5006E)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 15,
                    }}>
                      {g.cliente.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #F0F0F5)" }}>{g.cliente}</div>
                      {g.tel && <div style={{ fontSize: 11, color: "#888" }}>📱 {g.tel}</div>}
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display',serif", fontSize: 16,
                      fontWeight: 700, color: "#E91E8C",
                    }}>
                      ${fmt(g.total)}
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: "10px 14px" }}>
                    {g.items.map((it, ii) => (
                      <div key={ii} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        padding: "7px 0",
                        borderBottom: ii < g.items.length - 1 ? "1px solid var(--border, #2E2E38)" : "none",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text, #F0F0F5)" }}>
                            {it.nombre}{it.variable ? ` (${it.variable})` : ""} ×{it.cantidad}
                          </div>
                          {it.id_producto && (
                            <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginTop: 1 }}>
                              ID: {it.id_producto}
                            </div>
                          )}
                          {it.observacion && !it.observacion.includes("[ENTREGADO]") && (
                            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>📝 {it.observacion}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#E91E8C", marginLeft: 8, whiteSpace: "nowrap" }}>
                          ${fmt(it.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── COLUMNA DERECHA: lista consolidada ── */}
          <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <div style={{
              background: "var(--surface-2, #16162A)", borderRadius: 14,
              border: "1px solid var(--border, #2E2E38)",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 16px",
                background: "linear-gradient(135deg,rgba(233,30,140,0.15),rgba(181,0,110,0.08))",
                borderBottom: "1px solid var(--border, #2E2E38)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text, #F0F0F5)" }}>
                  📋 Lista de compras
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {listaCompras.length} productos distintos
                </div>
              </div>

              <div style={{ padding: "10px 0", maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
                {listaCompras.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 13 }}>
                    Sin pendientes 🎉
                  </div>
                ) : (
                  listaCompras.map((p, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      padding: "9px 16px",
                      borderBottom: i < listaCompras.length - 1 ? "1px solid var(--border, #2E2E38)" : "none",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text, #F0F0F5)", lineHeight: 1.3 }}>
                          {p.nombre}{p.variable ? ` (${p.variable})` : ""}
                        </div>
                        {p.id_producto && (
                          <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginTop: 1 }}>
                            ID: {p.id_producto}
                          </div>
                        )}
                        {p.observacion && (
                          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>📝 {p.observacion}</div>
                        )}
                      </div>
                      <div style={{
                        background: "rgba(233,30,140,0.15)", border: "1px solid rgba(233,30,140,0.3)",
                        borderRadius: 20, padding: "2px 10px",
                        fontSize: 13, fontWeight: 700, color: "#E91E8C",
                        marginLeft: 8, flexShrink: 0,
                      }}>
                        ×{p.cantidad}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #555; }
        @media (max-width: 768px) {
          .ops-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}