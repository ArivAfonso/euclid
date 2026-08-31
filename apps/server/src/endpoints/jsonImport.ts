import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class JsonImport extends OpenAPIRoute {
	schema = {
		tags: ["Utilities"],
		summary: "Process JSON and convert resource links to Base64",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.any(),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the processed JSON",
				content: {
					"application/json": {
						schema: z.any(),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const json = data.body;

		// 1. Set workspace colors to transparent
		if (json.workSpace) {
			json.workSpace.fill = "rgba(0,0,0,0)";
			json.workSpace.color = "rgba(0,0,0,0)";
			json.workSpace.backgroundColor = "rgba(0,0,0,0)";
		}
		// Also check for background property at root which some versions use
		if (typeof json.background === 'string') {
			json.background = "rgba(0,0,0,0)";
		}

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

			// Check for src property in image objects
			// Handle both lowercase 'image' and capitalized 'Image' (Fabric.js standard)
			if ((obj.type === 'image' || obj.type === 'Image') && obj.src && typeof obj.src === 'string' && obj.src.startsWith('http')) {
				try {
					// console.log(`Fetching ${obj.src}`);
					const response = await fetch(obj.src);
					if (response.ok) {
						const arrayBuffer = await response.arrayBuffer();
						const contentType = response.headers.get('content-type') || 'image/png';
						const base64 = arrayBufferToBase64(arrayBuffer);
						obj.src = `data:${contentType};base64,${base64}`;
						// Remove crossOrigin for data URIs
						delete obj.crossOrigin;
					} else {
						console.warn(`Failed to fetch ${obj.src}: ${response.status}`);
						// Ensure crossOrigin is anonymous if we failed to convert
						obj.crossOrigin = 'anonymous';
					}
				} catch (e) {
					console.error(`Error processing ${obj.src}`, e);
					obj.crossOrigin = 'anonymous';
				}
			}
            
            // Also handle backgroundImage and overlayImage if they are strings
            if ((obj.type === 'image' || obj.type === 'Image' || obj.type === 'pattern' || obj.type === 'Pattern') && obj.source && typeof obj.source === 'string' && obj.source.startsWith('http')) {
                 // Handle pattern source
                 try {
					const response = await fetch(obj.source);
					if (response.ok) {
						const arrayBuffer = await response.arrayBuffer();
						const contentType = response.headers.get('content-type') || 'image/png';
						const base64 = arrayBufferToBase64(arrayBuffer);
						obj.source = `data:${contentType};base64,${base64}`;
						delete obj.crossOrigin;
					}
				} catch (e) {
					console.error(`Error processing pattern source ${obj.source}`, e);
				}
            }

			// Recurse into properties
			const keys = Object.keys(obj);
			await Promise.all(keys.map(async (key) => {
				if (typeof obj[key] === 'object' && obj[key] !== null) {
					await processObject(obj[key]);
				}
			}));
		};

		await processObject(json);

		return json;
	}
}
