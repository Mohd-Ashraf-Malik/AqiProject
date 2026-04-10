const Footer = () => {
  return (
    <footer className="border-t border-[var(--line)] bg-[rgba(224,232,242,0.7)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-[var(--muted)] sm:px-8 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-base font-semibold tracking-[0.22em] text-[var(--ink-strong)]">AQI SENTRY</p>
          <p className="mt-3 max-w-xl leading-7">
            A smart AQI monitoring and alert system with community-driven pollution
            reporting, predictive analytics, and fast municipality routing.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--signal)]">Focus Areas</p>
          <ul className="mt-3 space-y-2">
            <li>Real-time AQI dashboard</li>
            <li>Heatmap and red-zone visibility</li>
            <li>Google-verified complaint registration</li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--signal)]">Built For</p>
          <ul className="mt-3 space-y-2">
            <li>Citizens and local communities</li>
            <li>Municipality response teams</li>
            <li>Smart city AQI operations</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
