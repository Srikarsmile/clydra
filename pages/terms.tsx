import Layout from "../components/Layout";

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Terms of Service
        </h1>
        <p className="text-gray-600 mb-6">
          These Terms of Service govern your use of Clydra Labs and the services
          provided by our platform.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 mb-4">
              By accessing and using this service, you accept and agree to be
              bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Use License
            </h2>
            <p className="text-gray-600 mb-4">
              Permission is granted to temporarily use Clydra Labs for personal,
              non-commercial transitory viewing only.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
