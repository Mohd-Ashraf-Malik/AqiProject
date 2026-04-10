const FEATURES = [
  {
    eyebrow: "Nearby Stations",
    title: "Real-time air quality at your location",
    description:
      "The dashboard reads your location and instantly shows the AQI reading, dominant pollutant, and distance for the nearest monitoring station. Use the GPS button or type coordinates to change the area.",
  },
  {
    eyebrow: "Identity Verification",
    title: "One-tap sign-in before reporting",
    description:
      "Sign in once with your Google account to verify your identity. No codes, no passwords — just one tap. After that, your details are pre-filled and you can submit complaints straight away.",
  },
  {
    eyebrow: "Pollution Heatmap & Charts",
    title: "Live readings and forecasts on the map",
    description:
      "The heatmap shows current AQI at monitoring points around you, colour-coded by severity. The forecast graph shows where PM2.5 levels are heading over the next few days.",
  },
  {
    eyebrow: "Complaint Submission",
    title: "Report pollution and track it",
    description:
      "Describe the issue, select the type of pollution, attach a photo, and submit. Your complaint is automatically routed to the right local authority for the area you reported.",
  },
];

const STACK = [
  { label: "Your AQI reading", detail: "Nearest monitoring station to your location" },
  { label: "Dominant pollutant", detail: "Most significant pollutant at that station" },
  { label: "PM2.5 forecast chart", detail: "Predicted fine-particle levels for coming days" },
  { label: "Nearby station cards", detail: "All monitoring points within 12 km" },
  { label: "City comparison", detail: "Live rankings — Mumbai, Delhi, Pune and more" },
  { label: "Complaint routing", detail: "Automatically sent to the matching local authority" },
];

const Contact = () => {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">

      {/* Header */}
      <div className="mb-12">
        <p className="text-sm uppercase tracking-[0.4em] text-[var(--signal)]">How It Works</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold text-[var(--ink-strong)] leading-[1.1]">
          Everything you need to monitor and report air quality.
        </h1>
        <p className="mt-5 max-w-xl leading-8 text-[var(--muted)]">
          AQI Sentry brings together live monitoring, health guidance, and community reporting
          in one place.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {FEATURES.map((item) => (
          <div
            key={item.title}
            className="rounded-[32px] border border-[var(--line)] bg-[var(--panel)] p-7 shadow-[var(--shadow-card)] flex flex-col gap-5"
          >
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--signal)]">
              {item.eyebrow}
            </p>

            <div
              className="h-px w-full"
              style={{ background: "rgba(0,0,0,0.07)" }}
            />

            <div>
              <p className="text-lg font-semibold text-[var(--ink-strong)]">{item.title}</p>
              <p className="mt-3 leading-7 text-sm text-[var(--muted)]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What's shown section */}
      <div className="mt-12 rounded-[32px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-7">
        <p className="text-xs uppercase tracking-[0.36em] text-[var(--signal)]">What You See</p>
        <p className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">
          Every piece of information on the dashboard
        </p>

        <div className="mt-6 divide-y divide-[rgba(0,0,0,0.06)]">
          {STACK.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_1fr] gap-4 py-4 text-sm"
            >
              <span className="text-[var(--ink-strong)] font-medium">{row.label}</span>
              <span className="text-[var(--muted)]">{row.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact strip */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--signal)]">Email</p>
          <p className="mt-3 text-lg text-[var(--ink-strong)]">ashrafmalik.tech@gmail.com</p>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--signal)]">Support</p>
          <p className="mt-3 text-lg text-[var(--ink-strong)]">+91 8169987796</p>
        </div>
      </div>
    </main>
  );
};

export default Contact;
