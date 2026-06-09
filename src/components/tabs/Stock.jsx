import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { skeletonCSS, SkeletonCard } from "../ui/Skeleton";

function fmt(n) { return Number(n||0).toLocaleString("es-AR"); }

const S = {
  card: {
    background:"var(--surface-2)", borderRadius:14,
    border:"1px solid var(--border)", overflow:"hidden",
    marginBottom:10,
  },
  input: {
    width:"100%", padding:"10px 14px",
    border:"1px solid var(--border)", borderRadius:10,
    fontSize:14, background:"var(--surface-3)", color:"var(--text)",
  },
  btn: (color="#FF2D8A", bg="var(--rose-soft)") => ({
    padding:"8px 16px", borderRadius:10, border:`1px solid ${color}`,
    background:bg, color, fontWeight:700, fontSize:13,
    cursor:"pointer", fontFamily:"inherit",
  }),
};

// ── Modal cargar stock ────────────────────────────────────────────
function ModalCargaStock({ prod, onConfirm, onClose }) {
  const [cant, setCant]   = useState("");
  const [nota, setNota]   = useState("");
  const [tipo, setTipo]   = useState("compra"); // compra | ajuste | devolucion

  if (!prod) return null;

  const tipoLabel = { compra:"🛒 Compra", ajuste:"⚙️ Ajuste manual", devolucion:"↩️ Devolución" };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      padding:0, animation:"fadeIn 0.2s ease",
    }}>
      <div style={{
        background:"var(--surface-2)", borderRadius:"20px 20px 0 0",
        width:"100%", maxWidth:480, padding:"24px 20px 32px",
        border:"1px solid var(--border)", borderBottom:"none",
        animation:"slideUp 0.3s ease",
      }}>
        <div style={{ width:36, height:3, borderRadius:2, background:"var(--border-2)", margin:"0 auto 20px" }} />

        <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:4 }}>
          Cargar stock
        </div>
        <div style={{ fontSize:13, color:"var(--muted)", marginBottom:20 }}>
          #{prod.id} · {prod.nombre}{prod.variable ? ` (${prod.variable})` : ""}
        </div>

        {/* Tipo */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {["compra","ajuste","devolucion"].map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{
              flex:1, padding:"8px 4px", borderRadius:8, border:"1px solid",
              borderColor: tipo===t ? "var(--rose)" : "var(--border)",
              background: tipo===t ? "var(--rose-soft)" : "var(--surface-3)",
              color: tipo===t ? "var(--rose)" : "var(--muted-2)",
              fontWeight: tipo===t ? 700 : 400,
              fontSize:11, cursor:"pointer",
            }}>
              {tipoLabel[t]}
            </button>
          ))}
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", display:"block", marginBottom:6 }}>
            {tipo === "ajuste" ? "Nueva cantidad total" : "Unidades a agregar"}
          </label>
          <input
            type="number" min="0"
            value={cant} onChange={e => setCant(e.target.value)}
            placeholder={tipo === "ajuste" ? "Ej: 15" : "Ej: 20"}
            style={S.input} autoFocus
          />
          {tipo === "ajuste" && (
            <div style={{ fontSize:11, color:"var(--amber)", marginTop:4 }}>
              ⚠️ Esto va a reemplazar el stock actual con el número que ingreses
            </div>
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", display:"block", marginBottom:6 }}>
            Nota (opcional)
          </label>
          <input
            type="text"
            value={nota} onChange={e => setNota(e.target.value)}
            placeholder="Ej: Pedido de mayo, factura #123..."
            style={S.input}
          />
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, padding:"13px", border:"1px solid var(--border)",
            background:"var(--surface-3)", borderRadius:12,
            fontWeight:700, fontSize:14, cursor:"pointer", color:"var(--muted-2)",
          }}>Cancelar</button>
          <button onClick={() => {
            const c = parseFloat(cant);
            if (!c && c !== 0) return;
            onConfirm({ cantidad: c, tipo, nota });
          }} style={{
            flex:2, padding:"13px", border:"none",
            background:"linear-gradient(135deg,#FF2D8A,#CC1F6B)",
            color:"white", borderRadius:12, fontWeight:700, fontSize:14,
            cursor:"pointer", boxShadow:"var(--shadow-rose)",
          }}>
            ✓ Confirmar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)}to{transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export default function Stock({ showToast }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [filtro, setFiltro]       = useState("todos"); // todos | bajo | ok | sin-stock
  const [modalProd, setModalProd] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [expandido, setExpandido] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.getStock();
      setItems(res.stock || []);
    } catch(e) {
      showToast("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = items.filter(p => {
    const coincide = !busqueda || 
      String(p.id).toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.nombre||"").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.variable||"").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.observacion||"").toLowerCase().includes(busqueda.toLowerCase());
    
    if (!coincide) return false;
    if (filtro === "sin-stock") return p.stock_actual <= 0;
    if (filtro === "bajo")      return p.stock_actual > 0 && p.stock_actual <= 3;
    if (filtro === "ok")        return p.stock_actual > 3;
    return true;
  });

  const sinStock   = items.filter(p => p.stock_actual <= 0).length;
  const bajoStock  = items.filter(p => p.stock_actual > 0 && p.stock_actual <= 3).length;
  const aPedir     = items.filter(p => p.comprometido > p.stock_actual);

  const confirmarCarga = async ({ cantidad, tipo, nota }) => {
    setGuardando(true);
    try {
      await api.ajustarStock({
        id_producto:  modalProd.id,
        nombre:       modalProd.nombre,
        variable:     modalProd.variable || "",
        observacion:  modalProd.observacion || "",
        cantidad,
        tipo,
        nota,
      });
      showToast("✅ Stock actualizado");
      setModalProd(null);
      cargar();
    } catch(e) {
      showToast("❌ " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const colorStock = (s) => {
    if (s <= 0)  return { color:"var(--red)",   bg:"var(--red-bg)" };
    if (s <= 3)  return { color:"var(--amber)", bg:"var(--amber-bg)" };
    return              { color:"var(--green)",  bg:"var(--green-bg)" };
  };

  return (
    <div style={{ padding:"20px", maxWidth:1400, margin:"0 auto" }} className="page-pad">
      <style>{skeletonCSS}</style>
      <ModalCargaStock prod={modalProd} onConfirm={confirmarCarga} onClose={() => setModalProd(null)} />

      {/* Resumen */}
      {!loading && items.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
          {[
            { label:"Sin stock",     val:sinStock,          color:"var(--red)",   icon:"🔴", filtro:"sin-stock" },
            { label:"Stock bajo",    val:bajoStock,         color:"var(--amber)", icon:"🟡", filtro:"bajo" },
            { label:"A pedir hoy",   val:aPedir.length,     color:"var(--rose)",  icon:"📋", filtro:"todos" },
          ].map(s => (
            <button key={s.label} onClick={() => setFiltro(f => f === s.filtro && s.filtro !== "todos" ? "todos" : s.filtro)} style={{
              background:"var(--surface-2)", borderRadius:12,
              border:`1px solid var(--border)`, padding:"14px 12px",
              textAlign:"left", cursor:"pointer",
            }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>{s.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* A pedir por cliente */}
      {!loading && aPedir.length > 0 && (
        <div style={{ background:"var(--orange-bg)", border:"1px solid var(--orange)", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--orange)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>
            📋 Necesitás pedir para cubrir pedidos
          </div>
          {aPedir.map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text-2)", padding:"4px 0", borderBottom: i<aPedir.length-1 ? "1px solid rgba(255,107,53,0.15)" : "none" }}>
              <span>#{p.id} {p.nombre}{p.variable ? ` (${p.variable})` : ""}{p.observacion ? ` — ${p.observacion}` : ""}</span>
              <span style={{ color:"var(--orange)", fontWeight:700 }}>
                Tenés {p.stock_actual}, necesitás {p.comprometido} (+{p.comprometido - p.stock_actual})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Buscador + filtros */}
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)" }}>🔍</span>
          <input type="text" placeholder="Buscar producto..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ ...S.input, paddingLeft:36 }} />
        </div>
        <button onClick={cargar} style={{
          padding:"10px 14px", background:"var(--surface-3)",
          border:"1px solid var(--border)", borderRadius:10,
          color:"var(--muted-2)", cursor:"pointer", fontSize:16,
        }}>🔄</button>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {[["todos","Todos"],["sin-stock","Sin stock"],["bajo","Stock bajo"],["ok","✓ OK"]].map(([id,lbl]) => (
          <button key={id} onClick={() => setFiltro(id)} style={{
            padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap", border:"1px solid",
            borderColor: filtro===id ? "var(--rose)" : "var(--border)",
            background:  filtro===id ? "var(--rose-soft)" : "var(--surface-3)",
            color:       filtro===id ? "var(--rose)" : "var(--muted-2)",
          }}>{lbl}</button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        Array.from({length:6}).map((_,i) => <SkeletonCard key={i} lines={2}/>)
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:"50px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📦</div>
          <p>Sin productos{busqueda ? " para esa búsqueda" : ""}</p>
        </div>
      ) : filtrados.map(p => {
        const cs  = colorStock(p.stock_actual);
        const exp = expandido === p.id;
        return (
          <div key={p.id} style={S.card}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}
              onClick={() => setExpandido(exp ? null : p.id)}>

              {/* Stock badge */}
              <div style={{
                minWidth:52, height:52, borderRadius:12,
                background:cs.bg, border:`1px solid ${cs.color}`,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:cs.color, lineHeight:1 }}>
                  {p.stock_actual}
                </div>
                <div style={{ fontSize:9, color:cs.color, opacity:0.7, marginTop:1 }}>uds</div>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                  <span style={{ fontSize:10, color:"var(--rose)", background:"var(--rose-soft)", padding:"1px 7px", borderRadius:20, fontWeight:700 }}>
                    #{p.id}
                  </span>
                  {p.comprometido > 0 && (
                    <span style={{ fontSize:10, color:"var(--amber)", background:"var(--amber-bg)", padding:"1px 7px", borderRadius:20, fontWeight:700 }}>
                      {p.comprometido} comprometidos
                    </span>
                  )}
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--text)", lineHeight:1.3 }}>
                  {p.nombre}{p.variable ? ` (${p.variable})` : ""}
                </div>
                {p.observacion && (
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>📝 {p.observacion}</div>
                )}
                <div style={{ fontSize:11, color:"var(--muted-2)", marginTop:2 }}>
                  Disponible: <span style={{ color:cs.color, fontWeight:700 }}>{Math.max(0, p.stock_actual - p.comprometido)}</span>
                  {p.vendido_total > 0 && <span> · Vendidos: {p.vendido_total}</span>}
                </div>
              </div>

              {/* Acción */}
              <button onClick={e => { e.stopPropagation(); setModalProd(p); }} style={{
                padding:"8px 14px", background:"var(--rose)",
                border:"none", borderRadius:8, color:"white",
                fontWeight:700, fontSize:12, cursor:"pointer",
                boxShadow:"var(--shadow-rose)", flexShrink:0,
              }}>
                + Stock
              </button>
            </div>

            {/* Expandido: historial de movimientos */}
            {exp && p.movimientos?.length > 0 && (
              <div style={{ borderTop:"1px solid var(--border)", padding:"12px 16px", background:"var(--surface-3)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>
                  Últimos movimientos
                </div>
                {p.movimientos.slice(0,5).map((m,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom: i<Math.min(p.movimientos.length,5)-1 ? "1px solid var(--border)" : "none", fontSize:12 }}>
                    <div>
                      <span style={{ color: m.cantidad > 0 ? "var(--green)" : "var(--red)", fontWeight:700, marginRight:6 }}>
                        {m.cantidad > 0 ? "+" : ""}{m.cantidad}
                      </span>
                      <span style={{ color:"var(--text-2)" }}>{m.tipo}</span>
                      {m.nota && <span style={{ color:"var(--muted)", marginLeft:6 }}>· {m.nota}</span>}
                    </div>
                    <span style={{ color:"var(--muted)" }}>{m.fecha}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <style>{`@media(max-width:768px){.page-pad{padding:12px !important}}`}</style>
    </div>
  );
}
