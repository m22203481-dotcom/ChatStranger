import Link from "next/link";

export const metadata = {
  title: "Make Friends Online | ChatStranger",
  description:
    "Make friends online through anonymous conversations and interest-based matching. Meet new people, discover shared interests, and build genuine connections on ChatStranger.",
};

const faqs = [
  {
    q: "How can I make friends online?",
    a: "ChatStranger helps you connect with new people through anonymous conversations and interest-based matching.",
  },
  {
    q: "Is ChatStranger free to use?",
    a: "Yes. ChatStranger is free to use and allows you to meet new people and make friends online.",
  },
  {
    q: "Can I find people with similar interests?",
    a: "Yes. Interest-based matching helps connect you with people who enjoy similar topics, hobbies, and conversations.",
  },
  {
    q: "Do I need to share personal information?",
    a: "No. ChatStranger is designed around privacy, and you choose what information you want to share.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function MakeFriendsOnlinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />

      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold">
          Make Friends Online
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          Meeting new people has never been easier. ChatStranger helps you make
          friends online through anonymous conversations, shared interests, and
          meaningful connections with people from around the world.
        </p>

        <Link
          href="/login"
          className="inline-block mt-10 rounded-full bg-blue-600 hover:bg-blue-700 px-10 py-5 text-xl font-semibold transition"
        >
          Start Meeting People →
        </Link>
      </div>

      <section className="max-w-4xl mx-auto mt-20 space-y-12">
        <div>
          <h2 className="text-3xl font-bold">
            Why Make Friends Online?
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Online friendships allow you to connect with people from different
            backgrounds, cultures, and experiences. A simple conversation can
            lead to lasting friendships and meaningful connections.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Connect Through Shared Interests
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Interest-based matching helps you find people who enjoy similar
            hobbies, topics, and passions. This creates more engaging and
            natural conversations from the start.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            A Comfortable Way To Meet People
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Anonymous chatting removes pressure and allows conversations to
            focus on personality, interests, and genuine interaction rather
            than appearances.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Safe and Private Conversations
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            ChatStranger includes privacy-focused features and reporting tools
            to help create a better experience while meeting new people online.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Frequently Asked Questions
          </h2>

          <div className="mt-6 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-xl font-semibold">
                  {faq.q}
                </h3>

                <p className="mt-2 text-gray-300">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Explore More Ways To Connect
          </h2>

          <div className="mt-6 flex flex-col gap-3 text-blue-400">
            <Link href="/chat-with-strangers" className="hover:underline">
              Chat With Strangers →
            </Link>

            <Link href="/anonymous-chat" className="hover:underline">
              Anonymous Chat →
            </Link>

            <Link href="/random-chat" className="hover:underline">
              Random Chat →
            </Link>

            <Link href="/meet-new-people" className="hover:underline">
              Meet New People →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}