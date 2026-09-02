function SubjectVisual({ scene }) {
  if (!scene || typeof scene !== "object") {
    return null;
  }

  const visualType =
    typeof scene.visualType === "string"
      ? scene.visualType.trim().toLowerCase()
      : "";

  if (!visualType) {
    return null;
  }

  const visualContent =
    scene.visualContent &&
    typeof scene.visualContent === "object" &&
    !Array.isArray(scene.visualContent)
      ? scene.visualContent
      : {};

  const getText = (value, fallback = "") => {
    if (typeof value !== "string") {
      return fallback;
    }

    return value.trim() || fallback;
  };

  const getArray = (value) => {
    return Array.isArray(value) ? value : [];
  };

  const title =
    getText(scene.title) || "Visual";

  const onScreenText = getArray(
    scene.onScreenText
  ).filter(
    (text) =>
      typeof text === "string" &&
      text.trim()
  );

  switch (visualType) {
    // =====================================================
    // EQUATION
    // =====================================================

    case "equation": {
      const equation =
        getText(visualContent.equation) ||
        onScreenText.join(" ");

      if (!equation) {
        return null;
      }

      return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Equation
          </p>

          <h3 className="mt-2 text-base font-semibold text-slate-900">
            {getText(
              visualContent.title,
              "Formula"
            )}
          </h3>

          <div className="mt-6 overflow-x-auto text-center">
            <span className="whitespace-nowrap font-mono text-2xl font-semibold text-slate-900 sm:text-3xl">
              {equation}
            </span>
          </div>
        </section>
      );
    }

    // =====================================================
    // DIAGRAM
    // =====================================================

    case "diagram": {
      const elements = getArray(
        visualContent.elements
      ).filter(
        (element) =>
          typeof element === "string" &&
          element.trim()
      );

      if (elements.length === 0) {
        return null;
      }

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">
            {getText(
              visualContent.title,
              title
            )}
          </h3>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {elements.map(
              (element, index) => (
                <div
                  key={`${element}-${index}`}
                  className="flex items-center gap-3"
                >
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                    {element.trim()}
                  </div>

                  {index <
                    elements.length - 1 && (
                    <span
                      className="text-slate-400"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      );
    }

    // =====================================================
    // TIMELINE
    // =====================================================

    case "timeline": {
      const events = getArray(
        visualContent.events
      ).filter(
        (event) =>
          event &&
          typeof event === "object" &&
          !Array.isArray(event)
      );

      if (events.length === 0) {
        return null;
      }

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">
            {getText(
              visualContent.title,
              "Timeline"
            )}
          </h3>

          <div className="mt-6 space-y-6">
            {events.map(
              (event, index) => {
                const year = getText(
                  event.year,
                  `${index + 1}`
                );

                const description =
                  getText(
                    event.description
                  );

                return (
                  <div
                    key={`${year}-${index}`}
                    className="flex gap-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {year}
                      </p>

                      {description && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      );
    }

    // =====================================================
    // COMPARISON
    // =====================================================

    case "comparison": {
      const items = getArray(
        visualContent.items
      ).filter(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item)
      );

      if (items.length === 0) {
        return null;
      }

      return (
        <section>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(
              (item, index) => {
                const itemTitle = getText(
                  item.title,
                  `Option ${index + 1}`
                );

                const points = getArray(
                  item.points
                ).filter(
                  (point) =>
                    typeof point ===
                      "string" &&
                    point.trim()
                );

                return (
                  <div
                    key={`${itemTitle}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                  >
                    <h3 className="text-base font-semibold text-slate-900">
                      {itemTitle}
                    </h3>

                    {points.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {points.map(
                          (
                            point,
                            pointIndex
                          ) => (
                            <li
                              key={`${point}-${pointIndex}`}
                              className="flex gap-3 text-sm leading-6 text-slate-600"
                            >
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                                aria-hidden="true"
                              />

                              <span>
                                {point.trim()}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>
      );
    }

    // =====================================================
    // CODE
    // =====================================================

    case "code": {
      const code =
        typeof visualContent.code ===
        "string"
          ? visualContent.code
          : "";

      if (!code.trim()) {
        return null;
      }

      const codeLanguage = getText(
        visualContent.language,
        "Code"
      );

      const output =
        typeof visualContent.output ===
        "string"
          ? visualContent.output
          : "";

      return (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div className="border-b border-slate-800 px-4 py-3">
            <span className="font-mono text-xs text-slate-400">
              {codeLanguage}
            </span>
          </div>

          <pre className="overflow-x-auto p-5 text-sm leading-7 text-slate-200">
            <code>{code}</code>
          </pre>

          {output.trim() && (
            <div className="border-t border-slate-800">
              <div className="px-4 pt-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  Output
                </p>
              </div>

              <pre className="overflow-x-auto p-5 pt-3 text-sm leading-6 text-slate-300">
                {output}
              </pre>
            </div>
          )}
        </section>
      );
    }

    // =====================================================
    // CHART
    // =====================================================

    case "chart": {
      const rawData = getArray(
        visualContent.data
      );

      const data = rawData
        .map((item) => {
          if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
          ) {
            return null;
          }

          const value = Number(item.value);

          if (!Number.isFinite(value)) {
            return null;
          }

          return {
            label: getText(
              item.label,
              "Item"
            ),
            value: Math.max(0, value),
          };
        })
        .filter(Boolean);

      if (data.length === 0) {
        return null;
      }

      const max = Math.max(
        ...data.map((item) => item.value),
        1
      );

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">
            {getText(
              visualContent.title,
              "Chart"
            )}
          </h3>

          <div className="mt-6 space-y-5">
            {data.map(
              (item, index) => {
                const percentage = Math.min(
                  100,
                  Math.max(
                    0,
                    (item.value / max) *
                      100
                  )
                );

                return (
                  <div
                    key={`${item.label}-${index}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="min-w-0 truncate text-slate-600">
                        {item.label}
                      </span>

                      <span className="shrink-0 font-medium text-slate-900">
                        {item.value}
                      </span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={item.value}
                      aria-valuemin={0}
                      aria-valuemax={max}
                      aria-label={item.label}
                    >
                      <div
                        className="h-full rounded-full bg-slate-800 transition-[width] duration-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      );
    }

    // =====================================================
    // DEFAULT
    // =====================================================

    default: {
      if (onScreenText.length === 0) {
        return null;
      }

      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">
            {title}
          </h3>

          <div className="mt-4 space-y-2">
            {onScreenText.map(
              (text, index) => (
                <p
                  key={`${text}-${index}`}
                  className="text-sm leading-7 text-slate-600"
                >
                  {text.trim()}
                </p>
              )
            )}
          </div>
        </section>
      );
    }
  }
}

export default SubjectVisual;