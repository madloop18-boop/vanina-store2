import { useState, useEffect } from "react";
import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { api } from "../../lib/api";

function fmt(n) { return Number(n||0).toLocaleString("es-AR"); }

const inp = {
  width:"100%", padding:"11px 14px",
  border:"1px solid var(--border)", borderRadius:10,
  fontSize:14, background:"var(--surface-3)", color:"var(--text)",
  outline:"none",
};

export default function Productos({ showToast }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState({ id:"", nombre:"", variable:"", precio:"" });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try { setProductos((await api.getProductos()).productos || []); }
    catch(e) { showToast("❌ " + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = productos.filter(p =>
    String(p.id).includes(busqueda) ||
    (p.nombre||"").toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.variable||"").toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ id:"", nombre:"", variable:"", precio:"" });
    setModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p.id);
    setForm({ id:p.id, nombre:p.nombre, variable:p.variable||"", precio:p.precio_lista });
    setModal(true);
  };

  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!form.id || !form.nombre) { showToast("⚠️ ID y nombre son obligatorios"); return; }
    setGuardando(true);
    try {
      if (editando) {
        await api.editarProducto({ id_original:editando, id_producto:form.id, nombre:form.nombre, variable:form.variable, precio_lista:parseFloat(form.precio)||0 });
        showToast("✅ Producto actualizado");
      } else {
        await api.agregarProducto({ id_producto:form.id, nombre:form.nombre, variable:form.variable, precio_lista:parseFloat(form.precio)||0 });
        showToast("✅ Producto agregado");
      }
      cerrar(); cargar();
    } catch(e) { showToast("❌ " + e.message); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!confirm(`¿Eliminar producto #${id}?`)) return;
    try { await api.eliminarProducto({ id_producto:id }); showToast("🗑️ Eliminado"); cargar(); }
    catch(e) { showToast("❌ " + e.message); }
  };

  return (
    <div style={{ padding:"20px", maxWidth:860, margin:"0 auto" }} className="page-pad">
      <style>{skeletonCSS}</style>

      {/* Modal drawer */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, zIndex:999,
          background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)",
          display:"flex", alignItems:"flex-end", justifyContent:"center",
        }} onClick={cerrar}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"var(--surface-2)", borderRadius:"20px 20px 0 0",
            width:"100%", maxWidth:480, padding:"24px 20px 32px",
            border:"1px solid var(--border)", borderBottom:"none",
            animation:"slideUp 0.25s ease",
          }}>
            <div style={{ width:36, height:3, borderRadius:2, background:"var(--border-2)", margin:"0 auto 20px" }} />
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:20 }}>
              {editando ? "✏️ Editar producto" : "➕ Nuevo producto"}
            </div>

            {[
              { label:"ID Producto", key:"id", ph:"Ej: 230", type:"text" },
              { label:"Nombre",      key:"nombre", ph:"Ej: PERFUME LUNA 50ml", type:"text" },
              { label:"Variable (opcional)", key:"variable", ph:"Ej: Rojo, Talle M...", type:"text" },
              { label:"Precio de lista", key:"precio", ph:"0", type:"number" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:6 }}>
                  {f.label}
                </label>
                <input type={f.type} placeholder={f.ph} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]:e.target.value }))}
                  style={inp} />
              </div>
            ))}

            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={cerrar} style={{ flex:1, padding:"13px", background:"var(--surface-3)", border:"1px solid var(--border)", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", color:"var(--muted-2)" }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ flex:2, padding:"13px", background:"var(--rose)", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", color:"white", opacity:guardando?0.7:1, boxShadow:"var(--shadow-rose)" }}>
                {guardando ? "Guardando..." : editando ? "✓ Actualizar" : "✓ Guardar"}
              </button>
            </div>
          </div>
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        </div>
      )}

      {/* Barra */}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", fontSize:16 }}>🔍</span>
          <input type="text" placeholder="Buscar por ID o nombre..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ ...inp, paddingLeft:38 }} />
        </div>
        <button onClick={abrirNuevo} style={{
          padding:"11px 18px", background:"var(--rose)", color:"white",
          border:"none", borderRadius:10, fontWeight:700, fontSize:14,
          cursor:"pointer", whiteSpace:"nowrap", boxShadow:"var(--shadow-rose)",
        }}>
          + Nuevo
        </button>
      </div>

      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:12 }}>
        {loading ? "Cargando..." : `${filtrados.length} producto${filtrados.length!==1?"s":""}`}
      </div>

      {/* Grilla */}
      {loading ? (
        Array.from({length:8}).map((_,i) => <SkeletonCard key={i} lines={2}/>)
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📦</div>
          <p>Sin productos</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
          {filtrados.map(p => (
            <div key={p.id} style={{
              background:"var(--surface-2)", borderRadius:14,
              padding:"14px 16px", border:"1px solid var(--border)",
              display:"flex", flexDirection:"column", gap:6,
              transition:"border-color 0.15s",
            }}>
              {/* ID badge */}
              <div style={{ fontSize:10, fontWeight:700, color:"var(--rose)", background:"var(--rose-soft)", display:"inline-block", padding:"2px 8px", borderRadius:20, alignSelf:"flex-start", border:"1px solid var(--rose-glow)" }}>
                #{p.id}
              </div>

              {/* Nombre */}
              <div style={{ fontWeight:700, fontSize:14, color:"var(--text)", lineHeight:1.3 }}>{p.nombre}</div>
              {p.variable && <div style={{ fontSize:12, color:"var(--muted-2)" }}>{p.variable}</div>}

              {/* Precio + acciones */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"var(--rose)" }}>
                  ${fmt(p.precio_lista)}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => abrirEditar(p)} style={{
                    width:30, height:30, border:"1px solid var(--border)",
                    background:"var(--surface-3)", borderRadius:8,
                    fontSize:13, cursor:"pointer", color:"var(--text-2)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>✏️</button>
                  <button onClick={() => eliminar(p.id)} style={{
                    width:30, height:30, background:"var(--red-bg)",
                    border:"1px solid rgba(255,77,77,0.2)", borderRadius:8,
                    fontSize:13, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
