import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, GoogleFont, FontAllParams } from "../types";

export class FontAll extends OpenAPIRoute {
  schema = {
    tags: ["Fonts"],
    summary: "Get all Google Fonts",
    description: "Retrieve all Google Fonts with caching support",
    request: {
      query: FontAllParams,
    },
    responses: {
      "200": {
        description: "Returns a list of Google Fonts",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: z.object({
                fonts: GoogleFont.array(),
                total: z.number(),
                cached: z.boolean(),
                cacheExpiry: z.string().optional(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { query, category, sort, subset } = data.query as {
      query?: string;
      category?:
        | "serif"
        | "sans-serif"
        | "display"
        | "handwriting"
        | "monospace";
      sort: "alpha" | "date" | "popularity" | "style" | "trending";
      subset?: string;
    };

    const apiKey = c.env.GOOGLE_FONTS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Google Fonts API key not configured",
      };
    }

    // Create cache key based on parameters
    const cacheKey = `google-fonts-${JSON.stringify({
      query,
      category,
      sort,
      subset,
    })}`;

    // Try to get from cache first (indefinite cache)
    const cached = await c.env.CACHE?.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      return {
        success: true,
        result: {
          ...cachedData,
          cached: true,
        },
      };
    }

    try {
      // Build Google Fonts API URL
      const params = new URLSearchParams({
        key: apiKey,
        sort: sort,
      });

      if (subset) {
        params.append("subset", subset);
      }

      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Google Fonts API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      let fonts = data.items || [];

      // Filter by category if specified
      if (category) {
        fonts = fonts.filter((font: any) => font.category === category);
      }

      // Filter by query if specified (search in font family name)
      if (query) {
        const queryLower = query.toLowerCase();
        fonts = fonts.filter((font: any) =>
          font.family.toLowerCase().includes(queryLower)
        );
      }

      // Transform to our schema
      const transformedFonts = fonts.map((font: any) => ({
        family: font.family,
        category: font.category,
        variants: font.variants || [],
        subsets: font.subsets || [],
        files: font.files,
        version: font.version,
        lastModified: font.lastModified,
        kind: font.kind,
      }));

      const result = {
        fonts: transformedFonts,
        total: transformedFonts.length,
        cached: false,
        cacheExpiry: "never",
      };

      // Cache the result indefinitely (until explicitly invalidated)
      if (c.env.CACHE) {
        await c.env.CACHE.put(
          cacheKey,
          JSON.stringify({
            fonts: transformedFonts,
            total: transformedFonts.length,
            cacheExpiry: result.cacheExpiry,
          })
        );
      }

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error("Google Fonts API error:", error);
      return {
        success: false,
        error: "Failed to fetch fonts from Google Fonts API",
      };
    }
  }
}
