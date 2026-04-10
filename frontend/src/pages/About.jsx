const About = () => {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <div className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[var(--shadow-card)]">
        <p className="text-sm uppercase tracking-[0.4em] text-[var(--signal)]">Our Mission</p>
        <h1 className="mt-4 text-4xl font-semibold text-[var(--ink-strong)] sm:text-5xl">
          Turn air-quality data into local action, not just numbers.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          AQI Sentry helps citizens monitor air quality in real time, spot pollution hotspots,
          get personalised health guidance, and report issues directly to the right local authority
          — all without any complicated steps.
        </p>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Easy to use",
            text: "No sign-up required to view air quality. Verify once with Google and you're ready to report pollution in your area.",
          },
          {
            title: "Community + data",
            text: "Sensor readings combine with ground reports — smoke, dust, burning garbage — to give a fuller picture of local air quality.",
          },
          {
            title: "Ready to act",
            text: "Forecasts, trend graphs, city comparisons, and health advice help you and local authorities respond before conditions worsen.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[28px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--ink-strong)]">{item.title}</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default About;
