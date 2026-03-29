#!/usr/bin/env bash
# exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Install Playwright browser and its dependencies
playwright install chromium
playwright install-deps chromium
