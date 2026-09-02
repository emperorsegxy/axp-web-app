export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    apiOrigin: process.env.NUXT_API_ORIGIN || 'http://localhost:4000',
    public: {},
  },

  routeRules: {
    '/api/**': { proxy: `${process.env.NUXT_API_ORIGIN || 'http://localhost:4000'}/api/**` },
  },

  typescript: {
    strict: true,
  },
});
