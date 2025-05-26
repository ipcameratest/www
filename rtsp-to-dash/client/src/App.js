import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import VideoPlayer from './components/VideoPlayer';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3033';

function App() {
  const [rtspUrl, setRtspUrl] = useState('');
  const [dashUrl, setDashUrl] = useState(`${API_URL}/dash/stream.mpd`);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const handleConvert = async () => {
    try {
      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rtspUrl }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setNotification({
        open: true,
        message: 'Conversion started successfully',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            RTSP to DASH Converter
          </Typography>
          
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Convert Stream
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="RTSP URL"
                variant="outlined"
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://example.com/stream"
              />
              <Button
                variant="contained"
                onClick={handleConvert}
                disabled={!rtspUrl}
                sx={{ minWidth: '120px' }}
              >
                Convert
              </Button>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Video Player
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="DASH URL"
                variant="outlined"
                value={dashUrl}
                onChange={(e) => setDashUrl(e.target.value)}
              />
            </Box>
            <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: 'black' }}>
              <VideoPlayer url={dashUrl} />
            </Box>
          </Paper>
        </Box>

        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
