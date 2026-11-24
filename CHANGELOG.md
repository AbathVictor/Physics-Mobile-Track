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
- Up to 10 masses per video and centers of mass made of the masses the user chooses.
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
- Compare objects on the graph, as in Tracker's *Compare with*: besides the active object, the user picks other
  masses and centers of mass to plot on the same axes, each in its own color and named at the end of its curve.
- Position magnitude, velocity and acceleration (components and magnitudes) on the graph, computed as in Tracker:
  central differences for velocity and Tracker's 5-point least-squares stencil for acceleration, over the marking
  step. The graph picks a family (position, velocity, acceleration) and a component (x, y, magnitude).
- Table columns: the frame number (*n*) and t are always shown, plus up to 4 of the 9 quantities; the graph's
  quantity is always among them (*colunas ▾* button above the table).
- Choose what to export and copy, as in Tracker's export dialog: which objects and which quantities (t always goes,
  and cannot be removed). Column names follow Tracker (r, v_{x}, a_{y}…) and the units line lists every quantity.
  The default (all objects, x and y) gives the same CSV as before.
- Trail on the video as in Tracker: none, short (the last 5 steps before the current frame, the default) or
  full; while marking, the active mass shows only its current point.
- Tapping the number on the calibration stick (Scale tool) opens a field right there to type the real distance, as
  in Tracker.
- License files: AGPL-3.0-or-later for the code, CC BY-SA 4.0 for the documentation, and a NOTICE for third-party
  components; an SPDX license line in every source file; citation metadata (CITATION.cff).

### Changed

- The app moved from the `Tracker-mobile/` folder of
  [AbathVictor/Physics_artifacts](https://github.com/AbathVictor/Physics_artifacts) to this repository, with its
  full history (November 2026).
- The last remaining mass can now be deleted too (✕ in step 5); with no masses, marking waits until the user
  creates one with *+ massa*, and an empty object list is saved and restored as it is.
- The active mass can be deleted right from the object picker (*Excluir a massa A*, two taps, like the center of
  mass); in landscape, choosing a mass keeps the object drawer open to show it. A delete confirmation only applies
  to the object it was armed for.
- The object picker also takes the active mass's value, uncertainty and unit (the same fields as step 5), so a mass
  can be set right when it is chosen.
- In landscape, the first step is now called *Vídeo* (it was *Intervalo*), with a screen-and-play icon.
