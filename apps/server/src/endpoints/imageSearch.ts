import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, StockImage, ImageSearchParams } from "../types";

export class ImageSearch extends OpenAPIRoute {
  schema = {
    tags: ["Images"],
    summary: "Search Stock Images",
    description:
      "Search for CC0/free stock images from Unsplash, Pixabay, and Flickr",
    request: {
      query: ImageSearchParams,
    },
    responses: {
      "200": {
        description: "Returns a list of stock images",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: z.object({
                images: StockImage.array(),
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

    const { query, page, per_page, sources } = data.query as {
      query: string;
      page: number;
      per_page: number;
      sources: ("unsplash" | "pixabay" | "flickr")[];
    };

    const results = await Promise.allSettled([
      sources.includes("unsplash")
        ? this.searchUnsplash(query, page, per_page, c.env)
        : Promise.resolve([]),
      sources.includes("pixabay")
        ? this.searchPixabay(query, page, per_page, c.env)
        : Promise.resolve([]),
      sources.includes("flickr")
        ? this.searchFlickr(query, page, per_page, c.env)
        : Promise.resolve([]),
      sources.includes("iconify")
        ? this.searchIconify(query, page, per_page, c.env)
        : Promise.resolve([]),
    ]);

    const allImages = results
      .filter(
        (result): result is PromiseFulfilledResult<any[]> =>
          result.status === "fulfilled"
      )
      .flatMap((result) => result.value);

    // Shuffle images to avoid source bias
    function shuffleArray<T>(array: T[]): T[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const shuffledImages = shuffleArray(allImages);

    // Sort by relevance and limit results
    const limitedImages = shuffledImages.slice(0, per_page);

    return {
      success: true,
      result: {
        images: limitedImages,
        total: allImages.length,
        page,
        per_page,
      },
    };
  }

  private async searchUnsplash(
    query: string,
    page: number,
    perPage: number,
    env: Env
  ) {
    try {
      const apiKey = env.UNSPLASH_ACCESS_KEY;
      if (!apiKey) {
        console.warn("Unsplash API key not found, skipping Unsplash search");
        return [];
      }

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&page=${page}&per_page=${Math.min(perPage, 30)}`,
        {
          headers: {
            Authorization: `Client-ID ${apiKey}`,
          },
        }
      );

      if (!response.ok) return [];

      const data = (await response.json()) as any;
      return (
        data.results?.map((photo: any) => ({
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
        })) || []
      );
    } catch (error) {
      console.error("Unsplash API error:", error);
      return [];
    }
  }

  private async searchPixabay(
    query: string,
    page: number,
    perPage: number,
    env: Env
  ) {
    try {
      const apiKey = env.PIXABAY_API_KEY;
      if (!apiKey) {
        console.warn("Pixabay API key not found, skipping Pixabay search");
        return [];
      }

      const response = await fetch(
        `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(
          query
        )}&page=${page}&per_page=${Math.min(
          perPage,
          20
        )}&image_type=photo&category=all&safesearch=true`
      );

      if (!response.ok) return [];

      const data = (await response.json()) as any;
      return (
        data.hits?.map((photo: any) => ({
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
        })) || []
      );
    } catch (error) {
      console.error("Pixabay API error:", error);
      return [];
    }
  }

  private async searchFlickr(
    query: string,
    page: number,
    perPage: number,
    env: Env
  ) {
    try {
      const apiKey = env.FLICKR_API_KEY;
      if (!apiKey) {
        console.warn("Flickr API key not found, skipping Flickr search");
        return [];
      }

      const response = await fetch(
        `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&text=${encodeURIComponent(
          query
        )}&page=${page}&per_page=${Math.min(
          perPage,
          20
        )}&format=json&nojsoncallback=1&license=9,10&extras=url_m,url_s,owner_name,tags`
      );

      if (!response.ok) return [];

      const data = (await response.json()) as any;
      return (
        data.photos?.photo?.map((photo: any) => ({
          id: `flickr-${photo.id}`,
          url:
            photo.url_m ||
            `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_m.jpg`,
          thumbnail:
            photo.url_s ||
            `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_s.jpg`,
          title: photo.title,
          description: photo.title,
          author: photo.ownername,
          source: "flickr" as const,
          license: "CC0 (Public Domain)",
          tags: photo.tags?.split(" ") || [],
          width: undefined,
          height: undefined,
        })) || []
      );
    } catch (error) {
      console.error("Flickr API error:", error);
      return [];
    }
  }

  private async searchIconify(
    query: string,
    page: number,
    perPage: number,
    env: Env
  ) {
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
