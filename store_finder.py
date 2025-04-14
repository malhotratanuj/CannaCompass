from dotenv import load_dotenv
import asyncio
import json
import sys
import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check if browser-use is installed, and install if not
try:
    from browser_use import Agent, Browser
    from langchain_openai import ChatOpenAI
except ImportError:
    logger.info("Installing required packages...")
    os.system("pip install browser-use langchain-openai python-dotenv fastapi uvicorn")
    from browser_use import Agent, Browser
    from langchain_openai import ChatOpenAI

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    strains: List[str] = []

class StoreResponse(BaseModel):
    id: str
    name: str
    address: str
    distance: float
    rating: float
    inventory: List[dict] = []
    hours: str = ""
    website: str = ""
    phone: str = ""

@app.post("/find-stores")
async def find_stores(request: LocationRequest):
    try:
        logger.info(f"Received request: {request}")
        
        # Check if we have the OpenAI API key
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=400, detail="OPENAI_API_KEY environment variable not set")
        
        # Format the address for the search
        location = f"{request.latitude},{request.longitude}"
        if request.address:
            location = request.address
        
        # Format the strains for the search
        strains_text = ""
        if request.strains and len(request.strains) > 0:
            strains_text = "Looking for these specific strains: " + ", ".join(request.strains)
        
        # Create the task for the browser agent
        task = f"""
        # Cannabis Store Finder Task
        
        ## Objective
        Find cannabis dispensaries near {location} that offer delivery or pickup options.
        {strains_text}
        
        ## Steps
        1. Search for "cannabis dispensaries near {location}" or "weed delivery near {location}" on Google Maps or Weedmaps.com
        2. For each store, collect the following information:
           - Store name
           - Address
           - Distance from the search location
           - Rating (out of 5 stars)
           - Store hours
           - Website URL
           - Phone number
           - Whether they offer delivery, pickup, or both
           - If possible, check if they have any of these strains in stock: {", ".join(request.strains) if request.strains else "Any popular strains"}
        
        3. Return the information for the 5 closest/best stores in JSON format with these keys:
           - id: a unique identifier (can be store name without spaces)
           - name: store name
           - address: full address
           - distance: distance in miles
           - rating: star rating
           - hours: operating hours
           - website: store website
           - phone: phone number
           - inventory: array of objects with strain details if available
        
        ## Notes
        - Focus on licensed, legal dispensaries
        - Prioritize stores that offer delivery options
        - If a store's inventory can't be checked, just note that inventory information is unavailable
        """
        
        # Initialize browser and agent
        browser = Browser()  # headless=True is no longer supported in newer versions
        agent = Agent(
            task=task,
            llm=ChatOpenAI(model="gpt-4o"),
            browser=browser,
        )
        
        # Run the agent
        result = await agent.run()
        await browser.close()
        
        # Parse the results to find JSON
        stores_data = []
        try:
            # Look for JSON content in the response
            json_start = result.find('[')
            json_end = result.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_string = result[json_start:json_end]
                stores_data = json.loads(json_string)
            else:
                # If no JSON array found, look for individual store objects
                json_start = result.find('{')
                json_end = result.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_string = result[json_start:json_end]
                    stores_data = [json.loads(json_string)]
                else:
                    # Fallback: create structured data from the text response
                    logger.warning("Could not find JSON data in response, using text parsing")
                    stores_data = [
                        {
                            "id": "store1",
                            "name": "Results from search",
                            "address": "Parse error - see details",
                            "distance": 0,
                            "rating": 0,
                            "hours": "",
                            "website": "",
                            "phone": "",
                            "inventory": [],
                            "details": result
                        }
                    ]
        except Exception as e:
            logger.error(f"Error parsing store data: {e}")
            stores_data = [
                {
                    "id": "error1",
                    "name": "Error Processing Results",
                    "address": "An error occurred while processing the search results",
                    "distance": 0,
                    "rating": 0,
                    "hours": "",
                    "website": "",
                    "phone": "",
                    "inventory": [],
                    "error": str(e),
                    "raw_response": result
                }
            ]
        
        return {"stores": stores_data}
    except Exception as e:
        logger.error(f"Error in find_stores: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    # Run the server if called directly
    logger.info("Starting store finder service...")
    uvicorn.run(app, host="0.0.0.0", port=5001)