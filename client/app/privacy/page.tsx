export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <p className="text-gray-400 mb-8">
        Last Updated: August 2026
      </p>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Introduction
          </h2>
          <p>
            ChatStranger ("we", "our", or "us") respects your privacy.
            This Privacy Policy explains what information we collect,
            how we use it, and how we protect it when you use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Information We Collect
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Name, email address, and profile picture provided through Google Sign-In.</li>
            <li>Chat-related information required to operate the platform.</li>
            <li>Friend connections and friend requests.</li>
            <li>Reports, blocks, and moderation actions.</li>
            <li>Technical information such as IP address, browser type, device information, and usage logs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            How We Use Information
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>To provide and improve the service.</li>
            <li>To authenticate users.</li>
            <li>To connect users for conversations.</li>
            <li>To prevent abuse, spam, fraud, and harmful activity.</li>
            <li>To investigate reports and enforce platform rules.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Data Sharing
          </h2>
          <p>
            We do not sell personal information. Information may be shared
            with service providers that help operate the platform or when
            required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Data Security
          </h2>
          <p>
            We take reasonable measures to protect user information.
            However, no online service can guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            User Rights
          </h2>
          <p>
            You may contact us to request information about your account
            or request deletion of your data where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Contact
          </h2>
          <p>
            For privacy-related questions, contact:
            <br />
            m22203481@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}