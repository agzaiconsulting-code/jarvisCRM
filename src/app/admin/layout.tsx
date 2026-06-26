import "./crm.css";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="crm-root" style={{ position: "fixed", inset: 0 }}>
      <div className="stage" />
      {children}
    </div>
  );
}
