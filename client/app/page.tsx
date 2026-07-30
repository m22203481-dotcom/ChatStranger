export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black text-white">

      {/* Background Glow Effects */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>

      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>


      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6">

        <h1 className="text-3xl font-bold">
          StrangerConnect
        </h1>


        <div className="space-x-8 text-gray-300">

          <a 
            href="#about" 
            className="hover:text-white transition"
          >
            About
          </a>


          <a 
            href="#features" 
            className="hover:text-white transition"
          >
            Features
          </a>


          <a 
            href="/login" 
            className="hover:text-white transition"
          >
            Login
          </a>

        </div>

      </nav>



      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center mt-28 px-6">


        <h2 className="text-6xl font-extrabold leading-tight">
          Meet New People
          <br />
          Instantly
        </h2>


        <p className="mt-8 text-xl text-gray-400 max-w-2xl">
          Chat anonymously with strangers from around the world.
          No registration. No personal information. Just conversations.
        </p>


        <a
          href="/chat"
          className="
          mt-10
          inline-block
          rounded-full
          bg-blue-600
          hover:bg-blue-700
          hover:scale-105
          transition
          duration-300
          px-10
          py-5
          text-2xl
          font-semibold
          shadow-lg
          "
        >
          Start Chatting →
        </a>


      </section>



      {/* About Section */}
      <section
        id="about"
        className="relative z-10 mt-32 px-10 text-center"
      >

        <h2 className="text-4xl font-bold">
          What is StrangerConnect?
        </h2>


        <p className="mt-6 text-gray-400 text-lg max-w-3xl mx-auto">
          StrangerConnect is a platform where people can meet
          new strangers instantly through anonymous conversations.
          No profiles. No pressure. Just real conversations.
        </p>


      </section>




      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 px-10 pb-20"
      >


        <div
          className="
          rounded-2xl
          bg-gray-900
          p-6
          hover:-translate-y-2
          transition
          duration-300
          "
        >
          <h3 className="text-xl font-bold">
            Anonymous
          </h3>

          <p className="text-gray-400 mt-2">
            No signup required.
          </p>
        </div>



        <div
          className="
          rounded-2xl
          bg-gray-900
          p-6
          hover:-translate-y-2
          transition
          duration-300
          "
        >
          <h3 className="text-xl font-bold">
            Instant Match
          </h3>

          <p className="text-gray-400 mt-2">
            Connect in seconds.
          </p>
        </div>



        <div
          className="
          rounded-2xl
          bg-gray-900
          p-6
          hover:-translate-y-2
          transition
          duration-300
          "
        >
          <h3 className="text-xl font-bold">
            Secure
          </h3>

          <p className="text-gray-400 mt-2">
            Privacy comes first.
          </p>
        </div>



        <div
          className="
          rounded-2xl
          bg-gray-900
          p-6
          hover:-translate-y-2
          transition
          duration-300
          "
        >
          <h3 className="text-xl font-bold">
            Free
          </h3>

          <p className="text-gray-400 mt-2">
            Start chatting anytime.
          </p>
        </div>


      </section>




      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-20 py-10 text-center text-gray-500">


        <h3 className="text-xl font-bold text-white">
          StrangerConnect
        </h3>


        <p className="mt-3">
          Connect. Chat. Discover.
        </p>


        <p className="mt-6 text-sm">
          © 2026 StrangerConnect. All rights reserved.
        </p>


      </footer>


    </main>
  );
}