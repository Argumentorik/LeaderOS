Quellbilder für build_assets.py: Einzelbilder aus dem echten Intro-Video
frontend/public/videos/wlad-intro.mp4 (2560×1440, 25 fps), ausgeschnitten auf
x 850–1850, y 0–1300 des Frames. Dateiname = Sekunde im Video.

  ffmpeg -ss <Sekunde> -i frontend/public/videos/wlad-intro.mp4 -frames:v 1 frame.png

Die Koordinaten in build_assets.py (SLIDES) beziehen sich auf den vollen Frame;
der Versatz des Ausschnitts (CROP_X0, CROP_Y0) wird dort abgezogen.
Nur echte Aufnahmen, keine erzeugten Gesichter.
