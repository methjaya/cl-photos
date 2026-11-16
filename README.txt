CL RANDOMS
==========
Open index.html in a browser. Keep the folders next to it.

  index.html        the page
  css/style.css     all styling (light theme)
  js/albums.js      the list of days and their photos (edit this to add a day)
  js/script.js      all behaviour (day tabs, gallery, viewer, rotate, slideshow)
  img/<day>/        full-size photos, one folder per day:  img/2026-11-16/p01.jpg ...
  thumb/<day>/      small versions of the same photos

DAYS
  16 Nov 2026  "Randoms"          17 photos   (shown first, tagged Latest)
  10 Nov 2026  "A Random Day @CL" 39 photos

DATE TAGS
  Every photo carries a small tag with the day it was taken (16 Nov / 10 Nov). The hero photo
  stack shows five random photos from both days (always at least two from the newest day), centered
  and evenly spaced; on phones it shows three.

VIEWER SHORTCUTS
  Left / Right    previous / next        Space   play or pause slideshow
  R               rotate right           Shift+R rotate left
  H               heart                  F       full screen        Esc  close
  R (viewer closed) random photo from any day
Hearts and rotations are remembered on the device that made them.

ADDING A NEW DAY
1. Make folders img/2026-11-20/ and thumb/2026-11-20/ and put photos in them as p01.jpg, p02.jpg ...
   (full size up to about 1800px on the long side, thumbnails about 700px). Full-size .jpeg files
   are also supported when specified in the album entry. Turn each photo the right way up first.
2. In js/albums.js add a new block at the TOP of the list (newest first):
   { "key": "2026-11-20", "short": "20 Nov", "date": "20 Nov 2026", "title": "Randoms",
     "photos": [ [1, 1800, 1200], [2, 1200, 1800] ] }
   Each photo row is [number, width, height] of its img file; add a fourth value "jpeg" when the
   full-size filename ends in .jpeg. Thumbnail filenames stay .jpg.
3. The first day in the list is shown first and gets the "Latest" tag.

NOTES ON THE PHOTOS
- 16 Nov photos are phone screen recordings (739 x 1600). They are kept at their original size,
  never enlarged. Solid black bars from the recording were trimmed off. The Snapchat screenshot (p17) was cut down to
  just the camera view, with the status bar, lens bar, menu and corner buttons removed.
- 10 Nov: p26, p27, p33, p34, p35, p39 were shot sideways and turned upright. On the first five the
  "A Random Day @CL" badge was redrawn at the bottom so it reads the right way round. p36 to p39
  have no badge.
