#!/bin/bash

# This script starts the Python browser automation service
# It requires:
# 1. Python 3.11+
# 2. browser-use and its dependencies
# 3. An OpenAI API key in .env

echo "Starting browser-use dispensary finder service on port 3001..."
python cannabis_store_finder.py