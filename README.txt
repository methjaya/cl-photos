CL RANDOMS
==========
Open index.html in a browser. Keep the folders next to it:

  index.html      the page
  css/style.css   all styling (light theme)
  js/script.js    all behaviour (gallery, viewer, rotate, slideshow)
  img/            full-size photos   p01.jpg ... p39.jpg  (already turned upright)
  thumb/          small versions of the same photos
  photos.json     list of photos with their sizes (for reference)

VIEWER SHORTCUTS
  Left / Right    previous / next        Space   play or pause slideshow
  R               rotate right           Shift+R rotate left
  H               heart                  F       full screen        Esc  close
  R (page closed) random photo
Rotations and hearts are remembered on the device that made them.

ADDING PHOTOS
1. Save the full photo as img/p40.jpg (about 1800px on the long side) and a ~700px copy as thumb/p40.jpg.
2. Make sure it is the right way up (turn it in any image editor first).
3. Add a row to the PHOTOS list at the top of js/script.js:  [40, width, height]
   e.g. [40, 1800, 1200] for a landscape photo or [40, 1200, 1800] for a portrait one.

NOTE ON SIX PHOTOS
p26, p27, p33, p34, p35, p39 were shot sideways and were turned upright. On the first five the
"A Random Day @CL" badge was redrawn at the bottom so it reads the right way round. p36 to p39 have no badge.
