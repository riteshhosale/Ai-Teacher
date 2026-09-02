function SubjectVisual({ scene }) {
  if (!scene?.visualType) {
    return null;
  }

  const visualContent = scene.visualContent || {};

  switch (scene.visualType) {
    case "equation":
      return (
        <div className="rounded-2xl bg-slate-900 p-8 text-center">
          <h3 className="mb-5 text-lg font-semibold text-white">
            {visualContent.title || "Equation"}
          </h3>

          <div className="text-3xl font-bold text-white">
            {visualContent.equation ||
              scene.onScreenText?.join(" ")}
          </div>
        </div>
      );

    case "diagram":
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-center text-xl font-bold text-slate-900">
            {visualContent.title || scene.title}
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {(visualContent.elements || []).map(
              (element, index, array) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium text-slate-800">
                    {element}
                  </div>

                  {index < array.length - 1 && (
                    <span className="text-2xl text-indigo-500">
                      →
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-bold text-slate-900">
            {visualContent.title || "Timeline"}
          </h3>

          <div className="space-y-5">
            {(visualContent.events || []).map(
              (event, index) => (
                <div
                  key={index}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {event.year}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {event.description}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      );

    case "comparison":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {(visualContent.items || []).map(
            (item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {item.title}
                </h3>

                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {(item.points || []).map(
                    (point, pointIndex) => (
                      <li key={pointIndex}>
                        • {point}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )
          )}
        </div>
      );

    case "code":
      return (
        <div className="overflow-hidden rounded-2xl bg-slate-950">
          <div className="border-b border-slate-800 px-5 py-3 text-sm text-slate-400">
            {visualContent.language || "Code"}
          </div>

          <pre className="overflow-x-auto p-6 text-sm leading-7 text-white">
            <code>
              {visualContent.code || ""}
            </code>
          </pre>

          {visualContent.output && (
            <div className="border-t border-slate-800 p-5">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Output
              </p>

              <pre className="text-sm text-white">
                {visualContent.output}
              </pre>
            </div>
          )}
        </div>
      );

    case "chart": {
      const data = visualContent.data || [];

      const max = Math.max(
        ...data.map((item) => Number(item.value) || 0),
        1
      );

      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-bold text-slate-900">
            {visualContent.title || "Chart"}
          </h3>

          <div className="space-y-4">
            {data.map((item, index) => {
              const value = Number(item.value) || 0;

              return (
                <div key={index}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700">
                      {item.label}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {value}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{
                        width: `${(value / max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            {scene.title}
          </h3>

          {(scene.onScreenText || []).map(
            (text, index) => (
              <p
                key={index}
                className="mt-2 text-slate-600"
              >
                {text}
              </p>
            )
          )}
        </div>
      );
  }
}

export default SubjectVisual;