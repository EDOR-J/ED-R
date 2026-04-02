import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects with HTTP Range request support (required for audio/video).
   */
  app.get("/objects/*objectPath", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);

      // Fetch metadata once
      const [metadata] = await objectFile.getMetadata();
      const contentType: string = (metadata.contentType as string) || "application/octet-stream";
      const totalSize = parseInt(String(metadata.size), 10);

      const rangeHeader = req.headers["range"];

      if (rangeHeader) {
        // Parse "bytes=start-end"
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (!match) {
          res.status(416).set("Content-Range", `bytes */${totalSize}`).end();
          return;
        }
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const chunkSize = end - start + 1;

        res.status(206).set({
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Cache-Control": "private, max-age=3600",
        });

        const stream = objectFile.createReadStream({ start, end });
        stream.on("error", (err) => {
          console.error("Range stream error:", err);
          if (!res.headersSent) res.status(500).end();
        });
        stream.pipe(res);
      } else {
        // No range — serve full file
        res.status(200).set({
          "Content-Type": contentType,
          "Content-Length": totalSize,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
        });

        const stream = objectFile.createReadStream();
        stream.on("error", (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) res.status(500).end();
        });
        stream.pipe(res);
      }
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

