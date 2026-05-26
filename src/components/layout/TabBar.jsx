const TABS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "venta",     icon: "🛍️", label: "Nueva Venta" },
  { id: "pedidos",   icon: "📦", label: "Pedidos" },
  { id: "productos", icon: "🗂️", label: "Productos" },
  { id: "encargos",  icon: "📋", label: "Encargos" },
  { id: "pagos",     icon: "💳", label: "Pagos" },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div
      className="grid sticky top-0 z-40 border-b-2"
      style={{
        gridTemplateColumns: "repeat(6, 1fr)",
        background: "white",
        borderColor: "#F0D6E4",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center py-3 text-[11px] font-semibold border-b-[3px] -mb-[2px] transition-colors cursor-pointer"
            style={{
              color: isActive ? "#B5006E" : "#8B7280",
              borderBottomColor: isActive ? "#E91E8C" : "transparent",
              background: "none",
              border: "none",
              borderBottom: isActive ? "3px solid #E91E8C" : "3px solid transparent",
              marginBottom: "-2px",
            }}
          >
            <span className="text-lg mb-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}