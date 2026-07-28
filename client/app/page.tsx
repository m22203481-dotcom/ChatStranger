export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">

      <nav className="flex items-center justify-between px-10 py-6">
        <h1 className="text-3xl font-bold">StrangerConnect</h1>

        <div className="space-x-8 text-gray-300">
          <a href="#">About</a>
          <a href="#">Features</a>
          <a href="#">Login</a>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center mt-28 px-6">

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
  className="mt-10 inline-block rounded-full bg-blue-600 hover:bg-blue-700 transition px-10 py-5 text-2xl font-semibold"
>
  Start Chatting →
</a>

      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 px-10 pb-20">

        <div className="rounded-2xl bg-gray-900 p-6">
          <h3 className="text-xl font-bold">Anonymous</h3>
          <p className="text-gray-400 mt-2">
            No signup required.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-900 p-6">
          <h3 className="text-xl font-bold">Instant Match</h3>
          <p className="text-gray-400 mt-2">
            Connect in seconds.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-900 p-6">
          <h3 className="text-xl font-bold">Secure</h3>
          <p className="text-gray-400 mt-2">
            Privacy comes first.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-900 p-6">
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-gray-400 mt-2">
            Start chatting anytime.
          </p>
        </div>

      </section>

    </main>
  );
}