#!/bin/bash
npm ci && npm run build
python3 -m http.server
