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

# Check if client build exists, if not build it
if [ ! -d "client/build" ]; then
    echo "Building React client..."
    npm run client-install
    npm run client-build
fi

# Start the development environment (both server and client)
if [ "$1" = "dev" ]; then
    echo "Starting development environment..."
    npm run dev
else
    # Start production server
    echo "Starting production server..."
    npm run server
fi
