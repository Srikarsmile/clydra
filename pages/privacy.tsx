import Layout from "../components/Layout";

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>
        <div className="prose prose-lg text-neutralDark">
          <p>
            Your privacy is important to us. This privacy policy explains how
            Rivo Labs collects, uses, and protects your information.
          </p>
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as when you
            create an account, use our services, or contact us for support.
          </p>
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            How We Use Your Information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve
            our services, process transactions, and communicate with you.
          </p>
        </div>
      </div>
    </Layout>
  );
}
