export default function Header({ title, subtitle }) {
  return (
    <div
      className="relative overflow-hidden px-5 pt-6 pb-7"
      style={{
        background: "linear-gradient(135deg, #E91E8C 0%, #B5006E 60%, #880050 100%)",
      }}
    >
      {/* círculos decorativos */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: "rgba(255,255,255,0.07)",
          top: -60,
          right: -40,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background: "rgba(255,255,255,0.05)",
          bottom: -30,
          left: -20,
        }}
      />
      <div className="relative z-10">
        <h1
          className="text-2xl text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1 font-light" style={{ color: "rgba(255,255,255,0.72)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}