import { useState, useEffect } from "react";
import { SkeletonCard, skeletonCSS } from "../ui/Skeleton";
import { api } from "../../lib/api";

function fmt(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

const METODOS = ["Efectivo", "Transferencia", "Débito", "Crédito", "Mercado Pago", "Fiado"];

// ── Modal de Confirmación ──────────────────────────────────────
function ModalConfirm({ mensaje, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 18, padding: "28px 24px",
        maxWidth: 360, width: "100%", border: "1px solid #F0D6E4",
        boxShadow: "0 8px 40px rgba(233,30,140,0.18)",
      }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🗑️</div>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text)", marginBottom: 24, lineHeight: 1.5 }}>
          {mensaje}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #F0D6E4",
            background: "transparent", color: "var(--text)", fontWeight: 700,
            fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#e53935,#b71c1c)", color: "white",
            fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Edición ───────────────────────────────────────────
function ModalEditar({ venta, onGuardar, onCerrar, showToast }) {
  const [cliente,  setCliente]  = useState(venta.cliente  || "");
  const [tel,      setTel]      = useState(venta.tel      || "");
  const [tipo,     setTipo]     = useState(venta.tipo     || "Minorista");
  const [metodo,   setMetodo]   = useState(venta.metodo   || "Efectivo");
  const [pagado,   setPagado]   = useState(String(venta.pagado  || 0));
  const [total,    setTotal]    = useState(String(venta.total   || 0));
  const [nota,     setNota]     = useState(venta.nota     || "");
  const [items,    setItems]    = useState(
    (venta.items || []).map((it, i) => ({ ...it, _id: i }))
  );
  const [guardando, setGuardando] = useState(false);

  const totalCalc = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const saldoCalc = Math.max(0, totalCalc - Number(pagado || 0));

  const updateItem = (id, field, val) =>
    setItems(prev => prev.map(it => {
      if (it._id !== id) return it;
      const updated = { ...it, [field]: val };
      if (field === "cantidad" || field === "precio") {
        updated.subtotal = (Number(updated.cantidad) || 0) * (Number(updated.precio) || 0);
      }
      return updated;
    }));

  const eliminarItem = (id) => setItems(prev => prev.filter(it => it._id !== id));

  const agregarItem = () => setItems(prev => [
    ...prev,
    { _id: Date.now(), nombre: "", variable: "", cantidad: 1, precio: 0, subtotal: 0, observacion: "" }
  ]);

  const handleGuardar = async () => {
    if (!cliente.trim()) { showToast("❌ Ingresá el nombre del cliente"); return; }
    if (items.length === 0) { showToast("❌ Debe haber al menos un producto"); return; }
    setGuardando(true);
    try {
      await onGuardar({
        id_pedido:       venta.id,
        cliente_nombre:  cliente.trim(),
        cliente_tel:     tel.trim(),
        tipo_cliente:    tipo,
        metodo_pago:     metodo,
        monto_pagado:    Number(pagado)    || 0,
        total_final:     totalCalc,
        saldo_pendiente: saldoCalc,
        nota:            nota.trim(),
        productos: items.map(it => ({
          nombre:      it.nombre,
          variable:    it.variable   || "",
          cantidad:    Number(it.cantidad) || 1,
          precio:      Number(it.precio)   || 0,
          subtotal:    Number(it.subtotal) || 0,
          observacion: it.observacion || "",
          catalogo_usado: it.catalogo_usado || "",
        })),
      });
    } finally {
      setGuardando(false);
    }
  };

  const inp = {
    padding: "10px 14px", border: "1.5px solid #F0D6E4", borderRadius: 10,
    fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: "var(--text)",
    background: "var(--surface-3)", outline: "none", width: "100%",
  };
  const lbl = {
    fontSize: 10, fontWeight: 700, color: "var(--muted-2)",
    textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 5, display: "block",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      zIndex: 9999, padding: "16px 12px", overflowY: "auto",
    }}>
      <div style={{
        background: "var(--surface-2)", borderRadius: 18, padding: "24px 20px",
        maxWidth: 540, width: "100%", border: "1px solid #F0D6E4",
        boxShadow: "0 8px 40px rgba(233,30,140,0.18)", marginTop: 8,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--rose)", fontFamily: "'Playfair Display',serif" }}>
            ✏️ Editar venta
          </h3>
          <button onClick={onCerrar} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--muted-2)" }}>✕</button>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-2)", letterSpacing: "0.8px", marginBottom: 12, textTransform: "uppercase" }}>
          🔖 {venta.id}
        </div>

        {/* Datos del cliente */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Cliente</label>
            <input style={inp} value={cliente} onChange={e => setCliente(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Teléfono</label>
            <input style={inp} value={tel} onChange={e => setTel(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Tipo</label>
            <select style={inp} value={tipo} onChange={e => setTipo(e.target.value)}>
              <option>Minorista</option>
              <option>Mayorista</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Método de pago</label>
            <select style={inp} value={metodo} onChange={e => setMetodo(e.target.value)}>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Monto pagado</label>
            <input style={inp} type="number" value={pagado} onChange={e => setPagado(e.target.value)} />
          </div>
        </div>

        {/* Productos */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ ...lbl, margin: 0 }}>Productos</span>
            <button onClick={agregarItem} style={{
              fontSize: 11, fontWeight: 700, color: "var(--rose)", background: "var(--surface-3)",
              border: "1px solid #F0D6E4", borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            }}>+ Agregar</button>
          </div>

          {items.map(it => (
            <div key={it._id} style={{
              background: "var(--surface-3)", borderRadius: 10, padding: "12px",
              marginBottom: 8, border: "1px solid #F0D6E4",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={lbl}>Nombre del producto</label>
                  <input style={inp} value={it.nombre} onChange={e => updateItem(it._id, "nombre", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Variable</label>
                  <input style={inp} value={it.variable || ""} onChange={e => updateItem(it._id, "variable", e.target.value)} placeholder="Color, talle..." />
                </div>
                <div>
                  <label style={lbl}>Observación</label>
                  <input style={inp} value={it.observacion || ""} onChange={e => updateItem(it._id, "observacion", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Cantidad</label>
                  <input style={inp} type="number" min="1" value={it.cantidad} onChange={e => updateItem(it._id, "cantidad", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Precio unitario</label>
                  <input style={inp} type="number" value={it.precio || Math.round((Number(it.subtotal)||0)/(Number(it.cantidad)||1))} onChange={e => updateItem(it._id, "precio", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--rose)" }}>
                  Subtotal: ${fmt(it.subtotal)}
                </span>
                <button onClick={() => eliminarItem(it._id)} style={{
                  fontSize: 11, color: "#e53935", background: "none", border: "1px solid #ffcdd2",
                  borderRadius: 7, padding: "4px 10px", cursor: "pointer",
                }}>🗑️ Quitar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Nota */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Nota</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={nota} onChange={e => setNota(e.target.value)} />
        </div>

        {/* Resumen */}
        <div style={{ background: "var(--surface-3)", borderRadius: 10, padding: "12px 14px", marginBottom: 18, border: "1px solid #F0D6E4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--muted-2)" }}>Total calculado:</span>
            <span style={{ fontWeight: 700, color: "var(--rose)" }}>${fmt(totalCalc)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--muted-2)" }}>Pagado:</span>
            <span style={{ fontWeight: 700, color: "var(--green)" }}>${fmt(pagado)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--muted-2)" }}>Saldo pendiente:</span>
            <span style={{ fontWeight: 700, color: saldoCalc > 0 ? "var(--red)" : "var(--green)" }}>${fmt(saldoCalc)}</span>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCerrar} style={{
            flex: 1, padding: "13px", borderRadius: 10, border: "1.5px solid #F0D6E4",
            background: "transparent", color: "var(--text)", fontWeight: 700,
            fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} style={{
            flex: 2, padding: "13px", borderRadius: 10, border: "none",
            background: guardando ? "#ccc" : "linear-gradient(135deg,#E91E8C,#B5006E)",
            color: "white", fontWeight: 700, fontSize: 14,
            cursor: guardando ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif",
          }}>
            {guardando ? "Guardando..." : "💾 Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────
export default function VentasDirectas({ showToast }) {
  const [ventas,    setVentas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filtro,    setFiltro]    = useState("");
  const [ventaEdit, setVentaEdit] = useState(null);
  const [ventaBorrar, setVentaBorrar] = useState(null);

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

  const porFecha = filtradas.reduce((acc, v) => {
    const key = v.fecha || "Sin fecha";
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const totalVentas    = ventas.reduce((s, v) => s + (Number(v.total)  || 0), 0);
  const totalCobrado   = ventas.reduce((s, v) => s + (Number(v.pagado) || 0), 0);
  const totalPendiente = ventas.reduce((s, v) => s + (Number(v.saldo)  || 0), 0);

  // ── Eliminar ──
  const handleEliminar = async () => {
    if (!ventaBorrar) return;
    try {
      await api.eliminarVenta({ id_pedido: ventaBorrar.id });
      showToast("✅ Venta eliminada");
      setVentaBorrar(null);
      cargar();
    } catch (e) {
      showToast("❌ Error: " + e.message);
      setVentaBorrar(null);
    }
  };

  // ── Editar / Guardar ──
  const handleGuardar = async (payload) => {
    try {
      // 1) Eliminar venta vieja
      await api.eliminarVenta({ id_pedido: payload.id_pedido });

      // 2) Re-crear con los nuevos datos
      await api.registrarVenta({
        es_pedido:       false,
        cliente_nombre:  payload.cliente_nombre,
        cliente_tel:     payload.cliente_tel,
        tipo_cliente:    payload.tipo_cliente,
        productos: payload.productos.map(p => ({
          id_producto:      p.id_producto || "EDIT",
          nombre:           p.nombre,
          variable:         p.variable    || "",
          cantidad:         Number(p.cantidad)  || 1,
          precio_lista:     Number(p.precio)    || 0,
          pct_minorista:    0,
          precio_minorista: Number(p.precio)    || 0,
          pct_mayorista:    0,
          precio_mayorista: Number(p.precio)    || 0,
          precio_venta:     Number(p.precio)    || 0,
          desc_ind:         0,
          subtotal:         Number(p.subtotal)  || 0,
          pct_costo:        0,
          precio_costo:     0,
          observacion:      p.observacion       || "",
          catalogo_usado:   p.catalogo_usado    || "",
        })),
        desc_global_pct: 0,
        desc_global_amt: 0,
        total_final:     payload.total_final,
        monto_pagado:    payload.monto_pagado,
        saldo_pendiente: payload.saldo_pendiente,
        metodo_pago:     payload.metodo_pago,
        nota:            payload.nota || "",
      });

      showToast("✅ Venta actualizada correctamente");
      setVentaEdit(null);
      cargar();
    } catch (e) {
      showToast("❌ Error al guardar: " + e.message);
    }
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }} className="tab-padding">
      <style>{skeletonCSS}</style>

      {/* MODALES */}
      {ventaBorrar && (
        <ModalConfirm
          mensaje={`¿Eliminás la venta de ${ventaBorrar.cliente}? Esta acción no se puede deshacer.`}
          onConfirm={handleEliminar}
          onCancel={() => setVentaBorrar(null)}
        />
      )}
      {ventaEdit && (
        <ModalEditar
          venta={ventaEdit}
          onGuardar={handleGuardar}
          onCerrar={() => setVentaEdit(null)}
          showToast={showToast}
        />
      )}

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
                          {it.catalogo_usado ? <span style={{ marginLeft: 6, fontSize: 10, color: "var(--muted-2)", background: "var(--surface-2)", padding: "1px 6px", borderRadius: 6, border: "1px solid #F0D6E4" }}>{it.catalogo_usado}</span> : null}
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

                  {/* BOTONES EDITAR / BORRAR */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => setVentaEdit(v)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 9,
                        border: "1.5px solid #F0D6E4", background: "var(--surface-3)",
                        color: "var(--rose)", fontWeight: 700, fontSize: 13,
                        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => setVentaBorrar(v)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 9,
                        border: "1.5px solid #ffcdd2", background: "#fff5f5",
                        color: "#e53935", fontWeight: 700, fontSize: 13,
                        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
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