# Changelog

All notable changes to Videoanálise Móvel are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). From version 1.0.0 on, versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

There are no releases yet. Version 1.0.0 will be the first one, archived on Zenodo with a DOI.

### Added (development until November 2026)

- Frame-by-frame video analysis on Android phones: analysis interval, scale with a magnifier, axes, masses with
  uncertainties, and marking by hand with pinch zoom.
- Automatic tracking: template matching in two levels with subpixel fit, an evolving template anchored to the
  original, and position prediction.
- Up to 10 masses per video and centers of mass made of the masses the student chooses.
- Graph and table kept in sync with playback; CSV export in Tracker's format (Excel and international), with
  masses, units and calibration lines.
- Time as in Tracker: the same Δt for every frame over the analysis interval.
- Landscape layout with full screen and a movable graph window; light and dark themes; menu drawer (≡) with device
  diagnostics and help.
- Offline use (service worker) and installation as an app that opens in landscape.
- Decoding designed for phones: the file is read in large blocks, frames show as soon as they are decoded,
  keyframe previews follow the finger on the frame bar, playback shows every frame at no more than real time,
  and memory stays within limits.
- *Sobre* (About) screen with the author, the license, a link to the source code, credits and third-party
  notices.
- License files: AGPL-3.0-or-later for the code, CC BY-SA 4.0 for the documentation, and a NOTICE for third-party
  components; an SPDX license line in every source file; citation metadata (CITATION.cff).

### Changed

- The app moved from the `Tracker-mobile/` folder of
  [AbathVictor/Physics_artifacts](https://github.com/AbathVictor/Physics_artifacts) to this repository, with its
  full history (November 2026).
