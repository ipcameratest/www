from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from PIL import Image
import os
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create img directory if it doesn't exist
if not os.path.exists('img'):
    os.makedirs('img')

def setup_driver():
    """Setup Chrome driver with appropriate options"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Use webdriver_manager to get the correct ChromeDriver version
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

async def process_screenshot(driver, url, output_path):
    """Process a single screenshot asynchronously"""
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        logging.info(f"Processing: {url}")
        
        # Use ThreadPoolExecutor for browser operations
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: driver.get(url))
        await asyncio.sleep(3)  # Wait for page load
        
        # Take screenshot
        await loop.run_in_executor(None, lambda: driver.save_screenshot(output_path))
        
        # Resize image
        await loop.run_in_executor(None, resize_image, output_path)
        
        logging.info(f"Screenshot saved: {output_path}")
        return True
    
    except WebDriverException as e:
        logging.error(f"Error accessing {url}: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Error processing {url}: {str(e)}")
        return False

def resize_image(output_path):
    """Resize image to 500px width"""
    try:
        with Image.open(output_path) as img:
            width_percent = (500 / float(img.size[0]))
            new_height = int((float(img.size[1]) * float(width_percent)))
            resized_img = img.resize((500, new_height), Image.Resampling.LANCZOS)
            resized_img.save(output_path)
    except Exception as e:
        logging.error(f"Error resizing image {output_path}: {str(e)}")

async def process_batch(domains, start_idx, batch_size):
    """Process a batch of domains with a dedicated driver"""
    driver = None
    try:
        driver = setup_driver()
        batch = domains[start_idx:start_idx + batch_size]
        tasks = []
        for domain in batch:
            output_path = os.path.join('img', f"{domain.replace('.', '_')}.png")
            task = process_screenshot(driver, domain, output_path)
            tasks.append(task)
        await asyncio.gather(*tasks)
    except Exception as e:
        logging.error(f"Error in batch processing: {str(e)}")
    finally:
        if driver:
            driver.quit()

async def main():
    try:
        # Read domains from target.txt
        with open('target.txt', 'r') as file:
            domains = [line.strip() for line in file]
        
        # Calculate optimal batch size and number of concurrent drivers
        total_domains = len(domains)
        max_concurrent_drivers = min(os.cpu_count() or 1, 4)  # Limit to max 4 drivers
        batch_size = (total_domains + max_concurrent_drivers - 1) // max_concurrent_drivers
        
        logging.info(f"Processing {total_domains} domains with {max_concurrent_drivers} concurrent drivers")
        
        # Create tasks for each batch
        tasks = []
        for i in range(0, total_domains, batch_size):
            task = process_batch(domains, i, batch_size)
            tasks.append(task)
        
        # Run all batches concurrently
        await asyncio.gather(*tasks)
        
        logging.info("Processing completed successfully!")
    
    except Exception as e:
        logging.error(f"Error in main process: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
