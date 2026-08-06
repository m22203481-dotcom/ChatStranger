import Link from "next/link";

export const metadata = {
  title: "Chat With Strangers Online Instantly | ChatStranger",
  description:
    "Chat with strangers online for free. Meet new people, start anonymous conversations, and connect instantly with people around the world on ChatStranger.",
};

export default function ChatWithStrangersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-6 py-16">
      
      <div className="max-w-4xl mx-auto text-center">

        <h1 className="text-5xl md:text-6xl font-extrabold">
          Chat With Strangers Online Instantly
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          ChatStranger helps you meet new people and start anonymous
          conversations with strangers from around the world.
          No complicated profiles. No pressure. Just real conversations.
        </p>

        <Link
          href="/login"
          className="inline-block mt-10 rounded-full bg-blue-600 hover:bg-blue-700 px-10 py-5 text-xl font-semibold transition"
        >
          Start Chatting →
        </Link>

      </div>


      <section className="max-w-4xl mx-auto mt-20 space-y-12">

        <div>
          <h2 className="text-3xl font-bold">
            Meet New People Through Anonymous Chat
          </h2>

          <p className="mt-4 text-gray-300 text-lg">
            ChatStranger gives you a simple way to talk with strangers online.
            Whether you want to make new friends, discover different
            perspectives, or simply have an interesting conversation,
            you can connect instantly.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            How Chat With Strangers Works
          </h2>

          <p className="mt-4 text-gray-300 text-lg">
            Start by entering ChatStranger, choose your interests, and get
            matched with someone who shares similar topics. Once connected,
            you can begin chatting in real time.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Why Use ChatStranger?
          </h2>

          <ul className="mt-4 space-y-3 text-gray-300 text-lg">
            <li>✓ Anonymous conversations</li>
            <li>✓ Meet people worldwide</li>
            <li>✓ Interest-based matching</li>
            <li>✓ Free online chatting</li>
            <li>✓ Privacy-focused experience</li>
          </ul>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Start Talking Today
          </h2>

          <p className="mt-4 text-gray-300 text-lg">
            Discover new conversations and meet interesting people online.
            ChatStranger makes it easy to start chatting with strangers
            instantly.
          </p>
        </div>
       <div>
  <h2 className="text-3xl font-bold">
    Explore More Ways To Chat
  </h2>

  <div className="mt-6 flex flex-col gap-3 text-blue-400">
    <Link href="/anonymous-chat" className="hover:underline">
      Try Anonymous Chat Online →
    </Link>

    <Link href="/random-chat" className="hover:underline">
      Start Random Chat →
    </Link>
  </div>
</div>
      </section>

    </main>
  );
}