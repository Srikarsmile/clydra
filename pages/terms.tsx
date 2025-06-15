import Layout from "../components/Layout";

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-lg text-neutralDark">
          <p>
            These Terms of Service govern your use of Rivo Labs and the services
            provided.
          </p>
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            Acceptance of Terms
          </h2>
          <p>
            By accessing and using this service, you accept and agree to be
            bound by the terms and provision of this agreement.
          </p>
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            Use License
          </h2>
          <p>
            Permission is granted to temporarily use Rivo Labs for personal,
            non-commercial transitory viewing only.
          </p>
        </div>
      </div>
    </Layout>
  );
}
