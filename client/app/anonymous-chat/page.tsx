import Link from "next/link";

export const metadata = {
  title: "Anonymous Chat Online - Talk With Strangers Privately | ChatStranger",
  description:
    "Try anonymous chat online for free with ChatStranger. Talk with strangers, meet new people, and start private conversations instantly without creating a profile.",
};

export default function AnonymousChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-6 py-16">

      <div className="max-w-4xl mx-auto text-center">

        <h1 className="text-5xl md:text-6xl font-extrabold">
          Anonymous Chat Online With Strangers
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          ChatStranger lets you start anonymous conversations with people
          around the world. No profiles, no pressure, and no need to share
          personal information.
        </p>

        <Link
          href="/login"
          className="inline-block mt-10 rounded-full bg-blue-600 hover:bg-blue-700 px-10 py-5 text-xl font-semibold transition"
        >
          Start Anonymous Chat →
        </Link>

      </div>


      <section className="max-w-4xl mx-auto mt-20 space-y-12">

        <div>
          <h2 className="text-3xl font-bold">
            What Is Anonymous Chat?
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Anonymous chat allows people to communicate without creating
            public profiles or revealing personal details. It gives you the
            freedom to have natural conversations and meet new people online.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            How ChatStranger Anonymous Chat Works
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Enter ChatStranger, choose your interests, and get matched with
            another person looking for a conversation. Once connected, you can
            chat instantly in a private environment.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Why Choose Anonymous Conversations?
          </h2>

          <ul className="mt-4 space-y-3 text-lg text-gray-300">
            <li>✓ Start conversations without creating a profile</li>
            <li>✓ Meet people from different backgrounds</li>
            <li>✓ Share interests and discover new perspectives</li>
            <li>✓ Enjoy private and casual conversations</li>
            <li>✓ Control what information you share</li>
          </ul>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Privacy Focused Chat Experience
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            ChatStranger is designed around privacy and simple conversations.
            You decide what you want to share while connecting with new people
            online.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Meet New People Today
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Start an anonymous chat and discover conversations with strangers
            who share your interests.
          </p>
        </div>

      </section>
      <div>
  <h2 className="text-3xl font-bold">
    Discover More Chat Options
  </h2>

  <div className="mt-6 flex flex-col gap-3 text-blue-400">
    <Link href="/chat-with-strangers" className="hover:underline">
      Chat With Strangers Online →
    </Link>

    <Link href="/random-chat" className="hover:underline">
      Try Random Chat →
    </Link>
  </div>
</div>
    </main>
  );
}