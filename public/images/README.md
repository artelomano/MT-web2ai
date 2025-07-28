# Images Directory

This directory contains images for the Menestystarinat AI UI application.

## Required Files

### Logo
- **File**: `logo.png` or `logo.svg`
- **Size**: Recommended 200x200px or larger
- **Format**: PNG, SVG, or WebP
- **Usage**: Company logo displayed in the header

### Favicon
- **File**: `favicon.ico`
- **Size**: 16x16px, 32x32px, 48x48px (multi-size ICO)
- **Format**: ICO format
- **Usage**: Browser tab icon

### Mascot (Optional)
- **File**: `mascot.png` or `mascot.svg`
- **Size**: Recommended 200x200px
- **Format**: PNG, SVG, or WebP
- **Usage**: AI assistant mascot in the right panel

## Adding Your Images

1. Place your logo file in this directory
2. Place your favicon.ico file in this directory
3. Update the HTML references if needed:
   - Logo: Update the logo-icon div in `public/index.html`
   - Favicon: Already referenced in the HTML head

## Current Implementation

The application currently uses:
- A simple "M" text logo in the header
- A CSS-generated mascot (animated face)
- Default browser favicon

## Customization

To use your own images:

1. **Logo**: Replace the text "M" in the header with an `<img>` tag
2. **Favicon**: Simply place your favicon.ico file here
3. **Mascot**: Replace the CSS-generated mascot with an image

Example logo implementation:
```html
<div class="logo">
    <img src="images/logo.png" alt="Menestystarinat" class="logo-image">
    <span class="logo-text">Menestystarinat AI</span>
</div>
```

## File Naming Convention

- Use lowercase letters
- Use hyphens for spaces
- Include file extension
- Examples: `logo.png`, `favicon.ico`, `mascot.svg` 