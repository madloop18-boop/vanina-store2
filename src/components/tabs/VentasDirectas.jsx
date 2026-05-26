import { useState, useEffect } from "react";
import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

export default function VentasDirectas({ showToast }) {
  const [ventas, setVentas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]   = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.getVentasDirectas();
      setVentas(res.ventas || []);
    } catch (e) {
      showToast("❌ Error al cargar ventas: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtradas = filtro.trim()
    ? ventas.filter(v => v.cliente?.toLowerCase().includes(filtro.toLowerCase()))
    : ventas;

  // Agrupar por fecha
  const porFecha = filtradas.reduce((acc, v) => {
    const key = v.fecha || "Sin fecha";
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const totalVentas   = ventas.reduce((s, v) => s + (Number(v.total)  || 0), 0);
  const totalCobrado  = ventas.reduce((s, v) => s + (Number(v.pagado) || 0), 0);
  const totalPendiente = ventas.reduce((s, v) => s + (Number(v.saldo) || 0), 0);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }} className="tab-padding">
      <style>{skeletonCSS}</style>

      {/* RESUMEN */}
      {!loading && ventas.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "TOTAL VENDIDO",   val: totalVentas,    color: "var(--rose)" },
            { label: "TOTAL COBRADO",   val: totalCobrado,   color: "var(--green)" },
            { label: "SALDO PENDIENTE", val: totalPendiente, color: totalPendiente > 0 ? "var(--red)" : "var(--green-dark)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface-2)", borderRadius: 14, padding: "16px 14px", border: "1px solid #F0D6E4" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Playfair Display', serif" }}>
                ${fmt(s.val)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUSCADOR */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{
            width: "100%", padding: "12px 16px 12px 42px",
            border: "1.5px solid #F0D6E4", borderRadius: 12, fontSize: 14,
            fontFamily: "'DM Sans',sans-serif", outline: "none", background: "var(--surface-2)",
          }}
        />
        {filtro && (
          <button onClick={() => setFiltro("")} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--muted-2)",
          }}>✕</button>
        )}
      </div>

      {/* ACTUALIZAR */}
      <button onClick={cargar} style={{
        width: "100%", padding: "11px", background: "var(--surface-2)",
        border: "1px solid #F0D6E4", borderRadius: 12,
        fontWeight: 700, fontSize: 13, color: "var(--rose)",
        cursor: "pointer", marginBottom: 20, fontFamily: "'DM Sans',sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        🔄 Actualizar ventas
      </button>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-2)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <p style={{ fontSize: 15 }}>{filtro ? "Sin resultados para esa búsqueda" : "No hay ventas registradas"}</p>
        </div>
      ) : (
        Object.entries(porFecha).map(([fecha, items]) => (
          <div key={fecha}>
            {/* SEPARADOR FECHA */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--muted-2)",
              textTransform: "uppercase", letterSpacing: "0.8px",
              marginBottom: 10, marginTop: 4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              📅 {fecha}
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {items.map((v, i) => (
              <div key={i} style={{
                background: "var(--surface-2)", borderRadius: 14, padding: 20,
                marginBottom: 12, border: "1px solid #F0D6E4",
                boxShadow: "0 1px 3px rgba(233,30,140,0.06)",
              }}>
                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg,#E91E8C,#B5006E)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700, color: "white", flexShrink: 0,
                    }}>
                      {v.cliente?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{v.cliente}</div>
                      <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>
                        {v.tel ? `📱 ${v.tel}` : ""}{v.tipo ? ` · ${v.tipo}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: "var(--rose)", fontFamily: "'Playfair Display', serif" }}>
                      ${fmt(v.total)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 2 }}>
                      {v.metodo || ""}
                    </div>
                  </div>
                </div>

                {/* BADGE */}
                <div style={{ marginBottom: 10 }}>
                  {Number(v.saldo) > 0 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#FFF3E8", color: "#E65100", border: "1px solid #FFD0A8" }}>
                      ⚠️ Con saldo pendiente
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "var(--green-bg)", color: "var(--green)", border: "1px solid #A7E9D5" }}>
                      ✅ Pagado completo
                    </span>
                  )}
                </div>

                {/* ITEMS */}
                <div style={{ marginBottom: 12 }}>
                  {(v.items || []).map((it, j) => (
                    <div key={j} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      padding: "8px 12px", marginBottom: 4, borderRadius: 8,
                      background: "var(--surface-3)", border: "1px solid #F0D6E4",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          {it.nombre}{it.variable ? ` (${it.variable})` : ""} x{it.cantidad}
                        </div>
                        {it.observacion && (
                          <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 2 }}>📝 {it.observacion}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--rose)", flexShrink: 0, marginLeft: 8 }}>
                        ${fmt(it.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* FOOTER */}
                <div style={{ paddingTop: 10, borderTop: "1px solid #F0D6E4" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: "var(--muted-2)" }}>Cobrado: </span>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>${fmt(v.pagado)}</span>
                      {Number(v.saldo) > 0 && (
                        <span style={{ marginLeft: 12, color: "var(--red)", fontWeight: 700 }}>
                          · Debe: ${fmt(v.saldo)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-2)" }}>
                      🔖 {v.id}
                    </div>
                  </div>
                  {v.nota && (
                    <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 6 }}>📝 {v.nota}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <style>{`@media(max-width:768px){.tab-padding{padding:16px !important;}}`}</style>
    </div>
  );
}