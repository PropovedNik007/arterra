---
visibility: public
section: projects
cover: images/projects/flexam-toolpath-editor.webp
link: https://flexam.tech
featured: true
featured_order: 1
created: 2026-07-21
updated: 2026-11-22
tags:
  [
    3d-printing,
    multi-axis,
    3d-segmentation,
    toolpath-generation,
    computer-vision,
    full-stack,
    Go,
    Rust,
    Python,
    TypeScript,
    React,
    three.js,
    FastAPI,
    PostgreSQL,
    Docker
  ]
---

# Flexam

At Flexam, a Vienna company building software for industrial additive
manufacturing, I develop the path from a 3D model to a multi-axis, non-planar
toolpath: segmenting the part, generating the toolpaths, and building the web
tools engineers use to inspect and adapt the result.

Multi-axis printers and robot cells can build parts that a conventional
three-axis printer cannot, but only if the software decides how to split the
part and in which direction to deposit each layer. Flexam's products, the
Flexam Slicer and the Flexam Toolpath Editor, automate that planning for
processes such as directed energy deposition, continuous-fibre composites,
large-format printing, patient-specific medical devices, and concrete printing.

## What I work on

- **3D segmentation.** A geometry and machine-learning pipeline that splits a
  mesh into printable segments, proposes cutting planes and build orientations,
  and smooths the boundaries between segments. It decides how a part can be
  printed on a multi-axis machine.
- **Toolpath generation.** A slicing engine that turns a 3D model and machine
  settings into G-code and a 3D preview, including non-planar layers and
  multi-axis motion. The engine is written in Go, with performance-critical work
  in Rust.
- **Full-stack product.** The browser apps for slicing and toolpath editing
  (React, TypeScript and three.js), the Go service that runs slicing jobs, and
  the deployment and monitoring stack behind them.
- **AI-assisted tooling.** Language-model agents and tools that help build,
  inspect, and debug toolpaths.

## Contribution

I work across the stack: the segmentation pipeline, the slicing and toolpath
engine, the backend services, and the web interfaces.

## Stack

Go, Rust, Python, TypeScript, JavaScript, React, three.js, FastAPI, trimesh,
NumPy, scikit-learn, PostgreSQL, Docker

## Links

- Live: https://flexam.tech
