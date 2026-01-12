/**
 * article controller
 */

import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::article.article");
/*
export default factories.createCoreController(
  "api::article.article",
  ({ strapi }) => ({
    //Custom method we have defined in custom route 01-custom-article.ts    
    async loadFirstArticle(ctx) {
      const entries = await strapi.entityService.findMany(
        "api::article.article",
        {
          sort: { publishedAt: "desc" },
          limit: 1,
        }
      );

      return { data: entries };
    },
  })
);*/
