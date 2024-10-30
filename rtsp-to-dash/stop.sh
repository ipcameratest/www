#!/bin/bash

echo "Stopping RTSP to DASH converter..."

# Find and kill process using port 3000 (server)
PORT_PID=$(lsof -t -i:3000)
if [ ! -z "$PORT_PID" ]; then
    echo "Killing process on port 3000 (PID: $PORT_PID)"
    kill -9 $PORT_PID
    if [ $? -eq 0 ]; then
        echo "Successfully stopped server on port 3000"
    else
        echo "Failed to stop server on port 3000"
    fi
else
    echo "No process found running on port 3000"
fi

# Find and kill process using port 3001 (React development server)
REACT_PID=$(lsof -t -i:3001)
if [ ! -z "$REACT_PID" ]; then
    echo "Killing React development server on port 3001 (PID: $REACT_PID)"
    kill -9 $REACT_PID
    if [ $? -eq 0 ]; then
        echo "Successfully stopped React development server"
    else
        echo "Failed to stop React development server"
    fi
fi

# Find and kill any FFmpeg processes started by our converter
FFMPEG_PIDS=$(ps aux | grep '[f]fmpeg.*dash' | awk '{print $2}')
if [ ! -z "$FFMPEG_PIDS" ]; then
    echo "Killing FFmpeg processes..."
    for PID in $FFMPEG_PIDS; do
        kill -9 $PID
        if [ $? -eq 0 ]; then
            echo "Successfully stopped FFmpeg process (PID: $PID)"
        else
            echo "Failed to stop FFmpeg process (PID: $PID)"
        fi
    done
else
    echo "No FFmpeg processes found"
fi

# Kill any remaining node processes related to our app
NODE_PIDS=$(ps aux | grep '[n]ode.*rtsp-to-dash' | awk '{print $2}')
if [ ! -z "$NODE_PIDS" ]; then
    echo "Killing Node.js processes..."
    for PID in $NODE_PIDS; do
        kill -9 $PID
        if [ $? -eq 0 ]; then
            echo "Successfully stopped Node.js process (PID: $PID)"
        else
            echo "Failed to stop Node.js process (PID: $PID)"
        fi
    done
fi

echo "Cleanup complete"
