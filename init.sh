#!/bin/bash

echo "Starting initialization..."

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "Creating directories..."
mkdir -p img

# Set proper permissions
echo "Setting permissions..."
chmod +x domaingen.py
chmod +x screenshot.py

# Run domain generator
echo "Generating domain combinations..."
python3 domaingen.py

# Run screenshot generator
echo "Taking screenshots of domains..."
python3 screenshot.py

echo "Initialization complete!"
echo "Screenshots are saved in the 'img' directory"

# Deactivate virtual environment
deactivate
