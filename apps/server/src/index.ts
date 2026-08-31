import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { ImageSearch } from "./endpoints/imageSearch";
import { ImageDetails } from "./endpoints/imageDetails";
import { IconSearch } from "./endpoints/iconSearch";
import { IconDetails } from "./endpoints/iconDetails";
import { FontAll } from "./endpoints/fontAll";
import { FontDetails } from "./endpoints/fontDetails";
import { AnimationSearch } from "./endpoints/animationSearch";
import { AnimationAll } from "./endpoints/animationAll";
import { AnimationDetails } from "./endpoints/animationDetails";
import { JsonImport } from "./endpoints/jsonImport";
import { PixeliedImport } from "./endpoints/pixeliedImport";
import { cors } from "hono/cors";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all origins
app.use("*", cors());

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// Image endpoints
openapi.get("/api/images/search", ImageSearch);
openapi.get("/api/images/:imageId", ImageDetails);

// Icon endpoints
openapi.get("/api/icons/search", IconSearch);
openapi.get("/api/icons/:iconId", IconDetails);

// Font endpoints
openapi.get("/api/fonts/all", FontAll);
openapi.get("/api/fonts/:fontFamily", FontDetails);

// Animation endpoints
openapi.get("/api/animations/search", AnimationSearch);
openapi.get("/api/animations/all", AnimationAll);
openapi.get("/api/animations/:animationId", AnimationDetails);

// Utility endpoints
openapi.post("/api/utils/import-json", JsonImport);
openapi.get("/api/utils/pixelied-import", PixeliedImport);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
