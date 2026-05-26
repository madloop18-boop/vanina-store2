export default function Toast({ toast }) {
  return (
    <div style={{
      position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
      zIndex:9999, padding:"12px 22px", borderRadius:12,
      background:"var(--surface-3)", border:"1px solid var(--border-2)",
      color:"var(--text)", fontSize:14, fontWeight:500,
      boxShadow:"var(--shadow-md)", maxWidth:"90%", textAlign:"center",
      transition:"opacity 0.3s, transform 0.3s",
      opacity: toast.visible ? 1 : 0,
      transform: toast.visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-8px)",
      pointerEvents:"none",
    }}>
      {toast.message}
    </div>
  );
}
