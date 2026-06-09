import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

// ─── MODAL EDITAR PAGO ───────────────────────────────────────────
function ModalEditarPago({ pago, onConfirm, onClose }) {
  const [monto, setMonto] = useState(String(pago?.monto || ""));

  useEffect(() => { setMonto(String(pago?.monto || "")); }, [pago]);

  if (!pago) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(26,10,18,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 380,
        boxShadow: "0 24px 80px rgba(233,30,140,0.2)",
        animation: "slideUp 0.25s ease", overflow: "hidden",
      }}>
        <div style={{ background: "linear-gradient(135deg,#E91E8C,#B5006E)", padding: "20px 24px", color: "white" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>✏️ Editar pago</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{pago.cliente} · {pago.fecha_str}</div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: 8 }}>
            Nuevo monto
          </label>
          <input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            style={{
              width: "100%", padding: "13px 16px", border: "1.5px solid #F0D6E4",
              borderRadius: 12, fontSize: 18, fontFamily: "'DM Sans',sans-serif",
              outline: "none", marginBottom: 16, fontWeight: 700,
            }}
            autoFocus
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
            }}>✓ Guardar cambio</button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ─── MODAL CONFIRMAR BORRADO ─────────────────────────────────────
function ModalConfirmarBorrar({ pago, onConfirm, onClose }) {
  if (!pago) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(26,10,18,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 20, width: "100%", maxWidth: 360,
        boxShadow: "0 24px 80px rgba(198,40,40,0.2)",
        animation: "slideUp 0.25s ease", overflow: "hidden",
      }}>
        <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
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
            ⚠️ Esto va a recalcular las deudas — el cliente volverá a deber este monto.
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
      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────
export default function HistorialPagos({ showToast }) {
  const [pagos, setPagos]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState("");
  const [resumen, setResumen]       = useState({ total: 0, cantidad: 0 });
  const [editando, setEditando]     = useState(null);  // pago a editar
  const [borrando, setBorrando]     = useState(null);  // pago a borrar
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.getHistorialPagos();
      const lista = res.pagos || [];
      setPagos(lista);
      setResumen({
        total:    lista.reduce((s, p) => s + Number(p.monto || 0), 0),
        cantidad: lista.length,
      });
    } catch (e) {
      showToast("❌ Error al cargar historial: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = filtro.trim()
    ? pagos.filter(p => p.cliente?.toLowerCase().includes(filtro.toLowerCase()))
    : pagos;

  const porFecha = filtrados.reduce((acc, p) => {
    const key = p.fecha_str || "Sin fecha";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // ── EDITAR ───────────────────────────────────────────────────
  const confirmarEdicion = async (nuevoMonto) => {
    if (!nuevoMonto || nuevoMonto <= 0) { showToast("⚠️ Ingresá un monto válido"); return; }
    setProcesando(true);
    try {
      await api.editarPago({
        cliente:    editando.cliente,
        fecha_str:  editando.fecha_str,
        hora_str:   editando.hora_str,
        monto_viejo: editando.monto,
        monto_nuevo: nuevoMonto,
      });
      showToast("✅ Pago actualizado — deudas recalculadas");
      setEditando(null);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setProcesando(false);
    }
  };

  // ── BORRAR ───────────────────────────────────────────────────
  const confirmarBorrado = async () => {
    setProcesando(true);
    try {
      await api.eliminarPago({
        cliente:   borrando.cliente,
        fecha_str: borrando.fecha_str,
        hora_str:  borrando.hora_str,
        monto:     borrando.monto,
      });
      showToast("🗑️ Pago eliminado — deudas recalculadas");
      setBorrando(null);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }} className="tab-padding">

      {/* MODALES */}
      <ModalEditarPago
        pago={editando}
        onConfirm={confirmarEdicion}
        onClose={() => setEditando(null)}
      />
      <ModalConfirmarBorrar
        pago={borrando}
        onConfirm={confirmarBorrado}
        onClose={() => setBorrando(null)}
      />

      {/* RESUMEN */}
      <div style={{
        background: "linear-gradient(135deg,#E91E8C,#B5006E)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 20,
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>
            Total cobrado (histórico)
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700 }}>
            ${fmt(resumen.total)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Pagos registrados</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>
            {resumen.cantidad}
          </div>
        </div>
      </div>

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
        🔄 Actualizar historial
      </button>

      {loading ? (
        <div><style>{skeletonCSS}</style>{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted-2)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15 }}>{filtro ? "Sin resultados para esa búsqueda" : "Todavía no hay pagos registrados"}</p>
        </div>
      ) : (
        Object.entries(porFecha).map(([fecha, items]) => (
          <div key={fecha}>
            {/* SEPARADOR FECHA */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--muted-2)",
              textTransform: "uppercase", letterSpacing: "0.8px",
              marginBottom: 8, marginTop: 4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              📅 {fecha}
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {items.map((p, i) => (
              <div key={i} style={{
                background: "var(--surface-2)", borderRadius: 12, padding: "14px 18px",
                marginBottom: 8, border: "1px solid #F0D6E4",
                boxShadow: "0 1px 4px rgba(233,30,140,0.05)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                {/* AVATAR */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: "var(--rose-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 15, color: "var(--rose)",
                }}>
                  {(p.cliente || "?").charAt(0).toUpperCase()}
                </div>

                {/* INFO */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.cliente}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>
                    {p.hora_str || ""} · {p.concepto || "Pago"}
                  </div>
                </div>

                {/* MONTO */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>
                    +${fmt(p.monto)}
                  </div>
                  {p.metodo && (
                    <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 2 }}>{p.metodo}</div>
                  )}
                </div>

                {/* ACCIONES */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                  <button
                    onClick={() => setEditando(p)}
                    disabled={procesando}
                    style={{
                      padding: "5px 10px", border: "1.5px solid #F0D6E4",
                      background: "var(--surface-2)", borderRadius: 8, cursor: "pointer",
                      fontSize: 13, color: "var(--rose)", fontWeight: 700,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >✏️</button>
                  <button
                    onClick={() => setBorrando(p)}
                    disabled={procesando}
                    style={{
                      padding: "5px 10px", border: "none",
                      background: "var(--red-bg)", borderRadius: 8, cursor: "pointer",
                      fontSize: 13, color: "var(--red)", fontWeight: 700,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >🗑️</button>
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