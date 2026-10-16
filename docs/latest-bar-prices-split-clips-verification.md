# Latest bar prices and split Instagram clips · 13.10.2026

Current standard Averages: beer €2.20, Aperol €4.00, all seven shots €1.00, soft drinks €2.00; wine and the four other mixed drinks €3.50. Water remains €0.00. Min ≈ 50 % and Max ≈ 250 % are derived on the 10-cent grid. Explicit preset values replace the earlier automatic +10 % uplift.

The actual local simulation was backed up and prepared anew with these values. Existing timing, volatility (38 %), global Average (0 %), view preferences and news texts were preserved. The preparation regenerates startup history and clears old evening state as required by the existing configuration flow.

Validation: typecheck/build and 267 tests passed across 51 files. Thirty-two distinct relevant browser cases passed, with corrected price fixtures rerun. Coverage includes admin fields, global sliders, guest chart targets, price distribution, all 38 manual specials, free water and the barteam price page. Both the concise price PNG and the original-vs-new comparison PNG were regenerated.

Two replacement Instagram clips:

- `exports/roncalli-instagram-1-news.mp4`: 31.2 s; native-speed news intro (9.2 s), announcement (4 s), newly rendered scrolling prices (12 s), full flyer (6 s).
- `exports/roncalli-instagram-2-crash.mp4`: 21.2 s; native-speed crash intro (15.2 s) then full flyer (6 s).

Both are portrait 1080×1920, 30 fps, H.264/YUV420P with stereo AAC/48 kHz and MP4 faststart. Original video is decoded directly rather than captured through browser seek/playback, eliminating captured loading states and preserving original timing. The brief video/audio duration difference is handled by holding the final video frame. Neither soundtrack uses tempo acceleration. Only gain/fades are applied. Full decode, representative-frame inspection, original-time audio correlation and an original-time video-frame comparison were checked.
