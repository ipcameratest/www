#!/bin/bash

RTSP_URL=$1
OUTPUT_DIR=$2

ffmpeg -i $RTSP_URL \
  -map 0 \
  -c:v libx264 -b:v 800k \
  -c:a aac -b:a 128k \
  -f dash \
  $OUTPUT_DIR/stream.mpd
