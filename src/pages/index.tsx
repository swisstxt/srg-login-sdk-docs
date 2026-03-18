import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function PlatformCards() {
  const platforms = [
    {title: 'Android', link: '/docs/getting-started/android', description: 'Maven via GitHub Pages — zero auth'},
    {title: 'iOS', link: '/docs/getting-started/ios', description: 'Swift Package Manager — zero auth'},
    {title: 'Android TV', link: '/docs/getting-started/android-tv', description: 'Device Code Flow — planned'},
    {title: 'tvOS', link: '/docs/getting-started/tvos', description: 'Device Code Flow — planned'},
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {platforms.map((platform) => (
            <div key={platform.title} className={clsx('col col--3')}>
              <div className="text--center padding-horiz--md padding-vert--lg">
                <Heading as="h3">
                  <Link to={platform.link}>{platform.title}</Link>
                </Heading>
                <p>{platform.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="OAuth 2.0 / OIDC authentication SDK for Android, iOS, and TV platforms">
      <HomepageHeader />
      <main>
        <PlatformCards />
      </main>
    </Layout>
  );
}
