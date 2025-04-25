import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startStoreFinderService } from "./storeFinder";
import { initializeStorage } from "./storageInit";
import { scheduleStrainUpdates } from "./canadianStrains"; // Added import for strain scraping


// Load strain and dispensary data
console.log("Loading strain data...");
console.log("Loading dispensary data...");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize the storage system
  console.log("Initializing database storage...");
  initializeStorage();

  // Try to start the store finder service
  try {
    await startStoreFinderService();
    console.log("Store finder service started successfully");
  } catch (error) {
    console.error("Failed to start store finder service:", error);
    console.log("Will use fallback static data for store finder");
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    scheduleStrainUpdates(); // Start strain scraping after server starts
    console.log("Scheduled regular updates of top Canadian cannabis strains");
  });
})();


// canadianStrains.ts (This file needs to be created)
export const scheduleStrainUpdates = () => {
  // Placeholder: Replace with actual scraping and database update logic
  setInterval(() => {
    scrapeTopStrains().then(strains => updateDatabase(strains));
  }, 3600000); // Update every hour (3600000 milliseconds)
};

const scrapeTopStrains = async (): Promise<string[]> => {
  // Placeholder:  Replace with actual web scraping logic using a library like Cheerio or Puppeteer
  // This would fetch data from a website listing top Canadian strains.
  console.log("Scraping top strains...");
  //Example return:
  return ["Strain A", "Strain B", "Strain C", "Strain D", "Strain E", "Strain F", "Strain G", "Strain H", "Strain I", "Strain J"];
};

const updateDatabase = async (strains: string[]) => {
  // Placeholder: Replace with your database update logic. This would interact with your database to store the scraped data.
  console.log("Updating database with strains:", strains);
  //Example database update logic (replace with your actual database interaction):
  //  ... database update logic here ...
};