import React, { useEffect, useRef } from 'react';
import dashjs from 'dashjs';

const VideoPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (url && videoRef.current) {
      // Cleanup previous player instance
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      // Create new player instance
      const player = dashjs.MediaPlayer().create();
      playerRef.current = player;

      // Configure player settings
      player.updateSettings({
        'streaming': {
          'delay': {
            'liveDelay': 2
          },
          'buffer': {
            'bufferTimeAtTopQuality': 2,
            'fastSwitchEnabled': true
          },
          'stallThreshold': 0.5,
          'lowLatencyEnabled': true,
          'abr': {
            'useDefaultABRRules': true,
            'initialBitrate': {
              'audio': -1,
              'video': -1
            },
            'autoSwitchBitrate': {
              'audio': true,
              'video': true
            }
          }
        }
      });

      // Initialize player
      player.initialize(videoRef.current, url, true);
      player.setAutoPlay(true);

      // Add error handling
      player.on('error', (e) => {
        console.error('Player error:', e);
      });
    }

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000'
      }}
    />
  );
};

export default VideoPlayer;
