from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import threading
import time

class ImageListHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/images':
            # Return list of images in JSON format
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            image_list = []
            if os.path.exists('img'):
                image_list = [f for f in os.listdir('img') if f.endswith('.png')]
                image_list.sort()
            
            self.wfile.write(json.dumps(image_list).encode())
        else:
            # Serve static files
            return SimpleHTTPRequestHandler.do_GET(self)

def run_server():
    server = HTTPServer(('localhost', 8000), ImageListHandler)
    print("Server started at http://localhost:8000")
    server.serve_forever()

if __name__ == '__main__':
    run_server()
