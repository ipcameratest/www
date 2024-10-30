#!/bin/bash

echo "Starting RTSP to DASH converter..."

# Check if port 3000 is already in use
if lsof -i:3000 > /dev/null; then
    echo "Port 3000 is already in use. Running stop script first..."
    ./stop.sh
    sleep 2
fi

# Ensure dash directory exists
mkdir -p dash

# Start the server
echo "Starting server..."
node server.js
