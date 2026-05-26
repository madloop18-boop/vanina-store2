import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { skeletonCSS } from "../ui/Skeleton";

export default function Encargos({ showToast }) {
  const [resumen, setResumen]     = useState([]);
  const [encargos, setEncargos]   = useState([]);
  const [loading, setLoading]     = useState(true);
  // contadores locales: { "nombre|variable": cantidadRestante }
  const [contadores, setContadores] = useState({});

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.getEncargos();
      const enc = res.encargos || [];
      const res2 = res.resumen || [];
      setEncargos(enc);
      setResumen(res2);
      // inicializar contadores con la cantidad total de cada producto del resumen
      const init = {};
      res2.forEach(r => {
        const key = r.nombre;
        init[key] = r.cantidad;
      });
      setContadores(init);
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const restar = (key) => {
    setContadores(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) - 1)
    }));
  };

  const sumar = (key, max) => {
    setContadores(prev => ({
      ...prev,
      [key]: Math.min(max, (prev[key] || 0) + 1)
    }));
  };

  const totalFaltantes = Object.values(contadores).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: "20px 16px", maxWidth: 700, margin: "0 auto" }}>
      <style>{skeletonCSS}</style>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Cargando encargos...</p>
        </div>
      ) : resumen.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: 16 }}>¡No hay encargos pendientes!</p>
        </div>
      ) : (
        <>
          {/* Card naranja principal */}
          <div style={{
            background: "linear-gradient(135deg, #E65100 0%, #BF360C 100%)",
            borderRadius: 20, padding: "20px 16px",
            boxShadow: "0 8px 32px rgba(230,81,0,0.3)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  Lista de compras
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "white" }}>
                  Encargos
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "white", fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
                  {totalFaltantes}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>unidades restantes</div>
              </div>
            </div>

            {/* Grid de minicards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 10,
            }}>
              {resumen.map((r, i) => {
                const key = r.nombre;
                const actual = contadores[key] ?? r.cantidad;
                const conseguidos = r.cantidad - actual;
                const todoListo = actual === 0;

                return (
                  <div key={i} style={{
                    background: todoListo
                      ? "rgba(0,196,140,0.25)"
                      : "rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    padding: "12px 12px 10px",
                    border: todoListo
                      ? "1.5px solid rgba(0,196,140,0.5)"
                      : "1.5px solid rgba(255,255,255,0.1)",
                    transition: "all 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* Barra de progreso */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0,
                      height: 3,
                      width: `${r.cantidad > 0 ? (conseguidos / r.cantidad) * 100 : 0}%`,
                      background: todoListo ? "var(--green)" : "rgba(255,255,255,0.5)",
                      borderRadius: "0 0 14px 14px",
                      transition: "width 0.3s ease",
                    }} />

                    {/* Nombre producto */}
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      color: todoListo ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.95)",
                      lineHeight: 1.3, marginBottom: 10,
                      textDecoration: todoListo ? "line-through" : "none",
                      minHeight: 32,
                    }}>
                      {r.nombre}
                    </div>

                    {/* Contador */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        onClick={() => sumar(key, r.cantidad)}
                        disabled={actual >= r.cantidad}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "white", fontSize: 16, fontWeight: 700,
                          cursor: actual >= r.cantidad ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: actual >= r.cantidad ? 0.3 : 1,
                          lineHeight: 1,
                        }}
                      >+</button>

                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: todoListo ? 18 : 24,
                          fontWeight: 700,
                          color: todoListo ? "var(--green)" : "var(--surface-2)",
                          lineHeight: 1,
                        }}>
                          {todoListo ? "✓" : actual}
                        </div>
                        {!todoListo && (
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
                            de {r.cantidad}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => restar(key)}
                        disabled={actual === 0}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: actual === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: actual === 0 ? "rgba(255,255,255,0.3)" : "#E65100",
                          fontSize: 16, fontWeight: 700,
                          cursor: actual === 0 ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          lineHeight: 1, transition: "all 0.15s",
                        }}
                      >−</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                {resumen.length} productos · usá − cuando conseguís
              </div>
              <button onClick={cargar} style={{
                padding: "8px 16px", background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10,
                color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                🔄 Actualizar
              </button>
            </div>
          </div>

          {/* Detalle por cliente (colapsable, secundario) */}
          <DetalleClientes encargos={encargos} />
        </>
      )}
    </div>
  );
}

function DetalleClientes({ encargos }) {
  const [abierto, setAbierto] = useState(false);

  // Agrupar por cliente
  const porCliente = {};
  encargos.forEach(e => {
    if (!porCliente[e.cliente]) porCliente[e.cliente] = [];
    porCliente[e.cliente].push(e);
  });

  if (!encargos.length) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setAbierto(a => !a)}
        style={{
          width: "100%", padding: "12px 16px",
          background: "var(--surface-2)", border: "1px solid var(--border-2)",
          borderRadius: 12, fontWeight: 700, fontSize: 13,
          color: "var(--muted)", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span>Ver detalle por cliente</span>
        <span style={{ fontSize: 16 }}>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div style={{ marginTop: 8 }}>
          {Object.entries(porCliente).map(([cliente, items], ci) => (
            <div key={ci} style={{
              background: "var(--surface-2)", borderRadius: 12,
              border: "1px solid var(--border-2)", marginBottom: 8,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 14px", background: "var(--rose-soft)",
                fontWeight: 700, fontSize: 13, color: "var(--rose)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--rose)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {cliente.charAt(0).toUpperCase()}
                </div>
                {cliente}
              </div>
              {items.map((e, ii) => (
                <div key={ii} style={{
                  padding: "10px 14px", fontSize: 13,
                  borderTop: ii > 0 ? "1px solid var(--border-2)" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  color: "var(--text-2)",
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{e.producto}</span>
                    {e.variable && <span style={{ color: "var(--muted)", marginLeft: 6 }}>({e.variable})</span>}
                    {e.observacion && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>📝 {e.observacion}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: "var(--rose)", background: "var(--rose-soft)", padding: "2px 8px", borderRadius: 20, fontSize: 12 }}>
                      x{e.cantidad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
