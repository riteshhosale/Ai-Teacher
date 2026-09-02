import { Link } from "react-router-dom";

import member1 from "../assets/member_image/member1.jpg";
import member2 from "../assets/member_image/member2.jpg";
import member3 from "../assets/member_image/member-3.jpeg";
import member4 from "../assets/member_image/member4.jpg";

const TEAM_MEMBERS = [
  {
    id: "member-1",
    name: "Member 1",
    role: "Full Stack Developer",
    image: member1,
    contribution:
      "Designed and developed the complete web application, including the React frontend, Tailwind CSS UI, Express.js backend, REST APIs, authentication, and MongoDB integration.",
  },
  {
    id: "member-2",
    name: "Member 2",
    role: "Cyber Security Specialist",
    image: member2,
    contribution:
      "Focused on application security, authentication, data protection, vulnerability analysis, secure API practices, and identifying potential cyber security risks.",
  },
  {
    id: "member-3",
    name: "Member 3",
    role: "AI & Research",
    image: member3,
    contribution:
      "Worked on problem research, AI-related features, data analysis, and improving the core solution of the project.",
  },
  {
    id: "member-4",
    name: "Member 4",
    role: "Presentation & Testing",
    image: member4,
    contribution:
      "Handled project documentation, presentation, testing, project planning, and overall hackathon coordination.",
  },
];

function Logo({ footer = false }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center ${
          footer ? "h-8 w-8" : "h-9 w-9"
        } rounded-lg bg-indigo-600`}
        aria-hidden="true"
      >
        <span className={`font-bold text-white ${footer ? "" : "text-lg"}`}>
          H
        </span>
      </div>

      <span className={`font-bold ${footer ? "" : "text-xl"}`}>
        Hunter<span className="text-indigo-600">Z</span>
      </span>
    </div>
  );
}

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            aria-label="HunterZ home"
            className="rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Logo />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 text-center">
          <span className="mb-5 inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            Hackathon Project
          </span>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Meet Our Team
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-500">
            Four students, one idea, and a shared goal to build something
            meaningful through technology.
          </p>
        </section>

        {/* Team */}
        <section
          className="mx-auto max-w-6xl px-6 pb-16"
          aria-labelledby="team-heading"
        >
          <h2 id="team-heading" className="sr-only">
            Our Team
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM_MEMBERS.map((member) => (
              <article
                key={member.id}
                className="group rounded-2xl border border-gray-200 bg-white p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-indigo-200"
              >
                <div className="flex justify-center pt-4">
                  <img
                    src={member.image}
                    alt={`${member.name} - ${member.role}`}
                    loading="lazy"
                    className="h-28 w-28 rounded-full border-4 border-indigo-100 object-cover object-top transition duration-300 group-hover:scale-105"
                  />
                </div>

                <h3 className="mt-5 text-xl font-bold">{member.name}</h3>

                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  {member.role}
                </p>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  {member.contribution}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Project */}
        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-12 text-center">
            <h2 className="text-2xl font-bold">About Our Project</h2>

            <p className="mt-4 leading-7 text-gray-500">
              Our team combines frontend development, backend engineering, AI
              research, and project management to create a practical solution
              to a real-world problem.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <Logo footer />

          <p className="text-sm text-gray-400">
            © 2026 HunterZ. Hackathon Project.
          </p>

          <p className="text-sm text-gray-400">Built by Team HunterZ</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;