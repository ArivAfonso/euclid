import { DateTime, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const Task = z.object({
  name: Str({ example: "lorem" }),
  slug: Str(),
  description: Str({ required: false }),
  completed: z.boolean().default(false),
  due_date: DateTime(),
});

export const StockImage = z.object({
  id: Str(),
  url: Str(),
  thumbnail: Str(),
  title: Str({ required: false }),
  description: Str({ required: false }),
  author: Str({ required: false }),
  source: z.enum(["unsplash", "pixabay", "flickr", "iconify"]),
  license: Str({ required: false }),
  tags: z.array(Str()).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const ImageSearchParams = z.object({
  query: Str({ example: "nature" }),
  page: z.number().default(1),
  per_page: z.number().default(20),
  sources: z
    .array(z.enum(["unsplash", "pixabay", "flickr", "iconify"]))
    .default(["unsplash", "pixabay", "flickr", "iconify"]),
});

export const GoogleFont = z.object({
  family: Str(),
  category: Str(),
  variants: z.array(Str()),
  subsets: z.array(Str()),
  files: z.record(Str()).optional(),
  version: Str().optional(),
  lastModified: Str().optional(),
  kind: Str().optional(),
});

export const FontAllParams = z.object({
  query: Str({ example: "roboto", required: false }),
  category: z
    .enum(["serif", "sans-serif", "display", "handwriting", "monospace"])
    .optional(),
  sort: z
    .enum(["alpha", "date", "popularity", "style", "trending"])
    .default("popularity"),
  subset: Str({ required: false }),
});

// LottieFiles Animation types
export const LottieUser = z.object({
  id: Str(),
  name: Str(),
  username: Str(),
  avatarUrl: Str().optional(),
  isHireable: z.boolean().optional(),
  preference: z.any().optional(),
  state: Str().optional(),
});

export const LottieAnimation = z.object({
  id: Str(),
  name: Str(),
  slug: Str(),
  description: Str().optional(),
  hash: Str(),
  bgColor: Str().optional(),
  colors: z.array(Str()).optional(),
  tags: z.array(Str()).optional(),
  userTags: z.array(Str()).optional(),
  mlTags: z.array(Str()).optional(),
  createdAt: z.number().optional(),
  publishedAt: z.number().optional(),
  updatedAt: z.number().optional(),
  status: Str().optional(),
  type: z.enum(["FREE", "PREMIUM", "PRO"]).optional(),
  speed: z.number().optional(),
  aepAvailable: z.boolean().optional(),
  isSticker: z.boolean().optional(),
  jsonSource: Str().optional(),
  lottieSource: Str().optional(),
  gifUrl: Str().optional(),
  imageSource: Str().optional(),
  videoSource: Str().optional(),
  downloadCount: z.number().optional(),
  isAnimatorHireable: z.boolean().optional(),
  userCountry: Str().optional(),
  userId: Str().optional(),
  user: LottieUser.optional(),
  metaDataV2: z.any().optional(),
  fileVariations: z.array(z.any()).optional(),
  tools: z.array(z.any()).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const AnimationSearchParams = z.object({
  query: Str({ example: "loading", required: false }),
  page: z.number().default(1),
  per_page: z.number().default(20),
  category: Str({ required: false }),
  sort: z.enum(["popular", "recent", "downloads", "likes"]).default("popular"),
  type: z.enum(["FREE", "PREMIUM", "PRO", "all"]).default("all"),
});

export const AnimationAllParams = z.object({
  page: z.number().default(1),
  per_page: z.number().default(20),
  featured: z.boolean().default(false),
  sort: z.enum(["popular", "recent", "downloads", "likes"]).default("popular"),
  type: z.enum(["FREE", "PREMIUM", "PRO", "all"]).default("all"),
});
