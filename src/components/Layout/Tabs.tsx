import type { Tab } from "../../hooks/useHashTab";

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "calculadora", label: "Calculadora", href: "#" },
  { id: "contadores", label: "Contadores", href: "#contadores" },
];

export function Tabs({ current }: { current: Tab }) {
  return (
    <nav className="tabs" aria-label="Seções do site">
      {TABS.map((tab) => (
        <a
          key={tab.id}
          href={tab.href}
          className={tab.id === current ? "tab active" : "tab"}
          aria-current={tab.id === current ? "page" : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
