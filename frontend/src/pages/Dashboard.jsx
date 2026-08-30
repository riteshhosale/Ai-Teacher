import { Link } from "react-router-dom";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black-600">
              <span className="font-bold text-white">
                AI
              </span>
            </div>

            <span className="text-lg font-bold">
              AI<span className="text-indigo-600">Teacher</span>
            </span>

          </Link>


          {/* Right side */}
          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {user?.name || "Student"}
              </p>

              <p className="text-xs text-slate-500">
                Student
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-4 py-2
              text-sm font-medium text-slate-600
              transition hover:bg-slate-100"
            >
              Logout
            </button>

          </div>

        </div>

      </nav>


      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-5 py-10">

        {/* Welcome */}
        <section>

          <p className="text-sm font-semibold text-indigo-600">
            STUDENT DASHBOARD
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Welcome back, {user?.name || "Student"}!
          </h1>

          <p className="mt-2 text-slate-500">
            What would you like to learn today?
          </p>

        </section>


        {/* START LEARNING */}
        <section className="mt-8">

          <div className="rounded-2xl bg-indigo-600 p-7 text-white sm:p-9">

            <div className="max-w-2xl">

              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                AI-POWERED LEARNING
              </span>

              <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                Start a new lesson
              </h2>

              <p className="mt-3 leading-7 text-indigo-100">
                Upload your study material or enter a topic.
                Your AI Teacher can create a personalized learning
                experience based on your needs.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <Link
                  to="/learn"
                  className="rounded-lg bg-white px-6 py-3 text-center
                  font-semibold text-indigo-600 transition
                  hover:bg-indigo-50"
                >
                  Start Learning
                </Link>

                <Link
                  to="/upload"
                  className="rounded-lg border border-white/30
                  px-6 py-3 text-center font-semibold
                  transition hover:bg-white/10"
                >
                  Upload Material
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* QUICK OPTIONS */}
        <section className="mt-8">

          <h2 className="text-xl font-bold">
            Choose how you want to learn
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">

            {/* Topic */}
            <Link
              to="/learn"
              className="group rounded-2xl border border-slate-200
              bg-white p-6 shadow-sm transition
              hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center
              rounded-full bg-indigo-50 text-2xl">
                📚
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Learn a Topic
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter any topic and let your AI Teacher create
                a lesson for you.
              </p>

              <p className="mt-4 text-sm font-semibold text-indigo-600">
                Start →
              </p>

            </Link>


            {/* Upload */}
            <Link
              to="/upload"
              className="group rounded-2xl border border-slate-200
              bg-white p-6 shadow-sm transition
              hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center
              rounded-xl bg-purple-50 text-2xl">
                📄
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Upload Material
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload notes or learning material and learn
                directly from your content.
              </p>

              <p className="mt-4 text-sm font-semibold text-indigo-600">
                Upload →
              </p>

            </Link>


            {/* Practice */}
            <Link
              to="/practice"
              className="group rounded-2xl border border-slate-200
              bg-white p-6 shadow-sm transition
              hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center
              rounded-xl bg-green-50 text-2xl">
                🧠
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Practice
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Test your understanding with questions and
                evaluate your progress.
              </p>

              <p className="mt-4 text-sm font-semibold text-indigo-600">
                Practice →
              </p>

            </Link>

          </div>

        </section>


        {/* PROGRESS */}
        <section className="mt-10">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Your Learning Progress
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep learning and improve your skills.
              </p>
            </div>

            <Link
              to="/progress"
              className="hidden text-sm font-semibold text-indigo-600 sm:block"
            >
              View Progress →
            </Link>

          </div>


          <div className="mt-5 grid gap-5 sm:grid-cols-3">

            {/* Lessons */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">

              <p className="text-sm text-slate-500">
                Lessons Completed
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>

            </div>


            {/* Quiz */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">

              <p className="text-sm text-slate-500">
                Quizzes Completed
              </p>

              <p className="mt-2 text-3xl font-bold">
                0
              </p>

            </div>


            {/* Learning Time */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">

              <p className="text-sm text-slate-500">
                Learning Time
              </p>

              <p className="mt-2 text-3xl font-bold">
                0h
              </p>

            </div>

          </div>

        </section>


        {/* HOW IT WORKS */}
        <section className="mt-12 rounded-2xl border border-slate-200
        bg-white p-7 sm:p-9">

          <div className="text-center">

            <p className="text-sm font-semibold text-indigo-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Learn with your AI Teacher
            </h2>

          </div>


          <div className="mt-8 grid gap-8 md:grid-cols-4">

            <Step
              number="01"
              title="Choose"
              text="Enter a topic or upload your learning material."
            />

            <Step
              number="02"
              title="Plan"
              text="Your AI Teacher creates a personalized lesson."
            />

            <Step
              number="03"
              title="Learn"
              text="Understand concepts through explanations and examples."
            />

            <Step
              number="04"
              title="Evaluate"
              text="Answer questions and receive adaptive feedback."
            />

          </div>

        </section>

      </main>

    </div>
  );
}


/* STEP COMPONENT */

function Step({ number, title, text }) {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center
      rounded-full bg-indigo-600 text-sm font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {text}
      </p>

    </div>
  );
}

export default Dashboard;