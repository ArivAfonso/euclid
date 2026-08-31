import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, StockImage } from "../types";

export class IconDetails extends OpenAPIRoute {
  schema = {
    tags: ["Icons"],
    summary: "Get Icon Details",
    description: "Get detailed information about a specific icon",
    request: {
      params: z.object({
        iconId: Str({ example: "mdi:home" }),
      }),
    },
    responses: {
      "200": {
        description: "Returns detailed icon information",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: StockImage,
            }),
          },
        },
      },
      "404": {
        description: "Icon not found",
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
    const { iconId } = data.params;

    const iconDetails = await this.getIconifyDetails(iconId);

    if (!iconDetails) {
      return c.json({ success: false, error: "Icon not found" }, 404);
    }

    return {
      success: true,
      result: iconDetails,
    };
  }

  private async getIconifyDetails(id: string) {
    try {
      // Iconify API doesn't require authentication for public icons
      const response = await fetch(
        `https://api.iconify.design/info?name=${id}`
      );

      if (!response.ok) return null;

      const iconInfo = (await response.json()) as any;
      if (!iconInfo || !iconInfo.name) return null;

      // Get the collection info
      const [prefix] = id.split(":");
      const collectionResponse = await fetch(
        `https://api.iconify.design/collection?prefix=${prefix}`
      );
      const collectionInfo = collectionResponse.ok
        ? await collectionResponse.json()
        : null;

      return {
        id: `iconify-${id}`,
        url: `https://api.iconify.design/${id}.svg`,
        thumbnail: `https://api.iconify.design/${id}.svg?height=64`,
        title: iconInfo.name || id,
        description: `Icon from ${prefix} collection`,
        author: collectionInfo?.author?.name || prefix,
        source: "iconify" as const,
        license: collectionInfo?.license?.title || "Open Source",
        tags: iconInfo.aliases || [],
        width: iconInfo.width || 24,
        height: iconInfo.height || 24,
      };
    } catch (error) {
      console.error("Iconify API error:", error);
      return null;
    }
  }
}
