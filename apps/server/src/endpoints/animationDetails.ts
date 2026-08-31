import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, LottieAnimation } from "../types";

export class AnimationDetails extends OpenAPIRoute {
  schema = {
    tags: ["Animations"],
    summary: "Get Animation Details",
    description:
      "Get detailed information about a specific LottieFiles animation",
    request: {
      params: z.object({
        animationId: Str({ example: "2088855c-3608-11ef-9695-bb6039f20ecc" }),
      }),
    },
    responses: {
      "200": {
        description: "Returns animation details",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: z.object({
                animation: LottieAnimation,
              }),
            }),
          },
        },
      },
      "404": {
        description: "Animation not found",
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
    const { animationId } = data.params;

    try {
      const animation = await this.getAnimationDetails(animationId, c.env);

      if (!animation) {
        return {
          success: false,
          error: "Animation not found",
        };
      }

      return {
        success: true,
        result: {
          animation,
        },
      };
    } catch (error) {
      console.error("Animation details error:", error);
      return {
        success: false,
        error: "Failed to fetch animation details",
      };
    }
  }

  private async getAnimationDetails(animationId: string, env?: Env) {
    try {
      const url = `https://api.lottiefiles.com/v2/animations/${animationId}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "EuclidServer/1.0",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        console.error(
          `LottieFiles API error: ${response.status} ${response.statusText}`
        );
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const animation = data?.data || data;

      if (!animation) {
        return null;
      }

      return {
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
      };
    } catch (error) {
      console.error("LottieFiles details fetch error:", error);
      throw error;
    }
  }
}
