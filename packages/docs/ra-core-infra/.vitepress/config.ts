import {defineConfig} from 'vitepress'
import {withMermaid} from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid(
    defineConfig({
        title: "@ra-core-infra",
        description: "React Admin Core Infrastructure - Build production-ready admin apps with DI and type safety",
        base: '/aether/',
        themeConfig: {
            // https://vitepress.dev/reference/default-theme-config
            nav: [
                {text: 'Home', link: '/'},
                {text: 'Introduction', link: '/introduction'},
                {text: 'Getting started', link: '/getting-started/'},
                {text: 'Guides', link: '/guides/'},
                {text: 'API', link: '/api-reference/'},
                {text: 'Tutorials', link: '/tutorials/'},
            ],

            sidebar: {
                '/getting-started/': [
                    {
                        text: 'Getting Started',
                        items: [
                            {text: 'Overview', link: '/getting-started/'},
                            {text: 'Installation', link: '/getting-started/installation'},
                            {text: 'Project Setup', link: '/getting-started/project-setup'},
                            {text: 'First Application', link: '/getting-started/first-application'},
                            {text: 'Configuration', link: '/getting-started/configuration'}
                        ]
                    }
                ],
                '/core-concepts/': [
                    {
                        text: 'Core Concepts',
                        items: [
                            {text: 'Overview', link: '/core-concepts/'},
                            {text: 'Architecture', link: '/core-concepts/architecture'},
                            {text: 'Application Lifecycle', link: '/core-concepts/application-lifecycle'},
                            {text: 'Project Structure', link: '/core-concepts/project-structure'}
                        ]
                    }
                ],
                '/guides/': [
                    {
                        text: 'Feature Guides',
                        items: [
                            {text: 'Overview', link: '/guides/'}
                        ]
                    },
                    {
                        text: 'Dependency Injection',
                        collapsed: false,
                        items: [
                            {text: 'Overview', link: '/guides/dependency-injection/'},
                            {text: 'DI Concepts', link: '/guides/dependency-injection/overview'},
                            {text: 'Use Cases', link: '/guides/dependency-injection/use-cases'},
                            {text: 'Container Setup', link: '/guides/dependency-injection/container-setup'},
                            {text: 'Service Registration', link: '/guides/dependency-injection/service-registration'},
                            {text: 'Injection Patterns', link: '/guides/dependency-injection/injection-patterns'},
                            {text: 'Best Practices', link: '/guides/dependency-injection/best-practices'}
                        ]
                    },
                    {
                        text: 'Data Providers & CRUD',
                        collapsed: false,
                        items: [
                            {text: 'Overview', link: '/guides/data-providers/'},
                            {text: 'Data Provider Concepts', link: '/guides/data-providers/overview'},
                            {text: 'Use Cases', link: '/guides/data-providers/use-cases'},
                            {text: 'REST Data Provider', link: '/guides/data-providers/rest-data-provider'},
                            {text: 'CRUD Operations', link: '/guides/data-providers/crud-operations'},
                            {text: 'LoopBack Filters', link: '/guides/data-providers/loopback-filters'},
                            {text: 'Network Implementations', link: '/guides/data-providers/network-implementations'},
                            {text: 'Best Practices', link: '/guides/data-providers/best-practices'}
                        ]
                    },
                    {
                        text: 'Authentication',
                        collapsed: false,
                        items: [
                            {text: 'Overview', link: '/guides/authentication/'},
                            {text: 'Auth Concepts', link: '/guides/authentication/overview'},
                            {text: 'Use Cases', link: '/guides/authentication/use-cases'},
                            {text: 'Auth Provider Setup', link: '/guides/authentication/auth-provider-setup'},
                            {text: 'Login & Logout', link: '/guides/authentication/login-logout'},
                            {text: 'Protected Routes', link: '/guides/authentication/protected-routes'},
                            {text: 'Permissions & RBAC', link: '/guides/authentication/permissions'},
                            {text: 'Token Management', link: '/guides/authentication/token-management'},
                            {text: 'Best Practices', link: '/guides/authentication/best-practices'}
                        ]
                    },
                    {
                        text: 'React Integration',
                        collapsed: false,
                        items: [
                            {text: 'Overview', link: '/guides/react-integration/'},
                            {text: 'Integration Concepts', link: '/guides/react-integration/overview'},
                            {text: 'Use Cases', link: '/guides/react-integration/use-cases'},
                            {text: 'Application Context', link: '/guides/react-integration/application-context'},
                            {text: 'Hooks', link: '/guides/react-integration/hooks'},
                            {text: 'TanStack Query', link: '/guides/react-integration/tanstack-query'},
                            {text: 'Redux Integration', link: '/guides/react-integration/redux-integration'},
                            {text: 'Best Practices', link: '/guides/react-integration/best-practices'}
                        ]
                    },
                    {
                        text: 'Internationalization',
                        collapsed: true,
                        items: [
                            {text: 'Overview', link: '/guides/internationalization/'},
                            {text: 'Setup', link: '/guides/internationalization/setup'},
                            {text: 'Using Translations', link: '/guides/internationalization/using-translations'},
                            {text: 'Best Practices', link: '/guides/internationalization/best-practices'}
                        ]
                    },
                    {
                        text: 'Advanced Topics',
                        collapsed: true,
                        items: [
                            {text: 'Custom Services', link: '/guides/advanced/custom-services'},
                            {text: 'Network Customization', link: '/guides/advanced/network-customization'},
                            {text: 'Error Handling', link: '/guides/advanced/error-handling'},
                            {text: 'Testing', link: '/guides/advanced/testing'},
                            {text: 'Performance', link: '/guides/advanced/performance'}
                        ]
                    }
                ],
                '/tutorials/': [
                    {
                        text: 'Tutorials',
                        items: [
                            {text: 'Overview', link: '/tutorials/'},
                            {text: 'Todo App (Beginner)', link: '/tutorials/todo-app'},
                            {text: 'Blog Platform (Intermediate)', link: '/tutorials/blog-platform'},
                            {text: 'Admin Dashboard (Advanced)', link: '/tutorials/admin-dashboard'}
                        ]
                    }
                ],
                '/api-reference/': [
                    {
                        text: 'API Reference',
                        items: [
                            {text: 'Overview', link: '/api-reference/'}
                        ]
                    },
                    {
                        text: 'Core',
                        collapsed: false,
                        items: [
                            {text: 'BaseRaApplication', link: '/api-reference/core/base-ra-application'},
                            {text: 'CoreBindings', link: '/api-reference/core/core-bindings'},
                            {text: 'Types', link: '/api-reference/core/types'}
                        ]
                    },
                    {
                        text: 'Providers',
                        collapsed: false,
                        items: [
                            {
                                text: 'DefaultRestDataProvider',
                                link: '/api-reference/providers/default-rest-data-provider'
                            },
                            {text: 'DefaultAuthProvider', link: '/api-reference/providers/default-auth-provider'},
                            {text: 'DefaultI18nProvider', link: '/api-reference/providers/default-i18n-provider'},
                            {text: 'BaseProvider', link: '/api-reference/providers/base-provider'}
                        ]
                    },
                    {
                        text: 'Services',
                        collapsed: false,
                        items: [
                            {text: 'BaseCrudService', link: '/api-reference/services/base-crud-service'},
                            {text: 'DefaultAuthService', link: '/api-reference/services/default-auth-service'},
                            {
                                text: 'DefaultNetworkRequestService',
                                link: '/api-reference/services/default-network-request-service'
                            },
                            {text: 'BaseService', link: '/api-reference/services/base-service'}
                        ]
                    },
                    {
                        text: 'Hooks',
                        collapsed: true,
                        items: [
                            {text: 'useInjectable', link: '/api-reference/hooks/use-injectable'},
                            {text: 'useTranslate', link: '/api-reference/hooks/use-translate'},
                            {text: 'useApplicationContext', link: '/api-reference/hooks/use-application-context'},
                            {text: 'Other Hooks', link: '/api-reference/hooks/other-hooks'}
                        ]
                    },
                    {
                        text: 'Utilities',
                        collapsed: true,
                        items: [
                            {text: 'Error Utilities', link: '/api-reference/utilities/error-utilities'},
                            {text: 'Other Utilities', link: '/api-reference/utilities/other-utilities'}
                        ]
                    }
                ],
                '/troubleshooting/': [
                    {
                        text: 'Troubleshooting',
                        items: [
                            {text: 'Overview', link: '/troubleshooting/'},
                            {text: 'Common Issues', link: '/troubleshooting/common-issues'},
                            {text: 'reflect-metadata Errors', link: '/troubleshooting/reflect-metadata'},
                            {text: 'TypeScript Decorators', link: '/troubleshooting/typescript-decorators'},
                            {text: 'DI Container Errors', link: '/troubleshooting/di-errors'},
                            {text: 'Debugging Guide', link: '/troubleshooting/debugging'}
                        ]
                    }
                ],
                '/migration/': [
                    {
                        text: 'Migration Guides',
                        items: [
                            {text: 'From React Admin', link: '/migration/from-react-admin'},
                            {text: 'Upgrading Versions', link: '/migration/upgrading'}
                        ]
                    }
                ],
                '/resources/': [
                    {
                        text: 'Additional Resources',
                        items: [
                            {text: 'Overview', link: '/resources/'},
                            {text: 'FAQ', link: '/resources/faq'},
                            {text: 'Glossary', link: '/resources/glossary'},
                            {text: 'Examples', link: '/resources/examples'},
                            {text: 'Comparison', link: '/resources/comparison'},
                            {text: 'Community & Support', link: '/resources/community'}
                        ]
                    }
                ]
            },

            socialLinks: [
                {icon: 'github', link: 'https://github.com/phatnt199/aether/tree/main/packages/ra-core-infra'}
            ],

            search: {
                provider: 'local'
            },

            footer: {
                message: 'Released under the MIT License.',
                copyright: 'Copyright © 2024-present MinimalTech'
            }
        },
        vite: {
            server: {
                host: '0.0.0.0', // Listen on all network interfaces
                port: 5173
            }
        },
        ignoreDeadLinks: [
            "http://localhost:3000",
        ]
    })
)
