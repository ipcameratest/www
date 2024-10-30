#!/bin/bash

echo "Stopping RTSP to DASH converter..."

# Find and kill process using port 3000
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

echo "Cleanup complete"
