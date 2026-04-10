const SectionHeading = ({ eyebrow, title, description }) => {
  return (
    <div className="max-w-3xl">
      <p className="text-sm uppercase tracking-[0.42em] text-[var(--signal)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--ink-strong)] sm:text-4xl">{title}</h2>
      <p className="mt-4 leading-8 text-[var(--muted)]">{description}</p>
    </div>
  );
};

export default SectionHeading;
