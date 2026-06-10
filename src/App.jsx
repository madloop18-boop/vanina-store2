import { useState, useEffect } from "react";
import Toast from "./components/ui/Toast";
import { useToast } from "./hooks/useToast";

import Dashboard      from "./components/tabs/Dashboard";
import NuevaVenta     from "./components/tabs/NuevaVenta";
import Pedidos        from "./components/tabs/Pedidos";
import Productos      from "./components/tabs/Productos";
import Stock          from "./components/tabs/Stock";
import Pagos          from "./components/tabs/Pagos";
import HistorialPagos from "./components/tabs/HistorialPagos";
import VentasDirectas from "./components/tabs/VentasDirectas";
import VistaOperaciones from "./components/tabs/VistaOperaciones";

const TABS = [
  { id:"dashboard", label:"Inicio",    icon:"⚡" },
  { id:"venta",     label:"Venta",     icon:"＋" },
  { id:"pedidos",   label:"Pedidos",   icon:"📦" },
  { id:"ventas",    label:"Ventas",    icon:"🛍️" },
  { id:"productos", label:"Catálogo",  icon:"📋" },
  { id:"stock",     label:"Stock",     icon:"📊" },
  { id:"pagos",     label:"Pagos",     icon:"💳" },
  { id:"historial", label:"Historial", icon:"🕐" },
];

function LoadingScreen({ visible }) {
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"#0D0D0F",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column",
      transition:"opacity 0.8s ease, visibility 0.8s ease",
      opacity: visible ? 1 : 0, visibility: visible ? "visible" : "hidden",
    }}>
      {/* Canvas de partículas */}
      <canvas id="vs-particles" style={{ position:"fixed", inset:0, pointerEvents:"none" }} />

      {/* Contenido central */}
      <div style={{ position:"relative", zIndex:10, textAlign:"center" }}>

        {/* Anillo giratorio + logo */}
        <div style={{
          width:100, height:100, borderRadius:"50%",
          margin:"0 auto 32px",
          position:"relative",
          display:"flex", alignItems:"center", justifyContent:"center",
          animation:"vsFadeUp 0.8s ease 0.3s both",
        }}>
          {/* Anillo exterior */}
          <div style={{
            position:"absolute", inset:-3, borderRadius:"50%",
            background:"conic-gradient(#FF2D8A,#A855F7,#FF2D8A)",
            animation:"vsSpin 2s linear infinite",
          }} />
          {/* Máscara interior */}
          <div style={{ position:"absolute", inset:2, borderRadius:"50%", background:"#0D0D0F" }} />
          {/* Logo */}
          <div style={{
            position:"relative", zIndex:1,
            width:86, height:86, borderRadius:"50%",
            background:"linear-gradient(135deg,rgba(255,45,138,0.12),rgba(168,85,247,0.12))",
            border:"1px solid rgba(255,45,138,0.25)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:38,
          }}>🌸</div>
        </div>

        {/* Texto */}
        <div style={{
          fontSize:10, letterSpacing:"6px", textTransform:"uppercase",
          color:"#6B6B7A", marginBottom:10,
          animation:"vsFadeUp 0.6s ease 0.6s both",
        }}>
          Sistema de ventas
        </div>

        <div style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:38, fontWeight:700, lineHeight:1,
          background:"linear-gradient(135deg,#FF2D8A,#C084FC,#FF2D8A)",
          backgroundSize:"200%",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"vsFadeUp 0.6s ease 0.7s both, vsShimmer 3s ease infinite 1.2s",
        }}>
          Vanina Store
        </div>

        <div style={{
          fontSize:13, color:"#6B6B7A", marginTop:10,
          fontFamily:"'Playfair Display',serif", fontStyle:"italic",
          animation:"vsFadeUp 0.6s ease 0.9s both",
        }}>
          {saludo} 🌸
        </div>

        {/* Barra de carga */}
        <div style={{
          margin:"40px auto 0", width:200, height:1,
          background:"#2E2E38", position:"relative", overflow:"visible",
          animation:"vsFadeUp 0.6s ease 1s both",
        }}>
          <div style={{
            height:1,
            background:"linear-gradient(90deg,#FF2D8A,#A855F7)",
            animation:"vsLoadBar 1.5s cubic-bezier(0.4,0,0.2,1) 0.5s forwards",
            width:0,
          }} />
          <div style={{
            position:"absolute", top:-3, left:-60,
            height:7, width:60,
            background:"radial-gradient(ellipse,rgba(255,45,138,0.5),transparent)",
            animation:"vsGlowSlide 1.5s cubic-bezier(0.4,0,0.2,1) 0.5s forwards",
          }} />
        </div>

        {/* Puntos pulsantes */}
        <div style={{
          marginTop:20, display:"flex", gap:6, justifyContent:"center",
          animation:"vsFadeUp 0.6s ease 1.1s both",
        }}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <div key={i} style={{
              width:4, height:4, borderRadius:"50%",
              background:"#FF2D8A", opacity:0.3,
              animation:`vsPulse 1.2s ease ${delay}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes vsSpin    { to { transform: rotate(360deg) } }
        @keyframes vsFadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes vsLoadBar { to { width: 100% } }
        @keyframes vsGlowSlide { to { left: 140px } }
        @keyframes vsPulse   { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes vsShimmer { 0%{background-position:0%} 50%{background-position:100%} 100%{background-position:0%} }
      `}</style>
    </div>
  );
}



