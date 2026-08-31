<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl shadow-none">
      <DialogHeader>
        <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Documentation
          </DialogTitle>
      </DialogHeader>
      
      <div class="overflow-y-auto max-h-[70vh] pr-4 space-y-4">
        <!-- Getting Started Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Getting Started
          </h3>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            Welcome to Euclid! This is a powerful design and content creation application built with modern web technologies.
            Start by creating a new file or opening an existing template to begin your creative journey.
          </p>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">First Steps:</span>
              <span class="text-muted-foreground"> Choose a template or start with a blank canvas</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Interface Tour:</span>
              <span class="text-muted-foreground"> Explore the toolbar, panels, and canvas area</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Save Early:</span>
              <span class="text-muted-foreground"> Use Ctrl+S frequently to save your progress</span>
            </div>
          </div>
        </div>

        <!-- Canvas Basics Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Canvas Basics
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Navigation:</span>
              <span class="text-muted-foreground"> Left Click & Drag to pan, Scroll Wheel to zoom</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Selection:</span>
              <span class="text-muted-foreground"> Click elements to select, Shift+Click for multi-select</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Context Menu:</span>
              <span class="text-muted-foreground"> Right-click for quick actions and options</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Guides & Rulers:</span>
              <span class="text-muted-foreground"> Use View menu to toggle alignment guides</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Grid System:</span>
              <span class="text-muted-foreground"> Enable snap-to-grid for precise alignment</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Undo/Redo:</span>
              <span class="text-muted-foreground"> Ctrl+Z / Ctrl+Y, unlimited history</span>
            </div>
          </div>
        </div>

        <!-- Working with Elements Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Working with Elements
          </h3>
          <div class="space-y-2">
            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Text Elements</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Textbox:</span>
                <span class="text-muted-foreground"> Add and format text with custom fonts and sizes</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Vertical Text:</span>
                <span class="text-muted-foreground"> Create vertical text layouts</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Arc Text:</span>
                <span class="text-muted-foreground"> Text following curved paths</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Rich Formatting:</span>
                <span class="text-muted-foreground"> Bold, italic, underline, strikethrough</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Shape Elements</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Basic Shapes:</span>
                <span class="text-muted-foreground"> Rectangles, circles, triangles, polygons</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Custom Paths:</span>
                <span class="text-muted-foreground"> Draw freeform shapes with pen tool</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Lines & Arrows:</span>
                <span class="text-muted-foreground"> Straight lines, curved lines, arrows</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Boolean Operations:</span>
                <span class="text-muted-foreground"> Union, subtract, intersect shapes</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Media Elements</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Images:</span>
                <span class="text-muted-foreground"> Import PNG, JPG, SVG, WebP formats</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Image Matting:</span>
                <span class="text-muted-foreground"> Remove backgrounds automatically</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Charts & Graphs:</span>
                <span class="text-muted-foreground"> Create data visualizations</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">QR Codes:</span>
                <span class="text-muted-foreground"> Generate scannable QR codes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Styling Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Advanced Styling & Effects
          </h3>
          <div class="space-y-2">
            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Appearance</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Fill & Stroke:</span>
                <span class="text-muted-foreground"> Solid colors, gradients, patterns</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Stroke Styles:</span>
                <span class="text-muted-foreground"> Width, cap, join, dash patterns</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Color Picker:</span>
                <span class="text-muted-foreground"> RGB, HSL, HEX color modes</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Effects & Filters</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Drop Shadow:</span>
                <span class="text-muted-foreground"> Offset, blur, color, opacity</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Inner Shadow:</span>
                <span class="text-muted-foreground"> Create depth with inset shadows</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Blur Effects:</span>
                <span class="text-muted-foreground"> Gaussian blur, motion blur</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Blend Modes:</span>
                <span class="text-muted-foreground"> Multiply, screen, overlay, etc.</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Typography</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Font Management:</span>
                <span class="text-muted-foreground"> Google Fonts integration, local fonts</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Text Spacing:</span>
                <span class="text-muted-foreground"> Character spacing, line height, kerning</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Text Effects:</span>
                <span class="text-muted-foreground"> Outline, glow, gradient text</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tools & Features Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Tools & Features
          </h3>
          <div class="space-y-2">
            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Drawing Tools</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Pen Tool:</span>
                <span class="text-muted-foreground"> Create smooth curves and paths</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Brush Tool:</span>
                <span class="text-muted-foreground"> Freehand drawing with pressure sensitivity</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Shape Builder:</span>
                <span class="text-muted-foreground"> Combine and subtract shapes</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Selection Tools</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Magic Wand:</span>
                <span class="text-muted-foreground"> Select by color similarity</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Lasso Tool:</span>
                <span class="text-muted-foreground"> Freeform selection</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Object Selection:</span>
                <span class="text-muted-foreground"> Smart object recognition</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Transform Tools</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Rotate:</span>
                <span class="text-muted-foreground"> Free rotation with angle snapping</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Scale:</span>
                <span class="text-muted-foreground"> Resize with aspect ratio lock</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Skew & Distort:</span>
                <span class="text-muted-foreground"> Perspective and warp transformations</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Export & File Formats Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Export & File Formats
          </h3>
          <div class="space-y-2">
            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Image Formats</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">PNG:</span>
                <span class="text-muted-foreground"> Lossless, transparent backgrounds</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">JPG/JPEG:</span>
                <span class="text-muted-foreground"> Compressed, smaller file sizes</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">SVG:</span>
                <span class="text-muted-foreground"> Vector format, scalable</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">WebP:</span>
                <span class="text-muted-foreground"> Modern format, best compression</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Document Formats</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">PDF:</span>
                <span class="text-muted-foreground"> Print-ready, multi-page support</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">EPS:</span>
                <span class="text-muted-foreground"> Vector format for print</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">AI:</span>
                <span class="text-muted-foreground"> Adobe Illustrator format</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Export Options</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Quality Settings:</span>
                <span class="text-muted-foreground"> Control compression and quality</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Batch Export:</span>
                <span class="text-muted-foreground"> Export multiple formats at once</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Custom Sizes:</span>
                <span class="text-muted-foreground"> Define custom export dimensions</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcuts Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Keyboard Shortcuts
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1">
              <h5 class="text-[10px] font-bold uppercase tracking-wide text-foreground">File Operations</h5>
              <div class="text-[10px] space-y-0.5">
                <div><span class="font-semibold">Ctrl+N</span> New File</div>
                <div><span class="font-semibold">Ctrl+O</span> Open File</div>
                <div><span class="font-semibold">Ctrl+S</span> Save</div>
                <div><span class="font-semibold">Ctrl+Shift+S</span> Save As</div>
                <div><span class="font-semibold">Ctrl+P</span> Print</div>
                <div><span class="font-semibold">Ctrl+E</span> Export</div>
              </div>
            </div>

            <div class="space-y-1">
              <h5 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Edit Operations</h5>
              <div class="text-[10px] space-y-0.5">
                <div><span class="font-semibold">Ctrl+Z</span> Undo</div>
                <div><span class="font-semibold">Ctrl+Y</span> Redo</div>
                <div><span class="font-semibold">Ctrl+X</span> Cut</div>
                <div><span class="font-semibold">Ctrl+C</span> Copy</div>
                <div><span class="font-semibold">Ctrl+V</span> Paste</div>
                <div><span class="font-semibold">Ctrl+A</span> Select All</div>
                <div><span class="font-semibold">Delete</span> Delete</div>
                <div><span class="font-semibold">Ctrl+D</span> Duplicate</div>
              </div>
            </div>

            <div class="space-y-1">
              <h5 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Tools & View</h5>
              <div class="text-[10px] space-y-0.5">
                <div><span class="font-semibold">V</span> Selection Tool</div>
                <div><span class="font-semibold">T</span> Text Tool</div>
                <div><span class="font-semibold">M</span> Rectangle Tool</div>
                <div><span class="font-semibold">L</span> Line Tool</div>
                <div><span class="font-semibold">Ctrl++</span> Zoom In</div>
                <div><span class="font-semibold">Ctrl+-</span> Zoom Out</div>
                <div><span class="font-semibold">Ctrl+0</span> Fit to Screen</div>
                <div><span class="font-semibold">F11</span> Fullscreen</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance & Optimization Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Performance & Optimization
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Canvas Size:</span>
              <span class="text-muted-foreground"> Larger canvases may impact performance</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Image Resolution:</span>
              <span class="text-muted-foreground"> High-res images can slow down rendering</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Layer Management:</span>
              <span class="text-muted-foreground"> Group elements to improve performance</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Effects Usage:</span>
              <span class="text-muted-foreground"> Complex effects may reduce responsiveness</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Memory Usage:</span>
              <span class="text-muted-foreground"> Monitor RAM usage with large projects</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Auto-Save:</span>
              <span class="text-muted-foreground"> Enabled by default to prevent data loss</span>
            </div>
          </div>
        </div>

        <!-- Troubleshooting Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Troubleshooting
          </h3>
          <div class="space-y-2">
            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Common Issues</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Slow Performance:</span>
                <span class="text-muted-foreground"> Reduce canvas size or disable effects</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">File Won't Save:</span>
                <span class="text-muted-foreground"> Check disk space and file permissions</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Elements Not Visible:</span>
                <span class="text-muted-foreground"> Check layer visibility and opacity</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Fonts Not Loading:</span>
                <span class="text-muted-foreground"> Verify internet connection for Google Fonts</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">Recovery Options</h4>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Auto-Recovery:</span>
                <span class="text-muted-foreground"> Automatic backup of unsaved work</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Version History:</span>
                <span class="text-muted-foreground"> Access previous versions of your file</span>
              </div>
              <div class="text-[11px]">
                <span class="font-semibold text-foreground">Backup Files:</span>
                <span class="text-muted-foreground"> Located in user data directory</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pro Tips Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Pro Tips & Best Practices
          </h3>
          <ul class="space-y-1">
            <li class="text-[11px] text-muted-foreground">
              • Use guides and rulers to align elements perfectly
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Group elements together to manage them as one object
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Use layers panel to organize your elements hierarchically
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Experiment with blend modes for creative effects
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Save templates for reusable designs and layouts
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Use keyboard shortcuts to speed up your workflow
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Create custom color palettes for consistent branding
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Use the transform panel for precise positioning
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Leverage smart guides for automatic alignment
            </li>
            <li class="text-[11px] text-muted-foreground">
              • Export at multiple resolutions for different use cases
            </li>
          </ul>
        </div>

        <!-- API & Extensions Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            API & Extensions
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Plugin System:</span>
              <span class="text-muted-foreground"> Extend functionality with custom plugins</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">REST API:</span>
              <span class="text-muted-foreground"> Programmatic access to core features</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">WebSocket Integration:</span>
              <span class="text-muted-foreground"> Real-time collaboration support</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Custom Tools:</span>
              <span class="text-muted-foreground"> Build specialized drawing tools</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Export Scripts:</span>
              <span class="text-muted-foreground"> Automate export workflows</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Theme Customization:</span>
              <span class="text-muted-foreground"> Create custom UI themes</span>
            </div>
          </div>
        </div>

        <!-- Community & Resources Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Community & Resources
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Documentation:</span>
              <span class="text-muted-foreground"> Comprehensive online documentation</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Tutorials:</span>
              <span class="text-muted-foreground"> Video tutorials and step-by-step guides</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Community Forum:</span>
              <span class="text-muted-foreground"> Get help from other users</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Plugin Marketplace:</span>
              <span class="text-muted-foreground"> Download community-created plugins</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Template Library:</span>
              <span class="text-muted-foreground"> Free and premium design templates</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">GitHub Repository:</span>
              <span class="text-muted-foreground"> Open source code and issue tracking</span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button 
          @click="isOpen = false"
          class="h-7 text-xs px-3"
          variant="outline"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.open ?? false)

watch(isOpen, (value) => {
  emit('update:open', value)
})

watch(() => props.open, (value) => {
  if (value !== undefined) {
    isOpen.value = value
  }
})
</script>

<style scoped>
:deep(.radix-dialog-overlay) {
  background-color: transparent !important;
}
</style>
