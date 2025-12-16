import logging
import requests
import os
import json
from datetime import datetime

SUMO_URL = os.getenv("SUMO_LOGIC_URL")

class SumoHandler(logging.Handler):
    def emit(self, record):
        if not SUMO_URL:
            return
        
        try:
            # Format exactly like the working version
            timestamp = datetime.utcnow().isoformat()
            log_entry = f"{timestamp} [{record.levelname}] {record.getMessage()}"
            
            # Add extra info from the log record
            log_entry += f" | {record.name}:{record.lineno}"
            
            headers = {
                'X-Sumo-Name': 'fastapi-backend',
                'X-Sumo-Category': 'web-app/backend',
                'Content-Type': 'text/plain'
            }
            
            response = requests.post(
                SUMO_URL,
                data=log_entry,  # Use 'data' not formatted string
                headers=headers,
                timeout=2
            )
            response.raise_for_status()
            
        except Exception as e:
            print(f"Failed to send log to Sumo: {e}")

# Setup - call once at startup
def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Console
    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter('%(levelname)s - %(message)s'))
    logger.addHandler(console)
    
    # Sumo Logic
    if SUMO_URL:
        sumo = SumoHandler()
        logger.addHandler(sumo)