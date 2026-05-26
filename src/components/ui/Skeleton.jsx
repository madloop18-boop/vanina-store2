function SkeletonBox({ width="100%", height=14, borderRadius=6, style={} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background:"linear-gradient(90deg,var(--surface-3) 25%,var(--surface-4) 50%,var(--surface-3) 75%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

export function SkeletonCard({ lines=3 }) {
  return (
    <div style={{ background:"var(--surface-2)", borderRadius:14, padding:18, border:"1px solid var(--border)", marginBottom:10 }}>
      <SkeletonBox height={12} width="35%" style={{ marginBottom:14 }} />
      {Array.from({ length:lines }).map((_,i) => (
        <SkeletonBox key={i} height={11} width={i===lines-1?"55%":"100%"} style={{ marginBottom:8 }} />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div style={{ background:"var(--surface-2)", borderRadius:14, padding:18, border:"1px solid var(--border)" }}>
      <SkeletonBox height={9} width="45%" style={{ marginBottom:12 }} />
      <SkeletonBox height={28} width="60%" style={{ marginBottom:8 }} />
      <SkeletonBox height={9} width="35%" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <SkeletonBox width={28} height={28} borderRadius={14} />
        <SkeletonBox width={100} height={11} />
      </div>
      <SkeletonBox width={50} height={11} />
    </div>
  );
}

export default SkeletonBox;
export const skeletonCSS = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
