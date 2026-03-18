import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/overview',
        'getting-started/android',
        'getting-started/ios',
        'getting-started/android-tv',
        'getting-started/tvos',
        'getting-started/web',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/initialization',
        'guides/configuration',
        'guides/authentication',
        'guides/token-management',
        'guides/logout',
        'guides/error-handling',
        'guides/security',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/token-monitoring',
        'advanced/sentry-integration',
        'advanced/custom-storage',
      ],
    },
    {
      type: 'category',
      label: 'Migration',
      items: [
        'migration/index',
        'migration/changelog',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/bu-identities',
        'reference/scopes',
      ],
    },
  ],
  apiSidebar: [
    'api-reference/index',
  ],
};

export default sidebars;
