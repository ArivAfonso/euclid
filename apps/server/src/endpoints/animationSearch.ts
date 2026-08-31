import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {
  type AppContext,
  LottieAnimation,
  AnimationSearchParams,
} from "../types";

export class AnimationSearch extends OpenAPIRoute {
  schema = {
    tags: ["Animations"],
    summary: "Search LottieFiles Animations",
    description: "Search for animations from LottieFiles with various filters",
    request: {
      query: AnimationSearchParams,
    },
    responses: {
      "200": {
        description: "Returns a list of animations",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: z.object({
                animations: LottieAnimation.array(),
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
    const { query, page, per_page, category, sort, type } = data.query as {
      query?: string;
      page: number;
      per_page: number;
      category?: string;
      sort: "popular" | "recent" | "downloads" | "likes";
      type: "FREE" | "PREMIUM" | "PRO" | "all";
    };

    try {
      const animations = await this.searchLottieFiles(
        query,
        page,
        per_page,
        category,
        sort,
        type,
        c.env
      );

      return {
        success: true,
        result: {
          animations,
          total: animations.length,
          page,
          per_page,
        },
      };
    } catch (error) {
      console.error("Animation search error:", error);
      return {
        success: false,
        result: {
          animations: [],
          total: 0,
          page,
          per_page,
        },
      };
    }
  }

  private async searchLottieFiles(
    query?: string,
    page: number = 1,
    perPage: number = 20,
    category?: string,
    sort: string = "popular",
    type: string = "all",
    env?: Env
  ) {
    try {
      // Build the search URL
      const baseUrl = "https://api.lottiefiles.com/v2/animations/search";
      const params = new URLSearchParams();

      if (query) {
        params.append("q", query);
      }

      params.append("page", page.toString());
      params.append("limit", Math.min(perPage, 50).toString());

      if (category) {
        params.append("category", category);
      }

      // Map sort options to LottieFiles API format
      const sortMap: Record<string, string> = {
        popular: "popular",
        recent: "recent",
        downloads: "downloads",
        likes: "likes",
      };
      params.append("sort", sortMap[sort] || "popular");

      if (type !== "all") {
        params.append("type", type.toLowerCase());
      }

      const url = `${baseUrl}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "EuclidServer/1.0",
        },
      });

      if (!response.ok) {
        console.error(
          `LottieFiles API error: ${response.status} ${response.statusText}`
        );
        return [];
      }

      const data = (await response.json()) as any;

      // Handle the nested data structure from your example
      const animations = data?.data?.data || data?.data || [];

      return animations.map((animation: any) => ({
        id: animation.id,
        name: animation.name,
        slug: animation.slug,
        description: animation.description,
        hash: animation.hash,
        bgColor: animation.bgColor,
        colors: animation.colors,
        tags: animation.tags,
        userTags: animation.userTags,
        mlTags: animation.mlTags,
        createdAt: animation.createdAt,
        publishedAt: animation.publishedAt,
        updatedAt: animation.updatedAt,
        status: animation.status,
        type: animation.type,
        speed: animation.speed,
        aepAvailable: animation.aepAvailable,
        isSticker: animation.isSticker,
        jsonSource: animation.jsonSource,
        lottieSource: animation.lottieSource,
        gifUrl: animation.gifUrl,
        imageSource: animation.imageSource,
        videoSource: animation.videoSource,
        downloadCount: animation.downloadCount,
        isAnimatorHireable: animation.isAnimatorHireable,
        userCountry: animation.userCountry,
        userId: animation.userId,
        user: animation.user
          ? {
              id: animation.user.id,
              name: animation.user.name,
              username: animation.user.username,
              avatarUrl: animation.user.avatarUrl,
              isHireable: animation.user.isHireable,
              preference: animation.user.preference,
              state: animation.user.state,
            }
          : undefined,
        metaDataV2: animation.metaDataV2,
        fileVariations: animation.fileVariations,
        tools: animation.tools,
        width: animation.metaDataV2?.animations?.[0]?.width,
        height: animation.metaDataV2?.animations?.[0]?.height,
      }));
    } catch (error) {
      console.error("LottieFiles search error:", error);
      return [];
    }
  }
}
