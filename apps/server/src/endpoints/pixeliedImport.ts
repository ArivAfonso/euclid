import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class PixeliedImport extends OpenAPIRoute {
	schema = {
		tags: ["Utilities"],
		summary: "Fetch Pixelied template and convert images to Base64",
		request: {
			query: z.object({
				templateId: z.string().min(1),
			}),
		},
		responses: {
			"200": {
				description: "Returns the processed Pixelied template JSON",
				content: {
					"application/json": {
						schema: z.any(),
					},
				},
			},
			"404": {
				description: "Template not found",
			},
			"500": {
				description: "Server error",
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { templateId } = data.query;

		try {
			// Fetch from Pixelied API
			const response = await fetch(`https://pixelied.com/api/templates/${templateId}`);
			
			if (!response.ok) {
				if (response.status === 404) {
					return c.json({ error: "Template not found" }, 404);
				}
				return c.json({ error: `Pixelied API error: ${response.status}` }, 500);
			}

			const json = await response.json();

			// Helper to convert ArrayBuffer to Base64
			const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
				let binary = '';
				const bytes = new Uint8Array(buffer);
				const len = bytes.byteLength;
				for (let i = 0; i < len; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				return btoa(binary);
			};

			// Recursive function to traverse and update
			const processObject = async (obj: any) => {
				if (!obj || typeof obj !== 'object') return;

				if (Array.isArray(obj)) {
					// Process array items in parallel
					await Promise.all(obj.map(item => processObject(item)));
					return;
				}

				// Check for src property in image objects (Pixelied uses 'image' type)
				// Also check for 'src' in general as Pixelied objects might have it
				if (obj.src && typeof obj.src === 'string' && obj.src.startsWith('http')) {
					try {
						const imgResponse = await fetch(obj.src);
						if (imgResponse.ok) {
							const arrayBuffer = await imgResponse.arrayBuffer();
							const contentType = imgResponse.headers.get('content-type') || 'image/png';
							const base64 = arrayBufferToBase64(arrayBuffer);
							obj.src = `data:${contentType};base64,${base64}`;
							// Remove crossOrigin for data URIs
							delete obj.crossOrigin;
						} else {
							console.warn(`Failed to fetch ${obj.src}: ${imgResponse.status}`);
						}
					} catch (e) {
						console.error(`Error processing ${obj.src}`, e);
					}
				}
				
				// Pixelied specific: background image in pages
				// It seems Pixelied structure is: pages[].page_editor_json.objects[]
				// But we should just traverse everything.

				// Recursively process all properties that are objects or arrays
				const promises = [];
				for (const key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) {
						const value = obj[key];
						if (typeof value === 'object' && value !== null) {
							promises.push(processObject(value));
						}
					}
				}
				await Promise.all(promises);
			};

			// Start processing the JSON
			await processObject(json);

			return c.json(json);

		} catch (error) {
			console.error("Error in PixeliedImport:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	}
}
