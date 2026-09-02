function AssessmentReport({ report, onContinue }) {
  if (!report || typeof report !== "object") {
    return null;
  }

  const parsedScore = Number(report.score);

  const score = Number.isFinite(parsedScore)
    ? Math.min(100, Math.max(0, parsedScore))
    : 0;

  const strongConcepts = Array.isArray(
    report.strongConcepts
  )
    ? report.strongConcepts.filter(
        (item) =>
          typeof item === "string" &&
          item.trim()
      )
    : [];

  const weakConcepts = Array.isArray(
    report.weakConcepts
  )
    ? report.weakConcepts.filter(
        (item) =>
          typeof item === "string" &&
          item.trim()
      )
    : [];

  const misconceptions = Array.isArray(
    report.misconceptions
  )
    ? report.misconceptions.filter(
        (item) =>
          typeof item === "string" &&
          item.trim()
      )
    : [];

  const revision =
    typeof report.revision === "string"
      ? report.revision.trim()
      : "";

  const practice =
    typeof report.practice === "string"
      ? report.practice.trim()
      : "";

  const nextTopic =
    typeof report.nextTopic === "string"
      ? report.nextTopic.trim()
      : "";

  const topic =
    typeof report.topic === "string"
      ? report.topic.trim()
      : "";

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs improvement";
    return "Needs revision";
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-emerald-700";
    if (score >= 60) return "text-slate-900";
    if (score >= 40) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Header */}
      <header className="border-b border-slate-100 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          Assessment
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Your learning report
        </h2>

        {topic && (
          <p className="mt-2 text-sm text-slate-500">
            {topic}
          </p>
        )}
      </header>

      {/* Score */}
      <div className="flex items-center justify-between gap-6 border-b border-slate-100 py-6">
        <div>
          <p className="text-sm text-slate-500">
            Overall score
          </p>

          <p
            className={`mt-1 text-4xl font-semibold tracking-tight ${getScoreColor()}`}
          >
            {score}%
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {getScoreLabel()}
          </p>
        </div>

        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-slate-200"
          aria-label={`Score: ${score}%`}
        >
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 36 36"
            aria-hidden="true"
          >
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-100"
            />

            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${score} 100`}
              className={getScoreColor()}
            />
          </svg>

          <span className="relative text-sm font-semibold text-slate-900">
            {score}
          </span>
        </div>
      </div>

      {/* Strong concepts */}
      {strongConcepts.length > 0 && (
        <div className="border-b border-slate-100 py-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Strong concepts
          </h3>

          <ul className="mt-3 space-y-2">
            {strongConcepts.map(
              (concept, index) => (
                <li
                  key={`${concept}-${index}`}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                    aria-hidden="true"
                  />

                  <span>{concept.trim()}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Weak concepts */}
      {weakConcepts.length > 0 && (
        <div className="border-b border-slate-100 py-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Areas to improve
          </h3>

          <ul className="mt-3 space-y-2">
            {weakConcepts.map(
              (concept, index) => (
                <li
                  key={`${concept}-${index}`}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                    aria-hidden="true"
                  />

                  <span>{concept.trim()}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Misconceptions */}
      {misconceptions.length > 0 && (
        <div className="border-b border-slate-100 py-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Misconceptions to review
          </h3>

          <ul className="mt-3 space-y-2">
            {misconceptions.map(
              (item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                    aria-hidden="true"
                  />

                  <span>{item.trim()}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {(revision || practice) && (
        <div className="space-y-6 border-b border-slate-100 py-6">
          {revision && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Revision recommendation
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {revision}
              </p>
            </div>
          )}

          {practice && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Practice recommendation
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {practice}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next topic */}
      {nextTopic && (
        <div className="py-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Next
          </p>

          <h3 className="mt-2 text-base font-semibold text-slate-900">
            {nextTopic}
          </h3>
        </div>
      )}

      {/* Continue */}
      {typeof onContinue === "function" && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          Continue learning
        </button>
      )}
    </section>
  );
}

export default AssessmentReport;