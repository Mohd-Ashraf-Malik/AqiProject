import { NavLink } from "react-router-dom";

const Navbar = () => {
  const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/about", label: "Mission" },
    { to: "/contact", label: "Connect" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(240,245,251,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_#ffb86b,_#f35b04_65%,_#561b06)] text-lg font-bold text-white shadow-[0_10px_30px_rgba(243,91,4,0.28)]">
            AQ
          </div>
          <div>
            <p className="text-lg font-semibold tracking-[0.2em] text-[var(--ink-strong)]">AQI SENTRY</p>
            <p className="text-xs text-[var(--muted)]">Live air intelligence for fast action</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-[rgba(0,0,0,0.07)] text-[var(--ink-strong)] font-semibold"
                    : "text-[var(--muted)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--ink-strong)]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
