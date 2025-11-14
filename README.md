# 🎯 Crosshair Creator

A comprehensive crosshair creation tool for gaming enthusiasts. Create, customize, and export crosshairs for VALORANT, Overwatch 2, CS2, Marvel Rivals, and Fortnite.

## Features

### Crosshair Customization
- **Multiple Styles**:
  - Cross (traditional 4-line crosshair)
  - Circle (ring crosshair)
  - Pixels (draw your own pixel art)
  - Custom (import any PNG image)

- **Advanced Settings**:
  - Gap: Adjust the distance from center
  - Length: Control line length
  - Thickness: Modify line width
  - Outline Thickness: Add black outlines for visibility
  - Color: Full RGB color picker
  - Opacity: 0-100% transparency

### Center Dot
- **Dot Styles**:
  - Circle
  - Cross
  - Pixels (custom pixel art)
  - Custom PNG import

- **Dot Settings**:
  - Size adjustment
  - Outline thickness
  - Independent color and opacity
  - Outline color and opacity

### Image Overlay
- Upload any image to overlay on your crosshair
- Adjustable size and opacity
- Perfect for creative crosshair designs

### Export Options
- **FullHD**: 1920x1080 PNG
- **2K**: 2560x1440 PNG
- Transparent background for overlay in games

### Game Presets
Quick-load presets for popular professional players:
- **VALORANT**: TenZ-style crosshair
- **Overwatch 2**: Classic circle crosshair
- **CS2**: s1mple-inspired crosshair
- **Marvel Rivals**: Bold, visible crosshair
- **Fortnite**: Ninja-style crosshair

### Community Features
- **Save to Bookmarks**: Store your favorite crosshairs locally
- **Share**: Generate shareable URLs for your crosshairs
- **Browse**: Explore popular community crosshairs
- **One-click Load**: Apply any community crosshair instantly

## How to Use

### Getting Started
1. Open `index.html` in any modern web browser
2. The crosshair preview appears in the center panel
3. Adjust settings in the left panel
4. See changes in real-time

### Creating a Custom Crosshair

#### Basic Cross Crosshair
1. Select "Cross" from Crosshair Style
2. Adjust Gap slider (distance from center)
3. Adjust Length slider (line length)
4. Adjust Thickness slider (line width)
5. Choose your color
6. Add outline thickness for better visibility

#### Circle Crosshair
1. Select "Circle" from Crosshair Style
2. Gap controls the inner radius
3. Length controls the ring thickness
4. Other settings work the same

#### Pixel Art Crosshair
1. Select "Pixels" from Crosshair Style
2. A 32x32 pixel grid opens
3. Click cells to toggle them on/off
4. Click "Done" when finished
5. Your pixel art becomes your crosshair

#### Custom Image Crosshair
1. Select "Custom" from Crosshair Style
2. Upload PNG image option appears
3. Click "Choose File" and select your image
4. Image displays as your crosshair

### Adding a Center Dot
1. Check "Enable Center Dot"
2. Choose dot style (circle, cross, pixels, custom)
3. Adjust size, color, and opacity
4. Customize outline independently

### Adding Image Overlays
1. Check "Enable Image Overlay"
2. Upload your overlay image
3. Adjust size and opacity
4. Perfect for memes or creative designs

### Exporting Your Crosshair
1. Click "Export FullHD (1920x1080)" or "Export 2K (2560x1440)"
2. PNG file downloads automatically
3. Use as overlay in OBS, game overlays, etc.

### Saving and Sharing
1. **Save**: Click "Save to Bookmarks" to store locally
2. **Share**: Click "Share Crosshair" to get a URL
3. **Load**: Browse community tab and click any crosshair to load it

## Technical Details

### File Structure
```
CrosshairCreator/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── script.js       # Application logic
└── README.md       # Documentation
```

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ⚠️ Limited (desktop recommended)

### Local Storage
- Bookmarks saved to browser's localStorage
- Persists between sessions
- No server required

## Integration with Next.js

This tool can be refactored into your Next.js application. Here's a migration guide:

### Component Structure
```
components/
├── CrosshairCreator/
│   ├── index.jsx                 # Main component
│   ├── CrosshairCanvas.jsx       # Preview canvas
│   ├── SettingsPanel.jsx         # Left settings panel
│   ├── CommunityPanel.jsx        # Right community panel
│   ├── PixelDrawModal.jsx        # Pixel drawing modal
│   └── styles.module.scss        # Component styles
```

### Key Conversions

#### 1. Convert to React Component
```jsx
// components/CrosshairCreator/index.jsx
import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.scss';

export default function CrosshairCreator() {
  const [settings, setSettings] = useState({
    crosshair: {
      style: 'cross',
      gap: 4,
      length: 10,
      // ... other settings
    },
    // ... other state
  });

  // Convert class methods to hooks and functions
  // ...
}
```

#### 2. Use React State
Replace `this.settings` with React state:
```jsx
const [settings, setSettings] = useState(initialSettings);
```

#### 3. Use react-colorful
Replace native color picker with react-colorful (already in your package.json):
```jsx
import { HexColorPicker } from 'react-colorful';

<HexColorPicker color={settings.crosshair.color} onChange={(color) => {
  setSettings({...settings, crosshair: {...settings.crosshair, color}});
}} />
```

#### 4. Convert localStorage to API calls (optional)
For community features, replace localStorage with API calls to your backend.

### Migration Steps
1. Create component structure
2. Convert HTML to JSX
3. Convert CSS to SCSS modules
4. Replace vanilla JS with React hooks
5. Integrate with your existing app layout
6. Add server-side storage for community features (optional)

## Future Enhancements
- [ ] More game presets
- [ ] Animation support (moving crosshairs)
- [ ] Recoil/spread visualization
- [ ] Video import for animated crosshairs
- [ ] User accounts for cloud storage
- [ ] Upvote/downvote community crosshairs
- [ ] Search and filter community crosshairs
- [ ] Copy crosshair codes (like VALORANT format)

## Tips for Best Results

### Visibility Tips
1. Use outline thickness for crosshairs on bright backgrounds
2. Bright colors (cyan, yellow, green) show well on most maps
3. Test on different backgrounds using the grid toggle

### Export Tips
1. Export at your monitor's native resolution
2. Use transparent background for overlay tools
3. Save multiple variations to test in-game

### Performance Tips
1. Pixel art crosshairs render slightly slower than basic shapes
2. Large overlay images may impact performance
3. Keep custom images under 1MB for best results

## Credits
Created for gaming enthusiasts who want precise crosshair customization across multiple games.

## License
Free to use and modify. Attribution appreciated but not required.
