import { spawn } from 'child_process';
import axios from 'axios';
import { UserLocation, Dispensary } from '@shared/schema';

let pythonProcess: any = null;
const STORE_FINDER_PORT = 5001;
const STORE_FINDER_URL = `http://localhost:${STORE_FINDER_PORT}`;

// Function to start the Python store finder service
export async function startStoreFinderService(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Only start the service if it's not already running
      if (pythonProcess) {
        console.log('Store finder service is already running');
        resolve();
        return;
      }

      console.log('Starting store finder service...');
      
      // Spawn the Python process
      pythonProcess = spawn('python3', ['store_finder.py'], {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1' // Ensures Python output is not buffered
        }
      });

      // Log output from the Python process
      pythonProcess.stdout.on('data', (data: Buffer) => {
        console.log(`[Store Finder]: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.error(`[Store Finder Error]: ${data.toString().trim()}`);
      });

      // Handle process exit
      pythonProcess.on('close', (code: number) => {
        console.log(`Store finder service exited with code ${code}`);
        pythonProcess = null;
      });

      // Wait for the service to be ready
      const checkServiceReady = async () => {
        try {
          await axios.get(`${STORE_FINDER_URL}/health`);
          console.log('Store finder service is ready');
          resolve();
        } catch (error) {
          // Retry after a delay
          setTimeout(checkServiceReady, 1000);
        }
      };

      // Start checking after a short delay to allow the service to start
      setTimeout(checkServiceReady, 3000);
    } catch (error) {
      console.error('Error starting store finder service:', error);
      reject(error);
    }
  });
}

// Function to find nearby dispensaries using the store finder service
export async function findNearbyDispensaries(
  location: UserLocation, 
  selectedStrains: string[] = []
): Promise<Dispensary[]> {
  try {
    // Ensure the service is running
    if (!pythonProcess) {
      await startStoreFinderService();
    }

    // Make a request to the Python service
    const response = await axios.post(`${STORE_FINDER_URL}/find-stores`, {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      strains: selectedStrains
    });

    // Transform the response to match our Dispensary schema
    const stores = response.data.stores.map((store: any) => {
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        rating: store.rating || 0,
        reviewCount: 0, // Default value as this might not be provided
        distance: store.distance || 0,
        openNow: true, // Default value
        hours: store.hours || "Information not available",
        amenities: ["Delivery Available"],
        imageUrl: "https://images.unsplash.com/photo-1542281286-f93cd05310c6?w=800&auto=format&fit=crop",
        inventory: store.inventory || [],
        coordinates: {
          lat: 0, // These would need to be extracted from the address or provided by the service
          lng: 0
        }
      };
    });

    return stores;
  } catch (error) {
    console.error('Error finding nearby dispensaries:', error);
    // Return an empty array if there's an error
    return [];
  }
}

// Function to stop the Python store finder service
export function stopStoreFinderService(): void {
  if (pythonProcess) {
    console.log('Stopping store finder service...');
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Make sure to stop the service when the Node.js process exits
process.on('exit', stopStoreFinderService);
process.on('SIGINT', () => {
  stopStoreFinderService();
  process.exit();
});