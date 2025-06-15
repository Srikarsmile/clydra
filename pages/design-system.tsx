import { GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import DesignSystemDemo from '../components/DesignSystemDemo';

export default function DesignSystemPage() {
  return (
    <Layout>
      <Head>
        <title>Neo-Wave Tech Design System - Rivo Labs</title>
        <meta 
          name="description" 
          content="Comprehensive design system showcasing Neo-Wave Tech theme with Apple-inspired typography and fluid animations" 
        />
      </Head>
      
      <div className="min-h-screen py-8">
        <DesignSystemDemo />
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
}; 