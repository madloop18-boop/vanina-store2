import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { SkeletonStat, SkeletonRow, SkeletonCard, skeletonCSS } from "../ui/Skeleton";

function fmt(n) { return Number(n||0).toLocaleString("es-AR"); }

function StatCard({ label, value, sub, gradient, icon, prefix="$" }) {
  return (
    <div style={{
      background:"var(--surface-2)", borderRadius:14,
      border:"1px solid var(--border)", padding:"18px 18px",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", top:-20, right:-20,
        width:80, height:80, borderRadius:"50%",
        background:gradient, opacity:0.08,
      }} />
      <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, lineHeight:1, marginBottom:6,
        background:gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
      }}>
        {prefix}{fmt(value)}
      </div>
      <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:11, color:"var(--muted-2)" }}>{sub}</div>
    </div>
  );
}

export default function Dashboard({ showToast, onNav }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try { setData(await api.getDashboard()); }
    catch(e) { showToast("❌ " + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const totalTipo = data ? data.minorista + data.mayorista : 0;
  const pctMin    = totalTipo > 0 ? Math.round(data.minorista / totalTipo * 100) : 0;
  const pctMay    = 100 - pctMin;

  return (
    <div style={{ padding:"20px", maxWidth:860, margin:"0 auto" }} className="page-pad">
      <style>{skeletonCSS}</style>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }} className="stats-grid">
        {loading ? Array.from({length:4}).map((_,i)=><SkeletonStat key={i}/>) : (
          <>
            <StatCard label="Hoy"         value={data?.hoy?.total}  sub={`${data?.hoy?.ventas??0} ventas`}   gradient="linear-gradient(135deg,#FF2D8A,#CC1F6B)" icon="⚡" />
            <StatCard label="Este mes"    value={data?.mes?.total}  sub={`${data?.mes?.ventas??0} ventas`}   gradient="linear-gradient(135deg,#A855F7,#7C3AED)" icon="📅" />
            <StatCard label="Ganancia"    value={data?.ganancia}    sub="estimada este mes"                  gradient="linear-gradient(135deg,#00E5A0,#00B37D)"  icon="📈" />
            <StatCard label="Deuda total" value={data?.deuda}       sub="pendiente de cobro"                 gradient="linear-gradient(135deg,#FF4D4D,#CC0000)"  icon="⚠️" />
          </>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }} className="two-col">

        {/* Ventas por tipo */}
        <div style={{ background:"var(--surface-2)", borderRadius:14, border:"1px solid var(--border)", padding:18 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:18 }}>
            Ventas por tipo
          </div>
          {loading ? <SkeletonCard lines={2}/> : (
            [
              {label:"Minorista", val:data?.minorista, pct:pctMin, color:"#FF2D8A"},
              {label:"Mayorista", val:data?.mayorista, pct:pctMay, color:"#A855F7"},
            ].map(t => (
              <div key={t.label} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"var(--text-2)" }}>{t.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:t.color }}>${fmt(t.val)}</span>
                </div>
                <div style={{ height:4, borderRadius:10, background:"var(--surface-4)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:10, background:t.color, width:t.pct+"%", transition:"width 0.8s ease", opacity:0.8 }} />
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:3 }}>{t.pct}%</div>
              </div>
            ))
          )}
        </div>

        {/* Top deudores */}
        <div style={{ background:"var(--surface-2)", borderRadius:14, border:"1px solid var(--border)", padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px" }}>
              Top deudores
            </div>
            <button onClick={() => onNav?.("pagos")} style={{ fontSize:11, color:"var(--rose)", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
              Ver todos →
            </button>
          </div>
          {loading ? Array.from({length:4}).map((_,i)=><SkeletonRow key={i}/>) : (
            data?.topDeudores?.length ? data.topDeudores.map((d,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom: i<data.topDeudores.length-1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{
                    width:28, height:28, borderRadius:"50%",
                    background:"var(--rose-soft)", border:"1px solid var(--rose-glow)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:700, color:"var(--rose)",
                  }}>
                    {d.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize:13, color:"var(--text-2)" }}>{d.nombre}</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--red)", background:"var(--red-bg)", padding:"2px 8px", borderRadius:20 }}>
                  ${fmt(d.saldo)}
                </span>
              </div>
            )) : <div style={{ color:"var(--muted)", fontSize:13, textAlign:"center", padding:"20px 0" }}>Sin deudas 🎉</div>
          )}
        </div>
      </div>

      {/* Top productos */}
      <div style={{ background:"var(--surface-2)", borderRadius:14, border:"1px solid var(--border)", padding:18, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:14 }}>
          Top productos más vendidos
        </div>
        {loading ? Array.from({length:5}).map((_,i)=><SkeletonRow key={i}/>) : (
          data?.topProductos?.length ? data.topProductos.map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i<data.topProductos.length-1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{
                  fontSize:18, fontWeight:700, color:"var(--border-2)",
                  width:24, textAlign:"right", fontFamily:"'Playfair Display',serif",
                }}>{i+1}</span>
                <span style={{ fontSize:13, color:"var(--text-2)" }}>{p.nombre}</span>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--rose)", background:"var(--rose-soft)", padding:"3px 10px", borderRadius:20 }}>
                {p.cantidad} vendidos
              </span>
            </div>
          )) : <div style={{ color:"var(--muted)", fontSize:13 }}>Sin datos todavía</div>
        )}
      </div>

      <button onClick={cargar} disabled={loading} style={{
        padding:"11px 20px", background:"var(--rose)", color:"white",
        border:"none", borderRadius:10, fontWeight:700, fontSize:13,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        boxShadow: loading ? "none" : "var(--shadow-rose)",
        display:"flex", alignItems:"center", gap:8,
      }}>
        {loading ? "Cargando..." : "🔄 Actualizar datos"}
      </button>
    </div>
  );
}
