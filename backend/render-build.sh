#!/usr/bin/env bash
# exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Install Playwright browser
# DO NOT run install-deps on Render, it attempts to use sudo which fails.
# Render's native OS images usually contain the necessary deps natively.
playwright install chromium
