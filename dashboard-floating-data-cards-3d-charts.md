# Dashboard — Floating Data Cards & 3D Charts

## Concept

Replace flat dashboard cards with **glassmorphic 3D cards** that float in a subtle 3D space with depth. Key metrics are displayed on rotating 3D chart objects.

---

## Components

### 3.1 Stat Cards (Profiling Results)

- Cards **tilt on hover** with a realistic perspective shift — maximum **12° rotation** on X/Y axes.
- Each card uses a **frosted-glass material** with refraction and a thin glowing border.
- Numbers animate with a **count-up effect** when the card enters the viewport.

---

### 3.2 3D Correlation Matrix

- Instead of a flat heatmap, correlations are rendered as a **3D terrain map**:
  - **Peaks** represent strong positive correlations.
  - **Valleys** represent negative correlations.
- Smooth color gradient across the terrain:
  - 🔵 **Blue** → negative correlation
  - ⚪ **White** → zero / no correlation
  - 🟠 **Orange** → positive correlation
- User can **orbit and zoom** the terrain with mouse or touch input.

---

### 3.3 Skewness Visualizer

- Each column's skewness is shown as a **3D histogram bar** with animated growth on load.
- Bars use a **metallic material** with environment map reflections.
- Hovering over a bar reveals the **exact skewness value** in a floating label.

---

### 3.4 ML Metrics Radar

- A **3D radar / spider chart** that rotates slowly and continuously.
- Vertices **glow brighter** for higher metric values.
- On model comparison, a **second translucent radar mesh** overlays the first for visual diffing.

---

## Tech Stack

| Tool | Role |
|------|------|
| **Spline** | Pre-designed glassmorphic card components |
| **Three.js** | Custom 3D charts — terrain map, histogram bars, radar chart |
