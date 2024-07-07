import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './index.module.css';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            UnitTCMS Docs
          </Heading>
          <p className="hero__subtitle">Open Source Test Case Management System</p>
          <div>
            <Link className="button button--secondary button--lg" to="/docs">
              Move to Docs📰
            </Link>
          </div>
        </div>
      </header>
      <main></main>
    </Layout>
  );
}
