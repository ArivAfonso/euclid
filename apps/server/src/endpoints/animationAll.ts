import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, LottieAnimation, AnimationAllParams } from "../types";

export class AnimationAll extends OpenAPIRoute {
  schema = {
    tags: ["Animations"],
    summary: "Get All/Popular LottieFiles Animations",
    description: "Retrieve popular or featured animations from LottieFiles",
    request: {
      query: AnimationAllParams,
    },
    responses: {
      "200": {
        description: "Returns a list of popular animations",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: z.object({
                animations: LottieAnimation.array(),
                total: z.number(),
                page: z.number(),
                per_page: z.number(),
                featured: z.boolean(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { page, per_page, featured, sort, type } = data.query as {
      page: number;
      per_page: number;
      featured: boolean;
      sort: "popular" | "recent" | "downloads" | "likes";
      type: "FREE" | "PREMIUM" | "PRO" | "all";
    };

    try {
      const animations = await this.getLottieFilesAnimations(
        page,
        per_page,
        featured,
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
          featured,
        },
      };
    } catch (error) {
      console.error("Animation fetch error:", error);
      return {
        success: false,
        result: {
          animations: [],
          total: 0,
          page,
          per_page,
          featured,
        },
      };
    }
  }

  private async getLottieFilesAnimations(
    page: number = 1,
    perPage: number = 20,
    featured: boolean = false,
    sort: string = "popular",
    type: string = "all",
    env?: Env
  ) {
    try {
      // Determine endpoint based on featured flag
      const baseUrl = featured
        ? "https://api.lottiefiles.com/v2/animations/featured"
        : "https://api.lottiefiles.com/v2/animations/popular";

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", Math.min(perPage, 50).toString());

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

      // Handle the nested data structure
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
      console.error("LottieFiles fetch error:", error);
      return [];
    }
  }
}
