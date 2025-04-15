#!/usr/bin/env python3
"""
Cannabis Store Finder using browser-use

This script uses browser-use to automate finding cannabis dispensaries near a given location
that have specific cannabis strains in stock.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from browser_use import Agent
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define FastAPI app
app = FastAPI()

# Define input model
class LocationRequest(BaseModel):
    postal_code: str
    address: Optional[str] = None
    strains: List[str] = []
    radius: float = 5.0  # Search radius in km

# Define output model
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

# Function to find cannabis stores
async def find_cannabis_stores(location: LocationRequest) -> List[Dict[Any, Any]]:
    """
    Use browser-use to find cannabis dispensaries near the given location that have the specific strains
    """
    # Format the strains for the prompt
    strain_list = ", ".join(location.strains) if location.strains else "any cannabis strains"
    
    # Define the task for the agent
    task = f"""
    Find cannabis dispensaries near {location.postal_code} in Canada. 
    Search for stores that might have these strains in stock: {strain_list}.
    
    For each store, collect:
    1. Store name
    2. Address
    3. Distance from the search location
    4. Rating (if available)
    5. Opening hours
    6. Website URL
    7. Phone number
    
    Sort results by proximity (closest first).
    Format the results as a JSON array with these properties: id, name, address, distance, rating, hours, website, phone, inventory
    where inventory is a list of objects with strainId, strainName, price, and inStock properties if that data is available.
    
    Only search for legal cannabis dispensaries in Canada.
    """
    
    try:
        # Initialize the agent with OpenAI
        agent = Agent(
            task=task,
            llm=ChatOpenAI(model="gpt-4o"),
            custom_functions={},
            show_browser=False
        )
        
        # Run the agent
        result = await agent.run()
        
        # Extract the JSON data from the result
        # We expect the agent to return a JSON string
        try:
            if isinstance(result, str):
                if "```json" in result:
                    # Extract JSON from markdown code block
                    json_str = result.split("```json")[1].split("```")[0].strip()
                    stores = json.loads(json_str)
                else:
                    # Try loading the string directly
                    stores = json.loads(result)
            else:
                # If result is already a dict/list
                stores = result
                
            # Ensure we have a list of stores
            if not isinstance(stores, list):
                if isinstance(stores, dict) and "stores" in stores:
                    stores = stores["stores"]
                else:
                    raise ValueError("Unexpected format: Result is not a list or dict with 'stores' key")
                    
            return stores
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing result: {e}")
            print(f"Raw result: {result}")
            # Return an empty list if parsing fails
            return []
            
    except Exception as e:
        print(f"Error during store search: {e}")
        return []

@app.post("/find-stores")
async def api_find_stores(request: LocationRequest):
    """API endpoint to find cannabis stores near a location"""
    try:
        stores = await find_cannabis_stores(request)
        return {"stores": stores}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "cannabis-store-finder"}

# Stand-alone execution
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 3001))
    
    # Run the FastAPI app with uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)