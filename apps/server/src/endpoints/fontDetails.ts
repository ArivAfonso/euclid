import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, GoogleFont } from "../types";

export class FontDetails extends OpenAPIRoute {
  schema = {
    tags: ["Fonts"],
    summary: "Get Font Details",
    description: "Get detailed information about a specific Google Font",
    request: {
      params: z.object({
        fontFamily: Str({ example: "Roboto" }),
      }),
    },
    responses: {
      "200": {
        description: "Returns detailed information about the font",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: GoogleFont.optional(),
            }),
          },
        },
      },
      "404": {
        description: "Font not found",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              error: Str(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { fontFamily } = data.params;

    const apiKey = c.env.GOOGLE_FONTS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Google Fonts API key not configured",
      };
    }

    // Create cache key for this specific font
    const cacheKey = `google-font-${fontFamily.toLowerCase()}`;

    // Try to get from cache first (24 hour cache)
    const cached = await c.env.CACHE?.get(cacheKey);
    if (cached) {
      const cachedFont = JSON.parse(cached);
      return {
        success: true,
        result: cachedFont,
      };
    }

    try {
      // Get all fonts and find the specific one
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Fonts API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const fonts = data.items || [];

      // Find the specific font (case-insensitive)
      const font = fonts.find(
        (f: any) => f.family.toLowerCase() === fontFamily.toLowerCase()
      );

      if (!font) {
        return {
          success: false,
          error: `Font "${fontFamily}" not found`,
        };
      }

      // Transform to our schema
      const transformedFont = {
        family: font.family,
        category: font.category,
        variants: font.variants || [],
        subsets: font.subsets || [],
        files: font.files,
        version: font.version,
        lastModified: font.lastModified,
        kind: font.kind,
      };

      // Cache the result for 24 hours (86400 seconds)
      if (c.env.CACHE) {
        await c.env.CACHE.put(cacheKey, JSON.stringify(transformedFont), {
          expirationTtl: 86400,
        });
      }

      return {
        success: true,
        result: transformedFont,
      };
    } catch (error) {
      console.error("Google Fonts API error:", error);
      return {
        success: false,
        error: "Failed to fetch font details from Google Fonts API",
      };
    }
  }
}
