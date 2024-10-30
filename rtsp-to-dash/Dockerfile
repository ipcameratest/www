# Use the official Node.js image
FROM node:14

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /usr/src/app

# Create and set permissions for the dash directory
RUN mkdir -p /usr/src/app/dash && chmod -R 777 /usr/src/app/dash

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application code
COPY . .

# Make the conversion script executable
RUN chmod +x convert.sh

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD [ "node", "server.js" ]
