import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, StockImage } from "../types";

export class IconSearch extends OpenAPIRoute {
  schema = {
    tags: ["Icons"],
    summary: "Search Icons",
    description: "Search for icons from Iconify API",
    request: {
      query: z.object({
        query: z.string().describe("Search query"),
        page: z.number().default(1).describe("Page number"),
        per_page: z.number().default(20).describe("Results per page"),
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of icons",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: z.object({
                icons: StockImage.array(),
                total: z.number(),
                page: z.number(),
                per_page: z.number(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const { query, page, per_page } = data.query as {
      query: string;
      page: number;
      per_page: number;
    };

    const icons = await this.searchIconify(query, page, per_page);

    return {
      success: true,
      result: {
        icons,
        total: icons.length, // Iconify API doesn't provide total count easily
        page,
        per_page,
      },
    };
  }

  private async searchIconify(query: string, page: number, perPage: number) {
    try {
      // Iconify search API endpoint
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(
          query
        )}&limit=${Math.min(perPage, 50)}&offset=${(page - 1) * perPage}`
      );

      if (!response.ok) return [];

      const data = (await response.json()) as any;

      if (!data.icons || !Array.isArray(data.icons)) {
        return [];
      }

      return data.icons.map((icon: string) => {
        // Parse icon name to get prefix and name
        const [prefix, name] = icon.split(":");

        return {
          id: `iconify-${icon}`,
          url: `https://api.iconify.design/${icon}.svg`,
          thumbnail: `https://api.iconify.design/${icon}.svg?height=64`,
          title: name || icon,
          description: `Icon from ${prefix} collection`,
          author: prefix,
          source: "iconify" as const,
          license: "Open Source",
          tags: [prefix, name, "icon", "svg"],
          width: 24, // Default width, actual size depends on the specific icon
          height: 24, // Default height, actual size depends on the specific icon
        };
      });
    } catch (error) {
      console.error("Iconify API error:", error);
      return [];
    }
  }
}
