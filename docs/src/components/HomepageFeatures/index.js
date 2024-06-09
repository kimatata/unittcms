import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Open Source',
    Svg: require('@site/static/img/certificate-svgrepo-com.svg').default,
    description: (
      <>
        UnitTCMS is free and open source. The application can be self-hosted. It can be deployed in environments with
        strict security requirements.
      </>
    ),
  },
  {
    title: 'Organize Test Cases',
    Svg: require('@site/static/img/chemical-svgrepo-com.svg').default,
    description: <>Test cases can be organized by projects and folders. Modern UI framework makes them fast.</>,
  },
  {
    title: 'Usability',
    Svg: require('@site/static/img/statistics-svgrepo-com.svg').default,
    description: (
      <>
        The defined test cases can be used over and over again in test runs. The status of test runs and projects can be
        viewed graphically.
      </>
    ),
  },
  {
    title: 'Universal',
    Svg: require('@site/static/img/question-and-answer-svgrepo-com.svg').default,
    description: <>Multi language support and dark theme allow anyone to use the system without any inconvenience.</>,
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
