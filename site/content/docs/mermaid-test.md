---
title: "Mermaid Diagram Test"
weight: 5
summary: "Testing Mermaid diagram rendering functionality."
keywords: ["mermaid", "diagrams", "test"]
category: "testing"
---

# Mermaid Diagram Test

This document tests various Mermaid diagram types to ensure they render correctly.

## Flowchart

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Hugo
    participant Theme
    User->>Hugo: Build Site
    Hugo->>Theme: Apply Books Theme
    Theme->>Hugo: Rendered HTML
    Hugo->>User: Static Site
```

## Class Diagram

```mermaid
classDiagram
    class Document {
        +String title
        +String summary
        +String[] keywords
        +String category
        +render()
    }
    class Site {
        +Document[] documents
        +build()
        +serve()
    }
    Site --> Document : contains
```

If all three diagrams above render as interactive SVG graphics instead of code blocks, then Mermaid is working correctly!