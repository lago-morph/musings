---
title: "Recommendations"
summary: "I'll help you research tools for documenting domain object models in UML with your specific requirements. Let me search for current options that meet your criteria. Let me search for more specific information about diagram-as-code tools and their capabilities for selective view rendering."
keywords:
  - "mermaid"
  - "json"
  - "documentation"
  - "deployment"
  - "container"
  - "diagrams"
  - "recommendations"
  - "domainmodel"
category: "devplatform"
categoryName: "Development Platforms"
weight: 2
date: "2025-12-16"
draft: false
toc: true
---

I'll help you research tools for documenting domain object models in UML with your specific requirements. Let me search for current options that meet your criteria.Let me search for more specific information about diagram-as-code tools and their capabilities for selective view rendering.Now let me search for more information about how these tools handle multiple views and vector/bitmap export capabilities.Perfect! Now I have enough information to provide a comprehensive overview. Let me compile this for you.

## Overview of Text-Based UML Domain Modeling Tools

Based on my research, I've identified several excellent tools that meet at least 3 of your 4 requirements. Here's a strategic overview organized by capability:

---

### **Top Recommendations**

#### **1. PlantUML** ⭐ *Most Mature*
**Meets all 4 requirements:**
- ✅ **Text-based**: Plain text `.puml` files with simple, human-readable syntax
- ✅ **Multiple diagram views**: Can create multiple separate diagram files that reference common model elements
- ✅ **Open source**: GPL/Apache/MIT licenses
- ✅ **High-quality exports**: PNG, SVG, PDF, EPS, LaTeX

PlantUML uses simple textual descriptions to create UML diagrams and can export to PNG, SVG, LaTeX, and EPS formats. The tool is highly versatile and supports class, sequence, component, deployment, and many other diagram types.

**Strengths:**
- Extremely mature with large community
- Excellent export quality, especially SVG for vector graphics
- Can include/reference common definitions across multiple diagram files
- IDE integrations (VSCode, Eclipse, IntelliJ)

**Limitation for your use case:**
- Each diagram is typically a separate text file rather than one unified model file, though you can use `!include` to reference shared definitions

---

#### **2. Structurizr DSL** ⭐ *Best for Multiple Views from Single Model*
**Meets all 4 requirements:**
- ✅ **Text-based**: DSL (Domain Specific Language) in text format
- ✅ **Multiple diagram views**: THIS IS ITS STRENGTH - define model once, create multiple views
- ✅ **Open source**: Apache License
- ✅ **Exports**: Can export to PlantUML, Mermaid, and then to vector/bitmap formats

The Structurizr DSL is model-based, making it possible to generate multiple diagrams at different levels of abstraction from a single DSL file. The Structurizr CLI can export views to PlantUML, Mermaid, WebSequenceDiagrams, and Ilograph formats.

**Strengths:**
- **Perfect match for your "multiple views" requirement** - you define the model once, then create different views showing selected elements
- Designed specifically for the C4 model (Context, Container, Component, Code)
- Model is truly separated from views
- Can export to other formats for rendering

**Consideration:**
- Primarily focused on C4/architecture diagrams rather than detailed UML class modeling
- Requires Structurizr Lite or CLI for rendering

---

#### **3. StarUML** 
**Meets 3 of 4 requirements:**
- ✅ **Text-based**: Models stored in JSON format
- ✅ **Open source**: Originally open source, now has paid version (some features MIT licensed)
- ✅ **High-quality exports**: PDF, SVG, PNG exports

StarUML stores modeling data in a very simple JSON format, making it easy to generate custom code via CLI.

**Strengths:**
- Clean JSON format that's readable and version-controllable
- Good UI for visual editing when needed
- Supports many diagram types

**Limitation:**
- Less clear how to create selective views of the same model programmatically
- Licensing has changed over time (verify current status)

---

### **Other Notable Options**

#### **Mermaid** (3 of 4)
- ✅ Text-based (simple syntax)
- ✅ Open source
- ✅ Exports to SVG/PNG
- ⚠️ Multiple views: Limited - each diagram is separate

Mermaid has experimental C4 diagram support with syntax compatible with PlantUML. Great for embedding in documentation but less suited for complex domain modeling with multiple views.

---

### **Comparison Matrix**

| Tool | Text Format | Multiple Views from Model | Open Source | Vector Export | Best For |
|------|-------------|--------------------------|-------------|---------------|----------|
| **PlantUML** | Plain text (.puml) | Via !include | ✅ GPL/Apache | ✅ SVG, EPS | Detailed UML diagrams |
| **Structurizr** | DSL | ✅ **Native support** | ✅ Apache | Via export chain | Architecture/C4 models |
| **StarUML** | JSON | Partial | ⚠️ Mixed | ✅ SVG, PDF | UI-first modeling |
| **Mermaid** | Simple text | Limited | ✅ MIT | ✅ SVG | Documentation embedding |

---

### **My Recommendation Based on Your Needs**

For **pure UML domain modeling** with multiple views: **PlantUML** with a structured approach:
- Create a "model" folder with common class definitions using `!include`
- Create separate diagram files for different views that include/reference the model

For **architecture/system modeling** where you want true "model once, view many": **Structurizr DSL** is superior, though it's more C4-focused than traditional UML.

**Which approach interests you more?** I can dive deeper into:
1. How to structure PlantUML for domain modeling with shared definitions
2. How Structurizr's view mechanism works
3. Detailed export workflows for high-quality outputs
4. Comparison with other tools I found (Modelio, Eclipse Papyrus, etc.)
