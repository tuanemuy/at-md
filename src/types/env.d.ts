namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    NEXT_PUBLIC_URL: string;
    NEXT_PUBLIC_SITE_NAME: string;
    NEXT_PUBLIC_GTM_ID: string;
    NEXT_PUBLIC_PAGINATION_LIMIT: string;
    NEXT_PUBLIC_SITEMAP_LIMIT: string;
  }
}
