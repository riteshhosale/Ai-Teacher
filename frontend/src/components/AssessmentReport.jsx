function AssessmentReport({ report, onContinue }) {
  if (!report) {
    return null;
  }

  const score = Number(report.score) || 0;

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Improvement";
    return "Needs Revision";
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-indigo-600">
          AI Learning Assessment
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Your Learning Report
        </h2>

        {report.topic && (
          <p className="mt-1 text-sm text-slate-500">
            Topic: {report.topic}
          </p>
        )}
      </div>

      {/* Score */}
      <div className="rounded-2xl bg-slate-50 p-6">
        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-slate-500">
              Overall Score
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {score}%
            </p>

            <p className="mt-1 text-sm font-medium text-indigo-600">
              {getScoreLabel()}
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-indigo-100">
            <span className="text-lg font-bold text-indigo-700">
              {score}
            </span>
          </div>

        </div>
      </div>

      {/* Strong Concepts */}
      {report.strongConcepts?.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h3 className="font-semibold text-green-800">
            ✓ Strong Concepts
          </h3>

          <ul className="mt-3 space-y-2">
            {report.strongConcepts.map((concept, index) => (
              <li
                key={index}
                className="text-sm text-green-700"
              >
                • {concept}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weak Concepts */}
      {report.weakConcepts?.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h3 className="font-semibold text-yellow-800">
            ⚠ Weak Concepts
          </h3>

          <ul className="mt-3 space-y-2">
            {report.weakConcepts.map((concept, index) => (
              <li
                key={index}
                className="text-sm text-yellow-700"
              >
                • {concept}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Misconceptions */}
      {report.misconceptions?.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="font-semibold text-orange-800">
            ⚠ Misconceptions Detected
          </h3>

          <ul className="mt-3 space-y-2">
            {report.misconceptions.map((item, index) => (
              <li
                key={index}
                className="text-sm text-orange-700"
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Revision */}
      {report.revision && (
        <div className="rounded-xl bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-900">
            📚 Revision Recommendation
          </h3>

          <p className="mt-2 leading-7 text-blue-800">
            {report.revision}
          </p>
        </div>
      )}

      {/* Practice */}
      {report.practice && (
        <div className="rounded-xl bg-purple-50 p-5">
          <h3 className="font-semibold text-purple-900">
            📝 Practice Recommendation
          </h3>

          <p className="mt-2 leading-7 text-purple-800">
            {report.practice}
          </p>
        </div>
      )}

      {/* Next Topic */}
      {report.nextTopic && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <h3 className="font-semibold text-indigo-900">
            → Recommended Next Topic
          </h3>

          <p className="mt-2 font-medium text-indigo-800">
            {report.nextTopic}
          </p>
        </div>
      )}

      {/* Continue */}
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800"
        >
          Continue Learning →
        </button>
      )}
    </div>
  );
}

export default AssessmentReport;