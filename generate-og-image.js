import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple script to create a 1200x630 OG image from the logo
// This uses Sharp for image processing

const createOGImage = async () => {
  try {
    
    const logoPath = path.join(__dirname, 'public', 'bomabnb-logo.png');
    const outputPath = path.join(__dirname, 'public', 'og-image.jpg');
    
    console.log('📸 Creating OG image from logo...');
    
    // Create a 1200x630 canvas with gradient background
    const width = 1200;
    const height = 630;
    
    // Read the logo
    const logoBuffer = fs.readFileSync(logoPath);
    const logoMetadata = await sharp(logoBuffer).metadata();
    
    // Calculate logo size (make it 40% of canvas width)
    const logoWidth = Math.floor(width * 0.4);
    const logoHeight = Math.floor((logoMetadata.height / logoMetadata.width) * logoWidth);
    
    // Resize logo
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth, logoHeight)
      .toBuffer();
    
    // Create background (gradient gold to green)
    const background = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 245, g: 158, b: 11, alpha: 1 } // Gold color
      }
    })
    .png()
    .toBuffer();
    
    // Composite logo onto background (centered)
    const logoX = Math.floor((width - logoWidth) / 2);
    const logoY = Math.floor((height - logoHeight) / 2) - 50; // Slightly up for text space
    
    await sharp(background)
      .composite([
        {
          input: resizedLogo,
          top: logoY,
          left: logoX
        }
      ])
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    console.log('✅ OG image created successfully at:', outputPath);
    console.log('📏 Size: 1200 x 630 pixels');
    console.log('🎨 Perfect for WhatsApp, Facebook, Twitter!');
    
  } catch (error) {
    console.error('❌ Error creating OG image:', error.message);
    process.exit(1);
  }
};

createOGImage();
