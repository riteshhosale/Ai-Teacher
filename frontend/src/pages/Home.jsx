import { Link } from "react-router-dom";

// import member1 from "../assets/member1.jpg";
import member2 from "../assets/member_image/member2.jpg";
// import member3 from "../assets/member3.jpg";
// import member4 from "../assets/member4.jpg";

function Home() {
  const teamMembers = [
    {
      name: "Member 1",
      role: "Frontend Developer",
      //image: member1,
      contribution:
        "Designed and developed the user interface, responsive pages, and frontend components using React and Tailwind CSS.",
    },
    {
      name: "Member 2",
      role: "Backend Developer",
      image: member2,
      contribution:
        "Developed the backend APIs, authentication system, database connection, and server-side functionality.",
    },
    {
      name: "Member 3",
      role: "AI & Research",
      //image: member3,
      contribution:
        "Worked on problem research, AI-related features, data analysis, and improving the project's core solution.",
    },
    {
      name: "Member 4",
      role: "Presentation & Documentation",
      //image: member4,
      contribution:
        "Handled project documentation, presentation, testing, project planning, and overall hackathon coordination.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">

            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                H
              </span>
            </div>

            <span className="text-xl font-bold">
              Hunter<span className="text-indigo-600">Z</span>
            </span>

          </Link>

          {/* Buttons */}
          <div className="flex items-center gap-3">

            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium
              text-gray-700 hover:text-indigo-600 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-indigo-600
              text-white text-sm font-medium
              hover:bg-indigo-700 transition"
            >
              Register
            </Link>

          </div>

        </div>
      </nav>


      {/* Main */}
      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">

          <span className="inline-block px-4 py-2 mb-5 rounded-full
          bg-indigo-100 text-indigo-700 text-sm font-medium">
            🚀 Hackathon Project
          </span>

          <h1 className="text-4xl md:text-5xl font-bold">
            Meet Our Team
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-gray-500 leading-7">
            Four students, one idea, and a shared goal to build
            something meaningful through technology.
          </p>

        </section>


        {/* Team */}
        <section className="max-w-6xl mx-auto px-6 pb-16">

          <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-4 gap-6">

            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200
                rounded-2xl p-6 text-center shadow-sm
                hover:shadow-lg hover:-translate-y-1
                transition duration-300"
              >

                {/* Member Image */}
                <div className="flex justify-center">

                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover
                    border-4 border-indigo-100 p-0"
                  />

                </div>

                {/* Name */}
                <h2 className="mt-5 text-xl font-bold">
                  {member.name}
                </h2>

                {/* Role */}
                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  {member.role}
                </p>

                {/* Contribution */}
                <p className="mt-4 text-sm text-gray-500 leading-6">
                  {member.contribution}
                </p>

              </div>
            ))}

          </div>

        </section>


        {/* Project Section */}
        <section className="bg-white border-y border-gray-200">

          <div className="max-w-4xl mx-auto px-6 py-12 text-center">

            <h2 className="text-2xl font-bold">
              About Our Project
            </h2>

            <p className="mt-4 text-gray-500 leading-7">
              Our team combines frontend development, backend
              engineering, AI research, and project management
              to create a practical solution to a real-world problem.
            </p>

          </div>

        </section>

      </main>


      {/* Footer */}
      <footer className="bg-gray-900 text-white">

        <div className="max-w-6xl mx-auto px-6 py-8">

          <div className="flex flex-col md:flex-row
          items-center justify-between gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-lg bg-indigo-600
              flex items-center justify-center">

                <span className="font-bold">
                  H
                </span>

              </div>

              <span className="font-bold">
                Hunter<span className="text-indigo-600">Z</span>
              </span>

            </div>

            <p className="text-sm text-gray-400">
              © 2026 HunterZ. Hackathon Project.
            </p>

            <p className="text-sm text-gray-400">
              Built by Team HunterZ
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Home;