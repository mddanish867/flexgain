export function LandingQuote() {
  return (
    <section className="py-20 sm:py-28 border-t border-border bg-bg-panel/40">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <p className="font-mono-label text-accent-red mb-6">
          THE FLEXGAIN PROMISE
        </p>
        <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight italic">
          “Discipline is the bridge between{" "}
          <span className="text-accent-red not-italic">goals</span> and
          accomplishment.”
        </blockquote>
        <p className="mt-6 text-fg-muted">
          We don&apos;t sell motivation. We sell the boring, beautiful habit of
          showing up — and a tool that makes the boring easy.
        </p>
      </div>
    </section>
  );
}
