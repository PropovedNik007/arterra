---
visibility: public
section: projects
cover: images/projects/flexam-slicer.webp
gallery: [{src: images/projects/flexam-multi-axis-render.webp, alt: "Multi-axis, non-planar toolpath preview of a fan-shaped part", caption: "Non-planar toolpath preview for a multi-axis machine."}, {src: images/projects/flexam-toolpath-points.webp, alt: "Plot of generated toolpath points around curved segments of a part", caption: "Generated toolpath points along curved segment boundaries."}, {src: images/projects/flexam-multi-axis-print.webp, alt: "A multi-axis 3D printer depositing a part on a tilting, rotating bed", caption: "A part printing on a multi-axis machine with a tilting bed."}]
link: https://flexam.tech
featured: true
featured_order: 1
created: 2026-07-21
updated: 2026-11-22
tags: [3d-printing, additive-manufacturing, multi-axis, robotics, robot-arms, 3d-segmentation, mesh-processing, computational-geometry, slicing, toolpath-generation, g-code, computer-vision, full-stack, Go, Rust, Python, TypeScript, React, three.js, FastAPI, trimesh, PostgreSQL, Docker]
---

# Flexam

At Flexam, a Vienna company building software for industrial additive
manufacturing, I develop the path from a 3D model to a robot-ready, multi-axis
toolpath: segmenting the part, slicing it, generating toolpaths and G-code, and
building the web tools engineers use to inspect and adapt the result.

Multi-axis printers and robot arms can build parts that a conventional
three-axis printer cannot, but only if the software decides how to split the
part and in which direction to deposit each layer. Flexam's products, the
Flexam Slicer and the Flexam Toolpath Editor, automate that planning for
processes such as directed energy deposition, continuous-fibre composites,
large-format printing, patient-specific medical devices, and concrete printing.

## What I work on

- **3D segmentation.** A geometry and machine-learning pipeline that splits a
  mesh into printable regions, analyses each region, proposes cutting planes and
  build orientations, and smooths the boundaries between regions. It decides
  how a part can be printed on a multi-axis machine.
- **Slicing and toolpath generation.** A slicing engine that turns a 3D model
  and machine settings into layers, toolpaths, and G-code, including non-planar
  layers and multi-axis motion. The engine is written in Go, with
  performance-critical work in Rust.
- **Robotics.** Toolpaths for industrial robot arms and multi-axis machines:
  tool orientation along the path, motion limits of the machine, and
  post-processing of the generated program for the robot cell.
- **Full-stack product.** The browser apps for slicing and toolpath editing
  (React, TypeScript, and three.js), the Go service that runs slicing jobs, and
  the deployment and monitoring stack behind them.
- **AI-assisted tooling.** Language-model agents and tools that help build,
  inspect, and debug toolpaths.

## Contribution

I work across the stack: the segmentation pipeline, the slicing and toolpath
engine, robot-ready output, the backend services, and the web interfaces.

## Stack

Go, Rust, Python, TypeScript, JavaScript, React, three.js, FastAPI, trimesh,
NumPy, scikit-learn, PostgreSQL, Docker

## Links

- Live: https://flexam.tech
