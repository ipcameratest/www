#!/bin/bash

RTSP_URL=$1
OUTPUT_DIR=$2

ffmpeg -i $RTSP_URL \
  -map 0 \
  -c:v libx264 -b:v 800k -preset ultrafast -tune zerolatency \
  -c:a aac -b:a 128k \
  -f dash \
  -window_size 5 \
  -extra_window_size 10 \
  -min_seg_duration 2000000 \
  -remove_at_exit 0 \
  -use_template 1 \
  -use_timeline 1 \
  -streaming 1 \
  -ldash 1 \
  -adaptation_sets "id=0,streams=v id=1,streams=a" \
  $OUTPUT_DIR/stream.mpd
