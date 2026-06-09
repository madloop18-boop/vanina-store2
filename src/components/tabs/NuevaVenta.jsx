import { SkeletonCard, SkeletonRow, skeletonCSS } from "../ui/Skeleton";
import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const PCTS_MIN  = [0,5,10,15,20,25,30,35,40,45,50,55];
const PCTS_MAY  = [0,5,10,15,20,25,30,35,40,45,50,55];
const PCTS_COST = [0,5,10,15,20,25,30,35,40,45,50,55,60];
const METODOS   = [
  { id:"Efectivo",      icon:"💵", label:"Efectivo" },
  { id:"Transferencia", icon:"📲", label:"Transf." },
  { id:"Débito",        icon:"💳", label:"Débito" },
  { id:"Crédito",       icon:"💳", label:"Crédito" },
  { id:"Mercado Pago",  icon:"🔵", label:"MercadoPago" },
  { id:"Fiado",         icon:"🤝", label:"Fiado" },
];

const estadoInicial = () => ({
  esPedido: false, tipoCliente: "Minorista", descGlobal: 0,
  metodoPago: "Efectivo", productos: [], nextId: 0,
});

export default function NuevaVenta({ showToast }) {
  const [st, setSt]                   = useState(estadoInicial());
  const [cacheProd, setCacheProd]     = useState([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTel, setClienteTel]   = useState("");
  const [nota, setNota]               = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [sugerenciasCliente, setSugerenciasCliente] = useState([]);
  const [sugerenciasProd, setSugerenciasProd]       = useState([]);
  const [guardando, setGuardando]     = useState(false);
  const [exito, setExito]             = useState(null);
  const clienteTimer = useRef(null);
  const prodTimer    = useRef(null);

  useEffect(() => {
    api.getProductos().then(r => setCacheProd(r.productos || [])).catch(() => {});
  }, []);

  const onClienteInput = (v) => {
    setClienteNombre(v);
    clearTimeout(clienteTimer.current);
    if (v.length < 2) { setSugerenciasCliente([]); return; }
    clienteTimer.current = setTimeout(async () => {
      try { const r = await api.buscarCliente(v); setSugerenciasCliente(r.clientes || []); } catch {}
    }, 300);
  };

  const onProdInput = (v) => {
    clearTimeout(prodTimer.current);
    if (!v) { setSugerenciasProd([]); return; }
    prodTimer.current = setTimeout(() => {
      const ql = v.toLowerCase();
      setSugerenciasProd(cacheProd.filter(p =>
        String(p.id).includes(v) || p.nombre.toLowerCase().includes(ql) ||
        (p.variable && p.variable.toLowerCase().includes(ql))
      ).slice(0, 8));
    }, 200);
  };

  const agregarProducto = (p) => {
    // Construir versiones disponibles: v1 = precio_lista, v2+ desde versiones
    const versiones = [];
    if (p.precio_lista > 0) {
      versiones.push({ etiqueta: "v1", precio: p.precio_lista });
    }
    if (p.versiones && p.versiones.length > 0) {
      p.versiones.forEach(v => {
        if (v.precio > 0 && v.etiqueta !== "v1") {
          versiones.push({ etiqueta: v.etiqueta || "v2", precio: v.precio });
        }
      });
    }
    const precioBase = p.precio_lista || 0;
    setSt(s => ({ ...s, nextId: s.nextId + 1, productos: [...s.productos, {
      uid: s.nextId + 1, id: p.id, nombre: p.nombre, variable: p.variable || "",
      precioLista: precioBase,
      precioListaBase: precioBase, // precio base seleccionado actualmente
      versionesDisponibles: versiones,
      versionSeleccionada: "v1",
      precioCostoBase: p.precio_costo,
      pctMin: 0, precioMin: precioBase, pctMay: 0, precioMay: precioBase,
      precioVenta: precioBase, pctCosto: 0, precioCosto: p.precio_costo,
      cant: 1, esPersonalizado: false, observacion: "",
    }]}));
    setSugerenciasProd([]);
  };

  const agregarPersonalizado = () => {
    setSt(s => ({ ...s, nextId: s.nextId + 1, productos: [...s.productos, {
      uid: s.nextId + 1, id: "CUSTOM-" + (s.nextId + 1), nombre: "Producto Personalizado",
      variable: "", precioLista: 0, precioListaBase: 0, versionesDisponibles: [], versionSeleccionada: "v1",
      precioCostoBase: 0, pctMin: 0, precioMin: 0,
      pctMay: 0, precioMay: 0, precioVenta: 0, pctCosto: 0, precioCosto: "",
      cant: 1, esPersonalizado: true, observacion: "",
    }]}));
  };

  const updateProd   = (uid, changes) => setSt(s => ({ ...s, productos: s.productos.map(p => p.uid === uid ? { ...p, ...changes } : p) }));
  const quitarProd   = (uid) => setSt(s => ({ ...s, productos: s.productos.filter(p => p.uid !== uid) }));
  const cambiarCant  = (uid, delta) => setSt(s => ({ ...s, productos: s.productos.map(p => p.uid === uid ? { ...p, cant: Math.max(1, p.cant + delta) } : p) }));

  // ✅ Cambiar versión de precio base
  const cambiarVersion = (uid, etiqueta) => setSt(s => ({ ...s, productos: s.productos.map(p => {
    if (p.uid !== uid) return p;
    const ver = (p.versionesDisponibles || []).find(v => v.etiqueta === etiqueta);
    if (!ver) return p;
    const nuevaBase = ver.precio;
    const precioMin   = Math.round(nuevaBase * (1 - p.pctMin / 100));
    const precioMay   = Math.round(precioMin * (1 - p.pctMay / 100));
    const precioCosto = Math.round(precioMin * (1 - p.pctCosto / 100));
    return {
      ...p,
      versionSeleccionada: etiqueta,
      precioListaBase: nuevaBase,
      precioLista: nuevaBase,
      precioMin, precioMay, precioCosto,
      precioVenta: s.tipoCliente === "Mayorista" ? precioMay : precioMin,
    };
  })}));

  const setPctMin = (uid, pct) => setSt(s => ({ ...s, productos: s.productos.map(p => {
    if (p.uid !== uid) return p;
    const base = p.precioListaBase || p.precioLista;
    const precioMin = Math.round(base * (1 - pct / 100));
    const precioMay = Math.round(precioMin * (1 - p.pctMay / 100));
    const precioCosto = Math.round(precioMin * (1 - p.pctCosto / 100));
    return { ...p, pctMin: pct, precioMin, precioMay, precioCosto, precioVenta: s.tipoCliente === "Mayorista" ? precioMay : precioMin };
  })}));

  const setPctMay = (uid, pct) => setSt(s => ({ ...s, productos: s.productos.map(p => {
    if (p.uid !== uid) return p;
    const precioMay = Math.round(p.precioMin * (1 - pct / 100));
    return { ...p, pctMay: pct, precioMay, precioVenta: precioMay };
  })}));

  const setPctCosto = (uid, pct) => setSt(s => ({ ...s, productos: s.productos.map(p => {
    if (p.uid !== uid) return p;
    return { ...p, pctCosto: pct, precioCosto: Math.round(p.precioMin * (1 - pct / 100)) };
  })}));

  const setTipoCliente = (tipo) => setSt(s => ({ ...s, tipoCliente: tipo, productos: s.productos.map(p => ({ ...p, precioVenta: tipo === "Mayorista" ? p.precioMay : p.precioMin })) }));
  const setTipoOperacion = (esPedido) => { setSt(s => ({ ...s, esPedido, metodoPago: esPedido && s.metodoPago === "Fiado" ? "Efectivo" : s.metodoPago })); setMontoPagado(""); };

  const subtotal = st.productos.reduce((s, p) => s + p.precioVenta * p.cant, 0);
  const descAmt  = Math.round(subtotal * st.descGlobal / 100);
  const total    = subtotal - descAmt;
  const monto    = st.metodoPago === "Fiado" ? 0 : (montoPagado !== "" ? parseFloat(montoPagado) || 0 : 0);
  const saldo    = Math.max(0, total - monto);

  const registrar = async () => {
    const nombreStr = String(clienteNombre || "").trim();
    const telStr    = String(clienteTel    || "").trim();
    const notaStr   = String(nota          || "").trim();

    if (!nombreStr)           { showToast("⚠️ Ingresá el nombre del cliente"); return; }
    if (!telStr)              { showToast("⚠️ Ingresá el teléfono"); return; }
    if (!st.productos.length) { showToast("⚠️ Agregá al menos un producto"); return; }
    const sinCosto = st.productos.some(p => !p.precioCosto || p.precioCosto === 0);
    if (sinCosto) { showToast("⚠️ Completá el precio de costo de todos los productos"); return; }

    const montoPag  = st.esPedido
      ? (parseFloat(montoPagado) || 0)
      : (st.metodoPago === "Fiado" ? 0 : (montoPagado !== "" ? parseFloat(montoPagado) || 0 : 0));
    const saldoPend = Math.max(0, total - montoPag);

    setGuardando(true);
    try {
      await api.registrarVenta({
        es_pedido:       st.esPedido,
        cliente_nombre:  nombreStr,
        cliente_tel:     telStr,
        tipo_cliente:    st.tipoCliente,
        productos: st.productos.map(p => ({
          id_producto:      String(p.id           || ""),
          nombre:           String(p.nombre       || ""),
          variable:         String(p.variable     || ""),
          cantidad:         Number(p.cant)        || 1,
          precio_lista:     Number(p.precioListaBase || p.precioLista) || 0,
          pct_minorista:    Number(p.pctMin)      || 0,
          precio_minorista: Number(p.precioMin)   || 0,
          pct_mayorista:    Number(p.pctMay)      || 0,
          precio_mayorista: Number(p.precioMay)   || 0,
          precio_venta:     Number(p.precioVenta) || 0,
          desc_ind:         0,
          subtotal:         (Number(p.precioVenta) || 0) * (Number(p.cant) || 1),
          pct_costo:        Number(p.pctCosto)    || 0,
          precio_costo:     Number(p.precioCosto) || 0,
          observacion:      String(p.observacion  || ""),
        })),
        desc_global_pct: st.descGlobal  || 0,
        desc_global_amt: descAmt        || 0,
        total_final:     total          || 0,
        monto_pagado:    montoPag       || 0,
        saldo_pendiente: saldoPend      || 0,
        metodo_pago:     String(st.metodoPago || "Efectivo"),
        nota:            notaStr,
      });
      setExito({ clienteNombre: nombreStr, total, montoPag, saldoPend, esPedido: st.esPedido, productos: st.productos, descAmt, descGlobal: st.descGlobal });
    } catch (e) {
      showToast("❌ Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const nuevaVenta = () => {
    setSt(estadoInicial()); setClienteNombre(""); setClienteTel(""); setNota(""); setMontoPagado("");
    setSugerenciasCliente([]); setSugerenciasProd([]); setExito(null);
  };

  const card  = { background: "var(--surface-2)", borderRadius: 14, padding: 20, marginBottom: 14, border: "1px solid #F0D6E4", boxShadow: "0 1px 3px rgba(233,30,140,0.06)" };
  const label = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 };
  const input = { width: "100%", padding: "11px 16px", border: "1px solid #F0D6E4", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "var(--text)", background: "var(--surface-2)", outline: "none" };
  const sectionTitle = { fontSize: 11, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 };

  // PANTALLA ÉXITO
  if (exito) {
    return (
      <div style={{ padding: "40px 32px", maxWidth: 1400, margin: "0 auto", textAlign: "center" }} className="tab-padding">
        <div style={{ fontSize: 56, marginBottom: 16 }}>{exito.esPedido ? "📦" : "🎉"}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "var(--rose)", marginBottom: 8 }}>
          {exito.esPedido ? "¡Pedido registrado!" : "¡Venta registrada!"}
        </h2>
        <p style={{ color: "var(--muted-2)", marginBottom: 24 }}>Todo quedó guardado correctamente</p>
        <div style={{ background: "var(--surface-2)", borderRadius: 14, padding: 20, marginBottom: 24, border: "1px solid #F0D6E4", textAlign: "left" }}>
          <div style={{ fontWeight: 700, color: "var(--rose)", fontSize: 16, marginBottom: 12 }}>{exito.clienteNombre}</div>
          {exito.productos.map((p, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #F0D6E4", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>#{p.id} {p.nombre}{p.variable ? ` (${p.variable})` : ""} x{p.cant}</span>
                <span style={{ fontWeight: 600 }}>${fmt(p.precioVenta * p.cant)}</span>
              </div>
              {p.observacion && <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 2 }}>📝 {p.observacion}</div>}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, paddingTop: 12 }}>
            <span>Total</span><span>${fmt(exito.total)}</span>
          </div>
          {exito.esPedido
            ? <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--blue-bg)", borderRadius: 10, fontSize: 13, color: "var(--blue)" }}>
                {exito.montoPag > 0 ? `💵 Seña: $${fmt(exito.montoPag)} — Resta: $${fmt(exito.saldoPend)}` : `📦 A cobrar al entregar: $${fmt(exito.total)}`}
              </div>
            : exito.saldoPend > 0 && <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF3E8", borderRadius: 10, fontSize: 13, color: "#7A3800" }}>⚠️ Saldo pendiente: ${fmt(exito.saldoPend)}</div>
          }
        </div>
        <button onClick={nuevaVenta}
          style={{ padding: "14px 40px", background: "linear-gradient(135deg,#E91E8C,#B5006E)", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
          ➕ Nueva venta
        </button>
        <style>{`@media(max-width:768px){.tab-padding{padding:16px!important}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px 120px", maxWidth: 1400, margin: "0 auto" }} className="tab-padding">

      {/* TIPO OPERACIÓN */}
      <div style={card}>
        <div style={sectionTitle}>⚡ Tipo de operación</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[{ es: false, icon:"🛍️", label:"Venta directa", sub:"Entrega en el momento" },
            { es: true,  icon:"📦", label:"Pedido",         sub:"Lo entregás después" }].map(op => (
            <button key={String(op.es)} onClick={() => setTipoOperacion(op.es)} style={{
              padding: "14px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: "1.5px solid",
              borderColor: (!op.es && !st.esPedido) ? "var(--green)" : (op.es && st.esPedido) ? "var(--blue)" : "var(--border)",
              background:  (!op.es && !st.esPedido) ? "var(--green-bg)" : (op.es && st.esPedido) ? "var(--blue-bg)" : "var(--surface-2)",
            }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{op.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: (!op.es && !st.esPedido) ? "var(--green-dark)" : (op.es && st.esPedido) ? "var(--blue)" : "var(--muted-2)" }}>{op.label}</span>
              <span style={{ fontSize: 10, display: "block", color: "var(--muted-2)", marginTop: 2 }}>{op.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CLIENTE */}
      <div style={card}>
        <div style={sectionTitle}>👤 Datos del cliente</div>
        <div style={{ marginBottom: 12, position: "relative" }}>
          <label style={label}>Nombre y apellido</label>
          <input type="text" placeholder="Buscar o escribir nombre..." value={clienteNombre}
            onChange={e => onClienteInput(e.target.value)}
            onBlur={() => setTimeout(() => setSugerenciasCliente([]), 200)}
            style={input} />
          {sugerenciasCliente.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--surface-2)", border: "1px solid #F0D6E4", borderRadius: 12, boxShadow: "0 8px 32px rgba(233,30,140,0.12)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
              {sugerenciasCliente.map((c, i) => (
                <div key={i} onClick={() => { setClienteNombre(c.nombre); setClienteTel(c.tel); setSugerenciasCliente([]); }}
                  style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #F0D6E4", fontSize: 14 }}>
                  <div style={{ fontWeight: 700 }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{c.tel} · {c.tipo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Teléfono</label>
          <input type="tel" placeholder="11 1234-5678" value={clienteTel} onChange={e => setClienteTel(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Tipo de cliente</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ tipo:"Minorista", icon:"🛍️", ac:"var(--rose)", ab:"var(--rose-soft)" },
              { tipo:"Mayorista", icon:"📦", ac:"#4527A0", ab:"#EDE7F6" }].map(t => (
              <button key={t.tipo} onClick={() => setTipoCliente(t.tipo)} style={{
                padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", border: "1.5px solid",
                borderColor: st.tipoCliente === t.tipo ? t.ac : "var(--border)",
                background:  st.tipoCliente === t.tipo ? t.ab : "var(--surface-2)",
              }}>
                <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: st.tipoCliente === t.tipo ? t.ac : "var(--muted-2)" }}>{t.tipo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTOS */}
      <div style={card}>
        <div style={sectionTitle}>🛒 Productos</div>
        <div style={{ marginBottom: 12, position: "relative" }}>
          <label style={label}>Buscar por ID o nombre</label>
          <input type="text" placeholder="Ej: 123 o Perfume..."
            onChange={e => onProdInput(e.target.value)}
            onBlur={() => setTimeout(() => setSugerenciasProd([]), 200)}
            style={input} />
          {sugerenciasProd.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--surface-2)", border: "1px solid #F0D6E4", borderRadius: 12, boxShadow: "0 8px 32px rgba(233,30,140,0.12)", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
              {sugerenciasProd.map((p, i) => (
                <div key={i} onClick={() => agregarProducto(p)}
                  style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #F0D6E4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--rose)" }}>#{p.id}</div>
                    <div style={{ fontSize: 14 }}>{p.nombre}</div>
                    {p.variable && <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{p.variable}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 700, color: "var(--rose)" }}>${fmt(p.precio_lista)}</span>
                    {p.versiones && p.versiones.filter(v => v.etiqueta !== "v1").length > 0 && (
                      <div style={{ fontSize: 9, color: "var(--muted-2)", marginTop: 2 }}>
                        +{p.versiones.filter(v => v.etiqueta !== "v1").length} precio{p.versiones.filter(v => v.etiqueta !== "v1").length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {st.productos.map(p => (
          <ProductoRow key={p.uid} p={p} esMay={st.tipoCliente === "Mayorista"}
            onRemove={() => quitarProd(p.uid)} onCant={d => cambiarCant(p.uid, d)}
            onPctMin={pct => setPctMin(p.uid, pct)} onPctMay={pct => setPctMay(p.uid, pct)}
            onPctCosto={pct => setPctCosto(p.uid, pct)} onUpdate={changes => updateProd(p.uid, changes)}
            onCambiarVersion={etiqueta => cambiarVersion(p.uid, etiqueta)} />
        ))}

        <button onClick={agregarPersonalizado} style={{ width: "100%", padding: 12, border: "1.5px dashed #1565C0", borderRadius: 10, background: "var(--blue-bg)", color: "var(--blue)", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
          ✏️ Producto personalizado
        </button>
      </div>

      {/* DESCUENTO */}
      <div style={card}>
        <div style={sectionTitle}>🏷️ Descuento general</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[0,5,10,15,20,25,30,35,40,45,50].map(pct => (
            <button key={pct} onClick={() => setSt(s => ({ ...s, descGlobal: pct }))} style={{
              padding: "7px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
              borderColor: st.descGlobal === pct ? "var(--rose)" : "var(--border)",
              background:  st.descGlobal === pct ? "var(--rose)" : "var(--surface-2)",
              color:       st.descGlobal === pct ? "var(--surface-2)" : "var(--muted-2)",
            }}>{pct}%</button>
          ))}
        </div>
      </div>

      {/* PAGO */}
      <div style={card}>
        <div style={sectionTitle}>💳 Método de pago</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {METODOS.map(m => (
            <button key={m.id} disabled={st.esPedido && m.id === "Fiado"}
              onClick={() => setSt(s => ({ ...s, metodoPago: m.id }))} style={{
                padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", border: "1.5px solid",
                borderColor: st.metodoPago === m.id ? "var(--rose)" : "var(--border)",
                background:  st.metodoPago === m.id ? "var(--rose-soft)" : "var(--surface-2)",
                opacity: st.esPedido && m.id === "Fiado" ? 0.4 : 1,
              }}>
              <span style={{ fontSize: 18, display: "block", marginBottom: 3 }}>{m.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: st.metodoPago === m.id ? "var(--rose)" : "var(--muted-2)" }}>{m.label}</span>
            </button>
          ))}
        </div>
        {st.metodoPago === "Fiado" && (
          <div style={{ background: "#FFF3E8", border: "1px solid #FFD0A8", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#7A3800", marginBottom: 12 }}>
            ⚠️ El monto se registrará como deuda en DEUDORES
          </div>
        )}
        <label style={label}>{st.esPedido ? "Seña (opcional)" : "Monto que paga ahora"}</label>
        <input type="number" placeholder={st.esPedido ? "Dejar vacío = sin seña" : "Dejar vacío = no pagó nada (queda en deuda)"}
          value={montoPagado} onChange={e => setMontoPagado(e.target.value)}
          disabled={st.metodoPago === "Fiado"}
          style={{ ...input, background: st.metodoPago === "Fiado" ? "#f5f5f5" : "var(--surface-2)" }} min="0" />
        {saldo > 0 && (
          <div style={{ background: "#FFF3E8", border: "1px solid #FFD0A8", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 13, color: "#7A3800" }}>
            ⚠️ Queda pendiente: <strong>${fmt(saldo)}</strong>
            <span style={{ opacity: 0.7 }}>{st.esPedido ? " — se cobrará al entregar" : " — se registrará en DEUDORES"}</span>
          </div>
        )}
      </div>

      {/* RESUMEN */}
      {st.productos.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,#B5006E,#880050)", borderRadius: 14, padding: 20, marginBottom: 14, color: "white" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14, opacity: 0.8 }}>Resumen del pedido</div>
          {st.productos.map(p => (
            <div key={p.uid} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.12)", fontSize: 13 }}>
              <span>{p.nombre}{p.variable ? ` (${p.variable})` : ""} x{p.cant}</span>
              <span style={{ fontWeight: 600 }}>${fmt(p.precioVenta * p.cant)}</span>
            </div>
          ))}
          {st.descGlobal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.12)", fontSize: 13 }}>
              <span>Desc. {st.descGlobal}%</span><span style={{ color: "#FF8FAB" }}>-${fmt(descAmt)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 4 }}>
            <span style={{ fontSize: 14, opacity: 0.8 }}>Total final</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700 }}>${fmt(total)}</span>
          </div>
        </div>
      )}

      {/* COBRAR BADGE */}
      {st.productos.length > 0 && (
        st.esPedido ? (
          monto > 0
            ? <div style={{ background: "var(--blue-bg)", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid #BBDEFB" }}>
                <span style={{ fontSize: 24 }}>💵</span>
                <div><div style={{ fontSize: 12, color: "var(--blue)", opacity: 0.7 }}>Seña recibida</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--blue)", fontFamily: "'Playfair Display',serif" }}>${fmt(monto)}</div></div>
              </div>
            : <div style={{ background: "var(--green-bg)", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid #A7E9D5" }}>
                <span style={{ fontSize: 24 }}>📦</span>
                <div><div style={{ fontSize: 12, color: "var(--green)", opacity: 0.7 }}>A cobrar al entregar</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--green)", fontFamily: "'Playfair Display',serif" }}>${fmt(total)}</div></div>
              </div>
        ) : (
          montoPagado === "" || monto === 0
            ? <div style={{ background: "var(--rose-soft)", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--rose)" }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 12, color: "var(--rose)", opacity: 0.8 }}>No pagó nada — queda en deuda</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--rose)", fontFamily: "'Playfair Display',serif" }}>${fmt(total)}</div>
                </div>
              </div>
            : <div style={{ background: "var(--green-bg)", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid #A7E9D5" }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div><div style={{ fontSize: 12, color: "var(--green)", opacity: 0.7 }}>Pagó ahora</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--green)", fontFamily: "'Playfair Display',serif" }}>${fmt(Math.min(monto, total))}</div></div>
              </div>
        )
      )}

      {/* NOTA */}
      <div style={card}>
        <div style={sectionTitle}>📝 Nota (opcional)</div>
        <textarea rows={2} placeholder="Ej: Entregar el martes, color rojo..."
          value={nota} onChange={e => setNota(e.target.value)}
          style={{ ...input, resize: "none" }} />
      </div>

      {/* BTN SUBMIT */}
      <button onClick={registrar} disabled={guardando} style={{
        position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
        width: "calc(100% - 32px)", maxWidth: 620, padding: 17, borderRadius: 14, border: "none",
        background: st.esPedido ? "linear-gradient(135deg,#1565C0,#0D47A1)" : "linear-gradient(135deg,#E91E8C,#B5006E)",
        color: "white", fontSize: 16, fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer",
        boxShadow: "0 8px 32px rgba(233,30,140,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 80,
        opacity: guardando ? 0.8 : 1,
      }}>
        {guardando
          ? <><div style={{ width: 18, height: 18, border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "var(--surface-2)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Guardando...</>
          : st.esPedido ? "📦 Registrar pedido" : "✓ Registrar venta"
        }
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media(max-width:768px) { .tab-padding { padding: 16px 16px 120px !important; } }
      `}</style>
    </div>
  );
}

function ProductoRow({ p, esMay, onRemove, onCant, onPctMin, onPctMay, onPctCosto, onUpdate, onCambiarVersion }) {
  function fmt(n) { return Number(n || 0).toLocaleString("es-AR"); }

  const rowStyle    = { border: "1px solid #F0D6E4", borderRadius: 12, overflow: "hidden", marginBottom: 12 };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px", background: "var(--surface-3)", borderBottom: "1px solid #F0D6E4" };
  const bodyStyle   = { padding: "14px" };
  const pillBtn = (active, color) => ({
    padding: "4px 9px", borderRadius: 20, border: "1.5px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
    borderColor: active ? color : "var(--border)", background: active ? color : "var(--surface-2)", color: active ? "var(--surface-2)" : "var(--muted-2)",
  });
  const controls = { display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 8, alignItems: "center", marginTop: 10 };

  const tieneVersiones = (p.versionesDisponibles || []).length > 1;

  if (p.esPersonalizado) {
    return (
      <div style={rowStyle}>
        <div style={headerStyle}>
          <input type="text" value={p.nombre} onChange={e => onUpdate({ nombre: e.target.value })}
            style={{ border: "none", background: "transparent", fontSize: 14, fontWeight: 700, width: "100%", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
            placeholder="Nombre del producto..." />
          <button onClick={onRemove} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "var(--red-bg)", color: "var(--red)", cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={bodyStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[["Costo","precioCosto"],["Minorista","precioMin"],["Mayorista","precioMay"]].map(([lbl,key]) => (
              <div key={key}>
                <label style={{ fontSize: 9, color: key === "precioCosto" ? "var(--red)" : "var(--muted-2)", display: "block", marginBottom: 4, textTransform: "uppercase", fontWeight: key === "precioCosto" ? 700 : 400 }}>
                  {lbl}{key === "precioCosto" ? " *" : ""}
                </label>
                <input type="number" value={p[key]}
                  onChange={e => { const val = parseFloat(e.target.value)||0; const ch={[key]:val}; if(key==="precioMin"||key==="precioMay") ch.precioVenta=esMay?(key==="precioMay"?val:p.precioMay):(key==="precioMin"?val:p.precioMin); onUpdate(ch); }}
                  placeholder="0"
                  style={{ width: "100%", padding: 10, border: `1px solid ${key === "precioCosto" && (!p[key] || p[key] <= 0) ? "var(--red)" : "var(--border)"}`, borderRadius: 8, textAlign: "center", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
              </div>
            ))}
          </div>
          <input type="text" value={p.observacion} onChange={e => onUpdate({ observacion: e.target.value })}
            placeholder="📝 Observación (opcional)"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #F0D6E4", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 10 }} />
          <div style={controls}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-3)", borderRadius: 8, padding: "4px 8px", border: "1px solid #F0D6E4" }}>
              <button onClick={() => onCant(-1)} style={{ width: 26, height: 26, border: "none", background: "var(--rose-soft)", color: "var(--rose)", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{p.cant}</span>
              <button onClick={() => onCant(1)}  style={{ width: 26, height: 26, border: "none", background: "var(--rose-soft)", color: "var(--rose)", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>+</button>
            </div>
            <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px", border: "1px solid #F0D6E4", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase" }}>P. unitario</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--rose)" }}>${fmt(p.precioVenta)}</div>
            </div>
            <div style={{ background: "var(--rose-soft)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--rose)", textTransform: "uppercase" }}>Subtotal</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--rose)" }}>${fmt(p.precioVenta * p.cant)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--rose)" }}>#{p.id}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{p.nombre}</div>
          {p.variable && <div style={{ fontSize: 12, color: "var(--muted-2)" }}>{p.variable}</div>}
        </div>
        <button onClick={onRemove} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "var(--red-bg)", color: "var(--red)", cursor: "pointer" }}>✕</button>
      </div>

      {/* ✅ SELECTOR DE VERSIÓN DE PRECIO — solo aparece si hay más de una versión */}
      {tieneVersiones ? (
        <div style={{ padding: "10px 14px", background: "#FFF0F7", borderBottom: "1px solid #F0D6E4" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 6 }}>
            Lista de precios
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {p.versionesDisponibles.map(v => (
              <button
                key={v.etiqueta}
                onClick={() => onCambiarVersion(v.etiqueta)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  borderColor: p.versionSeleccionada === v.etiqueta ? "var(--rose)" : "var(--border)",
                  background:  p.versionSeleccionada === v.etiqueta ? "var(--rose)" : "var(--surface-2)",
                  color:       p.versionSeleccionada === v.etiqueta ? "white" : "var(--muted-2)",
                }}
              >
                {v.etiqueta} — ${fmt(v.precio)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 14px", background: "#FFF0F7", borderBottom: "1px solid #F0D6E4" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase" }}>Precio de lista</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: "var(--rose)", fontWeight: 700 }}>${fmt(p.precioLista)}</span>
        </div>
      )}

      <div style={bodyStyle}>
        {/* MINORISTA */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 5 }}>
            <span style={{ background: "var(--rose-soft)", color: "var(--rose)", padding: "2px 7px", borderRadius: 20, fontSize: 10 }}>Minorista</span> % sobre lista
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
            {PCTS_MIN.map(pct => <button key={pct} onClick={() => onPctMin(pct)} style={pillBtn(p.pctMin===pct,"var(--rose)")}>{pct}%</button>)}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted-2)", textAlign: "right" }}>Precio minorista: <strong style={{ color: "var(--rose)" }}>${fmt(p.precioMin)}</strong></div>
        </div>

        {/* MAYORISTA */}
        {esMay && (
          <div style={{ marginBottom: 10, borderTop: "1px solid #F0D6E4", paddingTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 5 }}>
              <span style={{ background: "#EDE7F6", color: "#4527A0", padding: "2px 7px", borderRadius: 20, fontSize: 10 }}>Mayorista</span> % adicional
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
              {PCTS_MAY.map(pct => <button key={pct} onClick={() => onPctMay(pct)} style={pillBtn(p.pctMay===pct,"#4527A0")}>{pct}%</button>)}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-2)", textAlign: "right" }}>Precio mayorista: <strong style={{ color: "#4527A0" }}>${fmt(p.precioMay)}</strong></div>
          </div>
        )}

        {/* COSTO */}
        <div style={{ marginBottom: 10, borderTop: "1px solid #F0D6E4", paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 5 }}>
            <span style={{ background: "#E8F5E9", color: "#2E7D32", padding: "2px 7px", borderRadius: 20, fontSize: 10 }}>Costo</span> % descuento sobre minorista
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
            {PCTS_COST.map(pct => <button key={pct} onClick={() => onPctCosto(pct)} style={pillBtn(p.pctCosto===pct,"#388E3C")}>{pct}%</button>)}
          </div>
          <div style={{ fontSize: 11, color: p.precioCosto > 0 ? "#2E7D32" : "var(--red)", textAlign: "right", fontWeight: p.precioCosto === 0 ? 700 : 400 }}>
            {p.precioCosto === 0 ? "⚠️ Costo obligatorio" : <>Precio costo: <strong>${fmt(p.precioCosto)}</strong></>}
          </div>
        </div>

        {/* OBSERVACIÓN */}
        <input type="text" value={p.observacion} onChange={e => onUpdate({ observacion: e.target.value })}
          placeholder="📝 Observación (opcional)"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #F0D6E4", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 10 }} />

        {/* CONTROLES */}
        <div style={controls}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-3)", borderRadius: 8, padding: "4px 8px", border: "1px solid #F0D6E4" }}>
            <button onClick={() => onCant(-1)} style={{ width: 26, height: 26, border: "none", background: "var(--rose-soft)", color: "var(--rose)", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>−</button>
            <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{p.cant}</span>
            <button onClick={() => onCant(1)}  style={{ width: 26, height: 26, border: "none", background: "var(--rose-soft)", color: "var(--rose)", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>+</button>
          </div>
          <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px", border: "1px solid #F0D6E4", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase" }}>P. unitario</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--rose)" }}>${fmt(p.precioVenta)}</div>
          </div>
          <div style={{ background: "var(--rose-soft)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--rose)", textTransform: "uppercase" }}>Subtotal</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--rose)" }}>${fmt(p.precioVenta * p.cant)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}