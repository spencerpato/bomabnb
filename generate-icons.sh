#!/bin/bash

# BomaBnB Icon Generation Script
# This script helps you create all required icon sizes from a base logo

echo "🎨 BomaBnB Icon Generation Script"
echo "=================================="

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed. Please install it first:"
    echo "   - Windows: Download from https://imagemagick.org/script/download.php#windows"
    echo "   - macOS: brew install imagemagick"
    echo "   - Linux: sudo apt-get install imagemagick"
    exit 1
fi

# Create icons directory
mkdir -p public/icons

# Base logo file (you need to create this first)
BASE_LOGO="bomabnb-logo-512x512.png"

if [ ! -f "$BASE_LOGO" ]; then
    echo "❌ Base logo file not found: $BASE_LOGO"
    echo "Please create a 512x512 PNG version of your BomaBnB logo first."
    echo "The logo should have:"
    echo "  - Light beige background (#F9F7F3)"
    echo "  - Orange-brown house (#D4A017)"
    echo "  - Dark green interior elements (#2D5016)"
    echo "  - 'BomaBnB' text in dark green"
    exit 1
fi

echo "✅ Found base logo: $BASE_LOGO"
echo "🔄 Generating all icon sizes..."

# Generate favicon files
echo "📄 Creating favicon files..."
convert "$BASE_LOGO" -resize 16x16 public/favicon-16x16.png
convert "$BASE_LOGO" -resize 32x32 public/favicon-32x32.png
convert "$BASE_LOGO" -resize 48x48 public/favicon-48x48.png

# Create favicon.ico with multiple sizes
convert "$BASE_LOGO" -resize 16x16 -resize 32x32 -resize 48x48 public/favicon.ico

# Generate PWA icons
echo "📱 Creating PWA icons..."
convert "$BASE_LOGO" -resize 72x72 public/icons/icon-72x72.png
convert "$BASE_LOGO" -resize 96x96 public/icons/icon-96x96.png
convert "$BASE_LOGO" -resize 128x128 public/icons/icon-128x128.png
convert "$BASE_LOGO" -resize 144x144 public/icons/icon-144x144.png
convert "$BASE_LOGO" -resize 152x152 public/icons/icon-152x152.png
convert "$BASE_LOGO" -resize 192x192 public/icons/icon-192x192.png
convert "$BASE_LOGO" -resize 384x384 public/icons/icon-384x384.png
convert "$BASE_LOGO" -resize 512x512 public/icons/icon-512x512.png

# Generate Apple touch icons
echo "🍎 Creating Apple touch icons..."
convert "$BASE_LOGO" -resize 180x180 public/icons/apple-touch-icon.png
convert "$BASE_LOGO" -resize 152x152 public/icons/apple-touch-icon-152x152.png
convert "$BASE_LOGO" -resize 167x167 public/icons/apple-touch-icon-167x167.png

# Optimize all PNG files
echo "⚡ Optimizing PNG files..."
for file in public/icons/*.png public/favicon-*.png; do
    if [ -f "$file" ]; then
        # Optimize PNG files (requires pngquant)
        if command -v pngquant &> /dev/null; then
            pngquant --ext .png --force "$file"
        fi
    fi
done

echo "✅ All icons generated successfully!"
echo ""
echo "📁 Files created:"
echo "   - public/favicon.ico"
echo "   - public/favicon-16x16.png"
echo "   - public/favicon-32x32.png"
echo "   - public/icons/icon-*.png (8 sizes)"
echo "   - public/icons/apple-touch-icon*.png (3 sizes)"
echo ""
echo "🎯 Next steps:"
echo "   1. Test the favicon in your browser"
echo "   2. Test PWA installation on mobile"
echo "   3. Verify icons display correctly"
echo "   4. Check Apple touch icons on iOS devices"
echo ""
echo "🔧 Manual creation alternative:"
echo "   If you prefer manual creation, use online tools:"
echo "   - https://favicon.io/"
echo "   - https://realfavicongenerator.net/"
echo "   - https://www.favicon-generator.org/"
