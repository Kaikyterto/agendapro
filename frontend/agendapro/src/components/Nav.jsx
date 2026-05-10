import { useState } from "react";

export default function Nav({ logo }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "#hero" },
    { label: "Sobre", href: "#about" },
    { label: "Depoimentos", href: "#testimonials" },
    { label: "Planos", href: "#card" },
    { label: "FAQ", href: "#faq" },
    { label: "Contato", href: "#footer" },
  ];

  return (
    <nav
      className="sticky top-0 z-40 w-full font-sans backdrop-blur border-b-2"
      style={{
        backgroundColor: "rgba(7, 9, 13, 0.8)",
        borderBottomColor: "var(--primary)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {/* LOGO */}
        <a href="#hero" className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <span
              className="font-bold text-xl"
              style={{ color: "var(--primary)" }}
            >
              LOGO
            </span>
          )}
        </a>

        {/* MENU DESKTOP */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-medium transition hover:brightness-125"
              style={{ color: "var(--accent)" }} // Usa a cor secundária (accent)
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* BOTÃO MOBILE */}
        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          style={{ color: "var(--primary)" }}
          onClick={() => setIsOpen((v) => !v)}
        >
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* MENU MOBILE */}
      {isOpen && (
        <div
          className="px-6 py-4 md:hidden border-t"
          style={{
            backgroundColor: "#07090d",
            borderTopColor: "var(--primary)",
          }}
        >
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="font-medium"
                style={{ color: "var(--accent)" }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
