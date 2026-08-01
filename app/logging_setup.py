import logging, sys
from app.utils.telegram import safe_cb_answer

def setup_logging(level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="\x1b[36m%(asctime)s\x1b[0m %(levelname)s %(name)s — %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
