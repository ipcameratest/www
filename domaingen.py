import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def load_file_content(filename):
    """Load and return lines from a file, stripped of whitespace"""
    try:
        with open(filename, 'r') as file:
            return [line.strip() for line in file if line.strip()]
    except FileNotFoundError:
        print(f"Error: File {filename} not found")
        return []

def generate_domains(names, extensions):
    """Generate all possible domain combinations"""
    domains = []
    for name in names:
        for ext in extensions:
            domains.append(f"{name}{ext}")
    return domains

def save_domains(domains, filename):
    """Save generated domains to a file"""
    try:
        with open(filename, 'w') as file:
            for domain in domains:
                file.write(f"{domain}\n")
        print(f"Successfully saved {len(domains)} domains to {filename}")
    except Exception as e:
        print(f"Error saving to file: {e}")

def main():
    # Get filenames from environment variables
    source_file = os.getenv('SOURCE_FILE')
    target_file = os.getenv('TARGET_FILE')
    extensions_file = os.getenv('EXTENSIONS_FILE')

    # Load input data
    names = load_file_content(source_file)
    extensions = load_file_content(extensions_file)

    if not names or not extensions:
        print("Error: Could not load required input data")
        return

    # Generate and save domains
    domains = generate_domains(names, extensions)
    save_domains(domains, target_file)

if __name__ == "__main__":
    main()
