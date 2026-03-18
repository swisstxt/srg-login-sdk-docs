import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'SRG Login SDK',
  tagline: 'OAuth 2.0 / OIDC authentication SDK for Android, iOS, and TV platforms',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://swisstxt.github.io',
  baseUrl: '/srg-login-sdk-docs/',

  organizationName: 'swisstxt',
  projectName: 'srg-login-sdk-docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/swisstxt/srg-login-sdk-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'SRG Login SDK',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://github.com/swisstxt/srg-login-sdk-distribution-android',
          label: 'Android',
          position: 'right',
        },
        {
          href: 'https://github.com/swisstxt/srg-login-sdk-distribution-apple',
          label: 'iOS',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/overview',
            },
            {
              label: 'Guides',
              to: '/docs/guides/authentication',
            },
            {
              label: 'Migration',
              to: '/docs/migration',
            },
          ],
        },
        {
          title: 'Distribution',
          items: [
            {
              label: 'Android (Maven)',
              href: 'https://swisstxt.github.io/srg-login-sdk-distribution-android/',
            },
            {
              label: 'iOS (SPM)',
              href: 'https://github.com/swisstxt/srg-login-sdk-distribution-apple',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Changelog',
              to: '/docs/migration/changelog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/swisstxt/srg-login-sdk-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} SRG SSR. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['kotlin', 'swift', 'groovy', 'toml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
