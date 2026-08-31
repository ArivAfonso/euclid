import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, StockImage } from "../types";

export class ImageDetails extends OpenAPIRoute {
  schema = {
    tags: ["Images"],
    summary: "Get Image Details",
    description: "Get detailed information about a specific stock image",
    request: {
      params: z.object({
        imageId: Str({ example: "unsplash-abc123" }),
      }),
    },
    responses: {
      "200": {
        description: "Returns detailed image information",
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
        description: "Image not found",
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
    const { imageId } = data.params;

    const [source, id] = imageId.split("-", 2);

    let imageDetails;
    switch (source) {
      case "unsplash":
        imageDetails = await this.getUnsplashDetails(id, c.env);
        break;
      case "pixabay":
        imageDetails = await this.getPixabayDetails(id, c.env);
        break;
      case "flickr":
        imageDetails = await this.getFlickrDetails(id, c.env);
        break;
      case "iconify":
        imageDetails = await this.getIconifyDetails(id, c.env);
        break;
      default:
        return c.json({ success: false, error: "Invalid image source" }, 404);
    }

    if (!imageDetails) {
      return c.json({ success: false, error: "Image not found" }, 404);
    }

    return {
      success: true,
      result: imageDetails,
    };
  }

  private async getUnsplashDetails(id: string, env: Env) {
    try {
      const apiKey = env.UNSPLASH_ACCESS_KEY;
      if (!apiKey) {
        console.warn("Unsplash API key not found");
        return null;
      }

      const response = await fetch(`https://api.unsplash.com/photos/${id}`, {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
        },
      });

      if (!response.ok) return null;

      const photo = (await response.json()) as any;
      return {
        id: `unsplash-${photo.id}`,
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        title: photo.alt_description || photo.description,
        description: photo.description,
        author: photo.user.name,
        source: "unsplash" as const,
        license: "Unsplash License",
        tags: photo.tags?.map((tag: any) => tag.title) || [],
        width: photo.width,
        height: photo.height,
      };
    } catch (error) {
      console.error("Unsplash API error:", error);
      return null;
    }
  }

  private async getPixabayDetails(id: string, env: Env) {
    try {
      const apiKey = env.PIXABAY_API_KEY;
      if (!apiKey) {
        console.warn("Pixabay API key not found");
        return null;
      }

      const response = await fetch(
        `https://pixabay.com/api/?key=${apiKey}&id=${id}`
      );

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      const photo = data.hits?.[0];
      if (!photo) return null;

      return {
        id: `pixabay-${photo.id}`,
        url: photo.webformatURL,
        thumbnail: photo.previewURL,
        title: photo.tags,
        description: photo.tags,
        author: photo.user,
        source: "pixabay" as const,
        license: "Pixabay License (CC0)",
        tags: photo.tags.split(", "),
        width: photo.imageWidth,
        height: photo.imageHeight,
      };
    } catch (error) {
      console.error("Pixabay API error:", error);
      return null;
    }
  }

  private async getFlickrDetails(id: string, env: Env) {
    try {
      const apiKey = env.FLICKR_API_KEY;
      if (!apiKey) {
        console.warn("Flickr API key not found");
        return null;
      }

      const response = await fetch(
        `https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=${apiKey}&photo_id=${id}&format=json&nojsoncallback=1`
      );

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      const photo = data.photo;
      if (!photo) return null;

      return {
        id: `flickr-${photo.id}`,
        url: `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_m.jpg`,
        thumbnail: `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_s.jpg`,
        title: photo.title?._content || "",
        description: photo.description?._content || "",
        author: photo.owner?.realname || photo.owner?.username,
        source: "flickr" as const,
        license: "CC0 (Public Domain)",
        tags: photo.tags?.tag?.map((tag: any) => tag._content) || [],
        width: undefined,
        height: undefined,
      };
    } catch (error) {
      console.error("Flickr API error:", error);
      return null;
    }
  }
}
