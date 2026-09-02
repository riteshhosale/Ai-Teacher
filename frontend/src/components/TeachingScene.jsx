import SubjectVisual from "./SubjectVisual";
import SceneAudio from "./SceneAudio";

function TeachingScene({
  scene,
  language = "English",
}) {
  if (!scene || typeof scene !== "object") {
    return null;
  }

  const sceneTitle =
    typeof scene.title === "string"
      ? scene.title.trim()
      : "";

  const sceneType =
    typeof scene.type === "string"
      ? scene.type.trim()
      : "Teaching";

  const sceneScript =
    typeof scene.script === "string"
      ? scene.script.trim()
      : "";

  const sceneDuration =
    Number.isFinite(Number(scene.duration)) &&
    Number(scene.duration) >= 0
      ? Number(scene.duration)
      : null;

  const normalizedLanguage =
    typeof language === "string" &&
    language.trim()
      ? language.trim()
      : "English";

  const onScreenText = Array.isArray(
    scene.onScreenText
  )
    ? scene.onScreenText.filter(
        (text) =>
          typeof text === "string" &&
          text.trim()
      )
    : typeof scene.onScreenText === "string" &&
        scene.onScreenText.trim()
      ? [scene.onScreenText.trim()]
      : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* =====================================================
          VISUAL
      ===================================================== */}

      <div className="border-b border-slate-100 bg-slate-50 p-4 sm:p-6">
        <SubjectVisual scene={scene} />
      </div>

      {/* =====================================================
          SCENE INFORMATION
      ===================================================== */}

      <div className="p-5 sm:p-6">
        {/* Scene metadata */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            {sceneType}
          </span>

          {sceneDuration !== null && (
            <span className="text-xs text-slate-400">
              {sceneDuration}s
            </span>
          )}
        </div>

        {/* Title */}
        {sceneTitle && (
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {sceneTitle}
          </h2>
        )}

        {/* =====================================================
            TEACHER SCRIPT
        ===================================================== */}

        {sceneScript && (
          <section className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700">
                AI
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  AI Teacher
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  {normalizedLanguage}
                </p>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
              {sceneScript}
            </p>
          </section>
        )}

        {/* =====================================================
            AUDIO
        ===================================================== */}

        {sceneScript && (
          <div className="mt-5">
            <SceneAudio
              script={sceneScript}
              language={normalizedLanguage}
              autoPlay={false}
            />
          </div>
        )}

        {/* =====================================================
            ON-SCREEN TEXT
        ===================================================== */}

        {onScreenText.length > 0 && (
          <section className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              On-screen text
            </p>

            <div className="mt-3 space-y-2">
              {onScreenText.map(
                (text, index) => (
                  <p
                    key={`${text}-${index}`}
                    className="text-sm font-medium leading-6 text-slate-800"
                  >
                    {text.trim()}
                  </p>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

export default TeachingScene;