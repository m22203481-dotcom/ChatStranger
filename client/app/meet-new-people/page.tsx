import Link from "next/link";

export const metadata = {
  title: "Meet New People Online Instantly | ChatStranger",
  description:
    "Meet new people online through anonymous conversations. ChatStranger helps you connect with interesting people from around the world and start real conversations instantly.",
};

const faqs = [
  {
    q: "How can I meet new people online?",
    a: "ChatStranger helps you connect with new people through instant anonymous conversations and interest-based matching.",
  },
  {
    q: "Is ChatStranger free?",
    a: "Yes. ChatStranger is free to use and allows you to meet and chat with people online.",
  },
  {
    q: "Can I meet people with similar interests?",
    a: "Yes. Interest-based matching helps connect users who enjoy similar topics and hobbies.",
  },
  {
    q: "Do I need to create an account?",
    a: "You can start chatting without sharing personal information. Additional features may be available with an account.",
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

export default function MeetNewPeoplePage() {
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
          Meet New People Online Instantly
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          Discover conversations with people from different backgrounds,
          cultures, and interests. ChatStranger makes it easy to meet new
          people and build genuine connections online.
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
            Why Meet New People Online?
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Online conversations allow you to connect with people you may
            never encounter in daily life. Every conversation can introduce
            you to new ideas, perspectives, and friendships.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Find People Who Share Your Interests
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            Interest-based matching helps create more meaningful conversations
            by connecting you with people who enjoy similar topics.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Safe and Anonymous Conversations
          </h2>

          <p className="mt-4 text-lg text-gray-300">
            ChatStranger focuses on privacy and gives you control over what
            information you choose to share.
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
            Explore More
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
          </div>
        </div>

      </section>

    </main>
  );
}