export default function App() {
  const esVistaOperaciones = window.location.pathname === "/operaciones";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading]     = useState(true);
  const { toast, showToast }      = useToast();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);

    // Partículas en pantalla de carga
    const canvas = document.getElementById("vs-particles");
    if (!canvas) return () => clearTimeout(t);
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? "#FF2D8A" : "#A855F7",
      life: 1,
      decay: Math.random() * 0.003 + 0.001,
    }));

    let raf;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 1;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha * p.life;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, []);

  // Vista de operaciones: ahora retornamos después de declarar todos los hooks,
  // respetando las rules-of-hooks (orden de hooks estable entre renders).
  if (esVistaOperaciones) {
    return <VistaOperaciones />;
  }

  const screens = {
    dashboard: <Dashboard      showToast={showToast} onNav={setActiveTab} />,
    venta:     <NuevaVenta     showToast={showToast} />,
    pedidos:   <Pedidos        showToast={showToast} />,
    ventas:    <VentasDirectas showToast={showToast} />,
    productos: <Productos      showToast={showToast} />,
    stock:     <Stock          showToast={showToast} />,
    pagos:     <Pagos          showToast={showToast} />,
    historial: <HistorialPagos showToast={showToast} />,
  };

  const activeInfo = TABS.find(t => t.id === activeTab);

  return (
    <div style={{ minHeight:"100vh", background:"var(--ink)", fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet" />
      <LoadingScreen visible={loading} />

      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* ── SIDEBAR desktop ── */}
        <aside className="hide-mobile" style={{
          width:220, flexShrink:0,
          background:"var(--surface)",
          borderRight:"1px solid var(--border)",
          display:"flex", flexDirection:"column",
          position:"fixed", top:0, left:0, bottom:0, zIndex:50,
        }}>
          {/* Branding */}
          <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:"linear-gradient(135deg,#FF2D8A,#CC1F6B)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, boxShadow:"0 0 16px rgba(255,45,138,0.3)",
              }}>🌸</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:"var(--text)", lineHeight:1.1 }}>
                  Vanina Store
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>Sistema de ventas</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding:"10px 8px", flex:1, overflowY:"auto" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"9px 12px", borderRadius:"10px", border:"none",
                  background: active ? "var(--rose-soft)" : "transparent",
                  color: active ? "var(--rose)" : "var(--muted-2)",
                  fontWeight: active ? 700 : 400,
                  fontSize:13, cursor:"pointer", marginBottom:1,
                  transition:"all 0.15s", textAlign:"left",
                  borderLeft: active ? "2px solid var(--rose)" : "2px solid transparent",
                }}>
                  <span style={{ fontSize:16, lineHeight:1 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", fontSize:10, color:"var(--muted)" }}>
            v2.0 · MADLOOP
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main-wrap" style={{ flex:1, marginLeft:220, minHeight:"100vh", display:"flex", flexDirection:"column" }}>

          {/* Topbar desktop */}
          <div className="hide-mobile" style={{
            height:56, background:"var(--surface)",
            borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"0 24px", position:"sticky", top:0, zIndex:40,
          }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>
                {activeInfo?.icon} {activeInfo?.label}
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>
                {new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
              </div>
            </div>
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"linear-gradient(135deg,#FF2D8A,#A855F7)",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white", fontWeight:700, fontSize:13,
              boxShadow:"0 0 16px rgba(255,45,138,0.3)",
            }}>V</div>
          </div>

          {/* Topbar mobile */}
          <div className="hide-desktop" style={{
            height:50, background:"var(--surface)",
            borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", justifyContent:"center",
            position:"sticky", top:0, zIndex:40,
          }}>
            <div style={{
              fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700,
              background:"linear-gradient(135deg,#FF2D8A,#A855F7)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              display:"flex", alignItems:"center", gap:6,
            }}>
              🌸 Vanina Store
            </div>
          </div>

          {/* Contenido */}
          <div style={{ flex:1, paddingBottom:68 }}>
            {screens[activeTab]}
          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV mobile ── */}
      <div className="hide-desktop" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:90,
        background:"var(--surface)",
        borderTop:"1px solid var(--border)",
        display:"grid", gridTemplateColumns:"repeat(8,1fr)",
        paddingBottom:"env(safe-area-inset-bottom,6px)",
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:"7px 2px 5px", border:"none", background:"none",
              color: active ? "var(--rose)" : "var(--muted)",
              fontSize:8, fontWeight: active ? 700 : 400,
              cursor:"pointer", position:"relative", transition:"color 0.15s",
            }}>
              {active && <div style={{
                position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                width:20, height:2, borderRadius:"0 0 2px 2px",
                background:"var(--rose)",
              }} />}
              <span style={{ fontSize:18, marginBottom:2, lineHeight:1 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <Toast toast={toast} />
    </div>
  );
}