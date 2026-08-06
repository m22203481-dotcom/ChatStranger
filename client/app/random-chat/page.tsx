import Link from "next/link";

export const metadata = {
  title: "Random Chat Online - Meet New People Instantly | ChatStranger",
  description:
    "Try random chat online with ChatStranger. Meet new people, talk with strangers, and start instant anonymous conversations from anywhere in the world.",
};

export default function RandomChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-6 py-16">

      <div className="max-w-4xl mx-auto text-center">

        <h1 className="text-5xl md:text-6xl font-extrabold">
          Random Chat Online With New People
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          ChatStranger makes random chatting simple. Connect with strangers,
          discover new conversations, and meet interesting people instantly
          through anonymous online chat.
        </p>

        <Link
          href="/login"
          className="inline-block mt-10 rounded-full bg-blue-600 hover:bg-blue-700 px-10 py-5 text-xl font-semibold transition"
        >
          Start Random Chat →
        </Link>

      </div>


      <section className="max-w-4xl mx-auto mt-20 space-y-12">

        <div>
          <h2 className="text-3xl font-bold">
            What Is Random Chat?
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Random chat connects you with people you may have never met before.
            It creates opportunities for unexpected conversations, new ideas,
            and meaningful connections.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            How Random Chat Works on ChatStranger
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Start ChatStranger, choose your interests, and get matched with
            another person who is ready to chat. Your conversation begins
            instantly in real time.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Why People Enjoy Random Conversations
          </h2>

          <ul className="mt-4 space-y-3 text-lg text-gray-300">
            <li>✓ Meet people from around the world</li>
            <li>✓ Discover different cultures and opinions</li>
            <li>✓ Have spontaneous conversations</li>
            <li>✓ Find people with similar interests</li>
            <li>✓ Chat without complicated profiles</li>
          </ul>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Safe and Simple Random Chat
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            ChatStranger includes reporting tools and privacy-focused features
            to help create a better chatting experience. Always choose what
            information you share during conversations.
          </p>
        </div>


        <div>
          <h2 className="text-3xl font-bold">
            Start Your Random Chat Today
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Every conversation is a chance to meet someone new. Start chatting
            and discover who you will connect with next.
          </p>
        </div>

      </section>
      <div>
  <h2 className="text-3xl font-bold">
    More Ways To Meet People
  </h2>

  <div className="mt-6 flex flex-col gap-3 text-blue-400">
    <Link href="/chat-with-strangers" className="hover:underline">
      Chat With Strangers →
    </Link>

    <Link href="/anonymous-chat" className="hover:underline">
      Anonymous Chat →
    </Link>
  </div>
</div>
    </main>
  );
}