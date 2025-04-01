#!/bin/bash
# Script to move unused files to .deprecated folder

# Create .deprecated directory and subdirectories if they don't exist
mkdir -p .deprecated/pages
mkdir -p .deprecated/pages/api
mkdir -p .deprecated/pages/admin
mkdir -p .deprecated/components/books
mkdir -p .deprecated/components/ui
mkdir -p .deprecated/public
mkdir -p .deprecated/lib

# Unused API endpoints
mv pages/api/standalone-signal.ts .deprecated/pages/api/
mv pages/api/content-manager-get.ts .deprecated/pages/api/
mv pages/api/content-manager-post.ts .deprecated/pages/api/

# Unused Components
mv components/books/DirectBookGrid.tsx .deprecated/components/books/
mv components/ui/Loading.tsx .deprecated/components/ui/

# Debug/Test Pages
mv pages/api-test.tsx .deprecated/pages/
mv pages/api-status.tsx .deprecated/pages/
mv pages/direct-login.tsx .deprecated/pages/
mv pages/admin/local-signals.tsx .deprecated/pages/admin/
mv pages/admin/standalone.tsx .deprecated/pages/admin/

# Configuration and Utility Files
mv next.config.debug.js .deprecated/

# Public HTML and Scripts
mv public/fix-api-url.js .deprecated/public/

echo "Cleanup completed. Unused files moved to .deprecated folder."