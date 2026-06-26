interface LogoProps {
  size?: number;
  light?: boolean;
  className?: string;
}

export default function Logo({ size = 30, light = false, className = "" }: LogoProps) {
  const stroke = light ? "rgba(255,255,255,.55)" : "var(--navy)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <line x1="24" y1="9.5" x2="11" y2="38.5" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" />
      <line x1="24" y1="9.5" x2="37" y2="38.5" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" />
      <line x1="16.5" y1="29" x2="31.5" y2="29" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="24" cy="9.5" r="4.3" fill="var(--emerald)" style={{ transformOrigin: "24px 9.5px", animation: "pulseNode 3.4s ease-in-out infinite" }} />
      <circle cx="11" cy="38.5" r="4.3" fill="var(--emerald)" style={{ transformOrigin: "11px 38.5px", animation: "pulseNode 3.4s ease-in-out .9s infinite" }} />
      <circle cx="37" cy="38.5" r="4.3" fill="var(--emerald)" style={{ transformOrigin: "37px 38.5px", animation: "pulseNode 3.4s ease-in-out 1.7s infinite" }} />
      <circle cx="24" cy="29" r="3.6" fill="var(--cyan)" style={{ transformOrigin: "24px 29px", animation: "pulseNode 3.4s ease-in-out .45s infinite" }} />
    </svg>
  );
}
