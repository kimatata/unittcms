import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import Heading from "@theme/Heading";
import styles from "./index.module.css";

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            TestPlat
          </Heading>
          <p className="hero__subtitle">
            Open Source Test Case Management Web Application
          </p>
          Integrate and manage all your software testing.
        </div>
      </header>
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
