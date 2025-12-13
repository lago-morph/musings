Excellent question! This is a critical consideration for enterprise adoption. Let me give you a comprehensive answer about PlantUML's export and embedding capabilities.

## PlantUML Export & Embedding Options

### **Direct Native Integrations** ✅

#### **Confluence**
Multiple PlantUML plugins exist for Confluence that allow embedding UML diagrams directly in wiki pages using PlantUML syntax. You can:
- Embed PlantUML code directly in Confluence pages using macros
- Diagrams render automatically when viewing the page
- Multiple vendors offer plugins (some free, some paid ~$0.50/user/month)

**Important note:** Some plugins support referencing PlantUML code from BitBucket/GitHub repositories using `!include` with direct URLs, keeping diagrams synchronized with your codebase.

#### **Jira**
PlantUML plugins are also available for Jira, though integration is less mature than Confluence.

#### **Draw.io (Diagrams.net)**
**CRITICAL UPDATE:** PlantUML support in draw.io is being phased out - it will be removed at the end of 2025 in the online version and in 2028 in Confluence/Jira Cloud apps. This is due to security review challenges.

---

### **Export Format Support** 🎨

PlantUML natively exports to multiple formats perfect for documentation:

| Format | Quality | Use Case |
|--------|---------|----------|
| **SVG** | Vector (scalable) | Best for wikis, web docs, presentations |
| **PNG** | Raster/bitmap | Simple embedding, but large files |
| **PDF** | Vector (with setup) | Formal documents, printing |
| **EPS** | Vector | LaTeX documents |
| **ASCII art** | Text | Plain text documentation |

**Recommendation:** SVG is the recommended export format as it retains vector graphics with no loss of detail and remains highly editable.

---

### **Conversion Tools** 🔄

#### **PlantUML → Mermaid**
Several tools exist for conversion:
- **pu2mm**: Open-source tool that converts simple PlantUML sequence diagrams to Mermaid
- **Browser extensions**: Chrome extensions available for sequence and class diagrams
- **Manual conversion**: Syntax is similar enough for manual rewrites

**Why Mermaid matters:** Mermaid is widely supported in:
- GitHub/GitLab (native rendering in README.md)
- Confluence (via plugins)
- Notion
- Many wiki systems

#### **PlantUML → Draw.io**
Third-party tools like `plantuml2drawio` and `plantuml_to_drawio` are available on GitHub for conversion:
- **plantuml2drawio**: Converts PlantUML to Draw.io format element by element, currently supporting activity diagrams
- **Catalyst**: JavaScript library specifically for converting C4 diagrams from PlantUML to draw.io format

**Process:**
1. Export PlantUML as SVG
2. Import SVG into draw.io (can edit further)
3. OR use conversion tools to create native draw.io XML

---

### **Best Practices for Enterprise Documentation** 💼

#### **Strategy 1: Native Image Embedding** (Recommended)
```
1. Generate SVG from PlantUML
2. Commit SVG to version control alongside .puml source
3. Embed SVG images in Confluence/Jira/wikis
4. CI/CD pipeline regenerates SVGs on .puml changes
```

**Pros:** 
- Works everywhere (universal image support)
- Version controlled
- Automated updates possible

#### **Strategy 2: Direct Plugin Integration**
```
1. Install PlantUML plugin in Confluence
2. Embed PlantUML code directly in pages
3. Diagrams render on page load
```

**Pros:**
- Single source of truth (the code)
- Easier to update
- No build process needed

**Cons:**
- Plugin dependency
- May not work in all contexts (email exports, PDFs)

#### **Strategy 3: Hybrid Approach**
```
1. Store master models as PlantUML in Git
2. Generate both SVG and Mermaid versions
3. Use Mermaid for GitHub/modern wikis
4. Use SVG for Confluence and formal docs
```

---

### **Real-World Workflow Example** 🔨

For **maximum compatibility** across tools:

```plaintext
Source Control (Git)
├── models/
│   ├── domain-model.puml        # Master PlantUML source
│   ├── view-orders.puml          # View: Order subsystem
│   └── view-inventory.puml       # View: Inventory subsystem
├── exports/
│   ├── svg/                      # For Confluence, docs
│   ├── mermaid/                  # For GitHub, modern wikis
│   └── png/                      # Fallback compatibility
└── .github/workflows/
    └── generate-diagrams.yml     # Auto-regenerate on commit
```

**CI/CD pipeline:**
1. Detects changes to `.puml` files
2. Generates SVG, PNG, and Mermaid versions
3. Commits exports back to repo
4. Updates documentation automatically

---

### **Format Comparison for Your Use Case**

| Tool/Platform | Native PlantUML | SVG Import | PNG Import | Mermaid | Best Approach |
|---------------|----------------|------------|------------|---------|---------------|
| **Confluence** | ✅ Via plugin | ✅ | ✅ | ✅ Via plugin | Plugin or SVG |
| **Jira** | ⚠️ Limited | ✅ | ✅ | ⚠️ Limited | SVG attachment |
| **GitHub/GitLab** | ❌ | ✅ | ✅ | ✅ Native | Mermaid preferred |
| **SharePoint** | ❌ | ✅ | ✅ | ❌ | SVG/PNG embed |
| **Draw.io** | ⚠️ Until 2025 | ✅ | ✅ | ✅ | Import SVG |
| **MediaWiki** | ✅ Via extension | ✅ | ✅ | ✅ Via extension | Extension or SVG |
| **Notion** | ❌ | ✅ | ✅ | ✅ Via embed | Mermaid or image |

---

### **My Recommendation** 🎯

For an enterprise environment with Confluence, Jira, and various wikis:

1. **Primary format:** Keep PlantUML as your source of truth
2. **Build pipeline:** Auto-generate SVG for every diagram
3. **Confluence integration:** Use PlantUML plugin for living documentation
4. **Static docs:** Embed SVG images
5. **GitHub/modern platforms:** Maintain parallel Mermaid versions for key diagrams
6. **Formal documents:** Export to PDF via SVG

This gives you:
- ✅ Text-based, version-controlled source
- ✅ Wide compatibility via SVG
- ✅ Living documentation in Confluence
- ✅ Modern platform support via Mermaid
- ✅ No vendor lock-in

**Would you like me to:**
1. Show example CI/CD pipeline configurations for auto-generating exports?
2. Dive deeper into specific Confluence/Jira plugin options?
3. Explore the Mermaid conversion workflow in more detail?
4. Compare this approach with Structurizr's embedding capabilities?
