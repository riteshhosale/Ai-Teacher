
import SceneAudio from "./SceneAudio";

function TeachingScene({ scene, language = "English" }) {
  if (!scene) return null;

  const visualType = scene.visualType || "text";

  const visualContent = scene.visualContent || "";

  const getText = () => {
    if (typeof visualContent === "string") return visualContent;
    return "";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* VISUAL AREA */}

      <div className="flex min-h-[360px] items-center justify-center bg-slate-950 p-8">

        {/* CODE */}

        {visualType === "code" && (
          <pre className="w-full max-w-3xl overflow-x-auto rounded-xl bg-slate-900 p-6 text-sm leading-7 text-green-300">
            <code>
              {typeof visualContent === "object"
                ? visualContent.code
                : visualContent}
            </code>
          </pre>
        )}

        {/* EQUATION */}

        {visualType === "equation" && (
          <div className="text-center">
            <h3 className="mb-4 text-lg text-indigo-300">
              {typeof visualContent === "object"
                ? visualContent.title
                : ""}
            </h3>

            <div className="text-4xl font-bold text-white">
              {typeof visualContent === "object"
                ? visualContent.equation
                : visualContent}
            </div>
          </div>
        )}

        {/* DIAGRAM */}

        {visualType === "diagram" && (
          <div className="flex max-w-4xl flex-wrap items-center justify-center gap-3">

            {(typeof visualContent === "object"
              ? visualContent.elements || []
              : getText().split("→")
            ).map((item, index, array) => (
              <div key={index} className="flex items-center gap-3">
                <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-4 text-center text-white">
                  {item}
                </div>

                {index < array.length - 1 && (
                  <span className="text-2xl text-indigo-400">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TIMELINE */}

        {visualType === "timeline" && (
          <div className="w-full max-w-4xl">

            <h3 className="mb-8 text-center text-xl font-bold text-white">
              {typeof visualContent === "object"
                ? visualContent.title
                : "Timeline"}
            </h3>

            <div className="flex flex-wrap justify-center gap-6">

              {(typeof visualContent === "object"
                ? visualContent.events || []
                : getText().split("→").map((x) => ({
                    year: "",
                    description: x.trim(),
                  }))
              ).map((event, index) => (
                <div
                  key={index}
                  className="flex w-36 flex-col items-center text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                    {index + 1}
                  </div>

                  <p className="mt-3 text-sm font-semibold text-indigo-300">
                    {event.year}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white">
                    {event.description}
                  </p>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* COMPARISON */}

        {visualType === "comparison" && (
          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">

            {(typeof visualContent === "object"
              ? visualContent.items || []
              : getText().split("|").map((x, i) => ({
                  title: i === 0 ? "Before" : "After",
                  points: [x.trim()],
                }))
            ).map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-slate-900 p-6"
              >
                <h3 className="mb-4 text-lg font-bold text-indigo-300">
                  {item.title}
                </h3>

                {(item.points || []).map((point, i) => (
                  <p key={i} className="mb-2 text-sm text-white">
                    • {point}
                  </p>
                ))}
              </div>
            ))}

          </div>
        )}

        {/* CHART */}

        {visualType === "chart" && (
          <div className="w-full max-w-3xl">

            <div className="flex h-64 items-end justify-center gap-4">

              {(typeof visualContent === "object"
                ? visualContent.data || []
                : [
                    { label: "1", value: 40 },
                    { label: "2", value: 65 },
                    { label: "3", value: 85 },
                    { label: "4", value: 55 },
                    { label: "5", value: 95 },
                  ]
              ).map((item, index) => (
                <div
                  key={index}
                  className="flex w-12 flex-col items-center"
                >
                  <div
                    className="w-full rounded-t-lg bg-indigo-500"
                    style={{
                      height: `${item.value}%`,
                    }}
                  />

                  <span className="mt-2 text-xs text-slate-300">
                    {item.label}
                  </span>
                </div>
              ))}

            </div>

            {typeof visualContent === "object" && (
              <p className="mt-4 text-center text-sm text-slate-300">
                {visualContent.title}
              </p>
            )}

          </div>
        )}

        {/* IMAGE */}

        {visualType === "image" && (
          <div className="text-center">
            <div className="text-7xl">🖼️</div>

            <p className="mt-5 max-w-xl text-lg text-white">
              {getText() || scene.title}
            </p>
          </div>
        )}

        {/* TEXT */}

        {visualType === "text" && (
          <div className="text-center">
            <div className="text-7xl">👨‍🏫</div>

            <h2 className="mt-5 text-3xl font-bold text-white">
              {getText() || scene.title}
            </h2>
          </div>
        )}

      </div>

      {/* SCENE INFORMATION */}

      <div className="p-6">

        <div className="flex flex-wrap items-center gap-3">

          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            {scene.type || "Teaching"}
          </p>

          {scene.duration && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              {scene.duration}s
            </span>
          )}

        </div>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {scene.title}
        </h2>

        {scene.script && (
          <div className="mt-5 rounded-xl bg-slate-50 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                👨‍🏫
              </div>

              <div>
                <p className="text-sm font-semibold">
                  AI Teacher
                </p>

                <p className="text-xs text-slate-500">
                  {language}
                </p>
              </div>

            </div>

            <p className="mt-4 leading-7 text-slate-600">
              {scene.script}
            </p>

          </div>
        )}

        {scene.script && (
          <div className="mt-5">
            <SceneAudio
              script={scene.script}
              language={language}
              autoPlay={true}
            />
          </div>
        )}

        {scene.onScreenText && (
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              On Screen
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {Array.isArray(scene.onScreenText)
                ? scene.onScreenText.join(" ")
                : scene.onScreenText}
            </p>

          </div>
        )}

      </div>
    </div>
  );
}

export default TeachingScene;