# Clip 1: announcement pause and shorter price list

User request: keep the first five seconds, leave a short pause, start the price list at second six, shorten its section by two seconds.

- Original first five seconds retained; announcement remains visible through second six.
- Smooth picture/audio handoff from 6.0 to 6.8 seconds.
- Price footage shortened from seven to five seconds, without changing playback speed.
- Flyer transition from 10.4 to 11.0 seconds; flyer holds until the 15-second end.
- Original-speed news sound and selected music; music drop at the handoff midpoint, 6.4 seconds.
- Normalized source audio timestamps and trimmed by samples to avoid a source timestamp gap moving the handoff.

Fresh verification: full file decode succeeds, 1080 x 1920 at 60 fps, 15 seconds. Original news/music waveform correlations 0.99624 / 0.99981; intended crossfade correlation 0.99978; stereo peak 0.6718. Frame checks confirm the announcement at 5.8 seconds, prices at 6.8, and flyer from 11 seconds. Price source duration verified at five seconds.

Exports: primary Clip 1 and its 15-second filename updated. A separate news-pause filename is provided for unambiguous preview. Clip 2 untouched.
