Based on my research, here's a comprehensive breakdown of open-source options for in-browser editing documentation sites:

---

# **In-Browser Editing Documentation Solutions**

## **Category 1: Wiki-Like Solutions (Instant Browser Editing)**

These are true wikis with WYSIWYG or simple markup editors directly in the browser.

### **Top Open-Source Wiki Options:**

---

### **1. BookStack** ⭐ (Recommended for ease of use)

**What it is:** Modern, Laravel-based wiki with a book metaphor (Shelves → Books → Chapters → Pages)

**Pros:**
- ✅ **Beautiful, modern interface** - Most polished UI among open-source wikis
- ✅ **Easy to use** - WYSIWYG editor (TinyMCE) with no learning curve
- ✅ **Simple installation** - PHP/Laravel, straightforward setup
- ✅ **Excellent permissions** - Granular role-based access control
- ✅ **Good documentation structure** - Intuitive hierarchy
- ✅ **Markdown support** - Optional Markdown editor with live preview
- ✅ **Export options** - PDF, HTML, plain text, Markdown
- ✅ **Authentication** - LDAP, SAML2, OpenID Connect, OAuth
- ✅ **MFA support** - Can be enforced per role
- ✅ **Draw.io integration** - Built-in diagram editor
- ✅ **Active development** - Well-maintained with growing community
- ✅ **Audit logs** - Track all changes

**Cons:**
- ❌ **Opinionated structure** - Book/Chapter/Page hierarchy can feel limiting
- ❌ **No real-time collaboration** - Can't edit simultaneously with others
- ❌ **Limited customization** - Visual theme options are basic
- ❌ **No inline comments** - Missing modern collaboration features
- ❌ **Performance at scale** - May slow with very large instances
- ❌ **Requires PHP/MySQL** - Not as lightweight as flat-file solutions

**Best for:** Teams wanting a beautiful, easy-to-use wiki without complexity; great for technical documentation, SOPs, and knowledge bases

**Tech stack:** PHP, Laravel, MySQL/MariaDB

---

### **2. Wiki.js** ⭐ (Recommended for developers)

**What it is:** Modern, Node.js-based wiki with Git sync and multiple editor options

**Pros:**
- ✅ **Multiple editors** - Markdown, WYSIWYG, HTML, WikiText, API docs editor
- ✅ **Git integration** - Auto-sync with GitHub, GitLab, etc.
- ✅ **Modern interface** - Clean, beautiful UI with light/dark mode
- ✅ **Built-in search** - Good search engine out of the box
- ✅ **Authentication** - LDAP, SAML, OAuth, many social providers
- ✅ **Fast performance** - Node.js is speedy
- ✅ **Flexible storage** - PostgreSQL, MySQL, MariaDB, MS SQL, SQLite
- ✅ **Developer-friendly** - Appeals to technical teams
- ✅ **Good documentation** - Well-documented project

**Cons:**
- ❌ **No native WYSIWYG** - Visual editor exists but less polished than BookStack
- ❌ **Requires Node.js** - Different tech stack than typical LAMP setups
- ❌ **Less intuitive** - Steeper learning curve than BookStack
- ❌ **Smaller community** - Newer project, fewer resources
- ❌ **Limited templates** - Not as much structure guidance
- ❌ **Permission complexity** - Can be tricky to configure

**Best for:** Developer teams who want Git integration and Markdown-first workflow; teams comfortable with Node.js

**Tech stack:** Node.js, Vue.js, Database (multiple options)

---

### **3. DokuWiki**

**What it is:** Lightweight, no-database wiki using flat files

**Pros:**
- ✅ **No database required** - Stores everything as text files
- ✅ **Easy backup** - Just copy files
- ✅ **Simple installation** - Drop it on PHP server and go
- ✅ **Large plugin ecosystem** - 1500+ plugins
- ✅ **Access control** - Built-in ACLs
- ✅ **Clean syntax** - Easy markup language
- ✅ **Mature project** - Been around since 2004

**Cons:**
- ❌ **No WYSIWYG by default** - Requires plugin for visual editing
- ❌ **Dated interface** - Looks old-fashioned
- ❌ **Not scalable for high traffic** - Flat files have limits
- ❌ **Plugin dependency** - Need plugins for basic features (categories, rich text)
- ❌ **Less modern** - Feels legacy compared to BookStack/Wiki.js

**Best for:** Small teams, personal wikis, simple documentation needs; teams who want easy backups and no database

**Tech stack:** PHP (no database)

---

### **4. MediaWiki**

**What it is:** The software that runs Wikipedia - extremely powerful but complex

**Pros:**
- ✅ **Battle-tested** - Powers Wikipedia and thousands of wikis
- ✅ **Highly scalable** - Handles massive content and traffic
- ✅ **Extensive features** - Everything you could want
- ✅ **Large ecosystem** - Thousands of extensions
- ✅ **Semantic capabilities** - Can add structured data (Semantic MediaWiki)
- ✅ **Strong version control** - Excellent revision history
- ✅ **BlueSpice version** - Enterprise features available

**Cons:**
- ❌ **Steep learning curve** - Very complex for non-technical users
- ❌ **Dated interface** - Feels old unless customized
- ❌ **Complex setup** - Requires significant configuration
- ❌ **Extension management** - Need to install many extensions for basic features
- ❌ **Not beginner-friendly** - Overwhelming for most teams
- ❌ **Maintenance overhead** - Requires technical expertise

**Best for:** Large organizations with technical teams; projects needing Wikipedia-level features and scale

**Tech stack:** PHP, MySQL

---

### **5. XWiki**

**What it is:** Enterprise-grade wiki platform with application development capabilities

**Pros:**
- ✅ **Very powerful** - Can build custom applications
- ✅ **Strong WYSIWYG** - Good visual editor
- ✅ **Extensible** - 750+ extensions
- ✅ **Structured data** - Database-like capabilities within wiki
- ✅ **Enterprise features** - Advanced workflows, permissions
- ✅ **Office integration** - Import from Word, Excel

**Cons:**
- ❌ **Complex** - Steep learning curve
- ❌ **Heavy** - Resource-intensive (Java-based)
- ❌ **Overwhelming** - Too many features for simple needs
- ❌ **Smaller user base** - Less community support
- ❌ **Setup complexity** - Requires Java expertise

**Best for:** Large enterprises needing custom applications and workflows; teams with Java expertise

**Tech stack:** Java, Database

---

### **Quick Comparison Table: Wiki Solutions**

| Feature | BookStack | Wiki.js | DokuWiki | MediaWiki | XWiki |
|---------|-----------|---------|----------|-----------|--------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Modern UI** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **WYSIWYG Editor** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ (plugin) | ⭐⭐ (ext) | ⭐⭐⭐⭐ |
| **Setup Simplicity** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Customization** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best For** | Small-medium teams | Developers | Simple needs | Large scale | Enterprise |

---

## **Category 2: Other Open-Source Documentation Solutions**

These are NOT traditional wikis but support browser-based editing:

### **Static Site Generators (Minimal In-Browser Editing)**

**Docusaurus, MkDocs, Jekyll, Hugo**
- ❌ No real in-browser editing - edit locally, push to Git
- ✅ Great for versioned documentation
- ✅ Fast, secure static sites
- ❌ Not wiki-like; requires Git workflow

### **CMS-Based Solutions**

**GitBook (self-hosted)**
- ✅ Beautiful interface
- ✅ Git integration
- ❌ Newer versions are SaaS-only
- ❌ Open-source version is outdated

**Outline**
- ✅ Modern, Notion-like interface
- ✅ Real-time collaboration
- ✅ Slack integration
- ⚠️ More complex to self-host
- ✅ Open-source alternative worth exploring

---

## **My Recommendations**

**For most teams:** Start with **BookStack** - it's the sweet spot of ease-of-use, modern interface, and features.

**For developer teams:** Try **Wiki.js** - especially if you want Git sync and Markdown-first workflow.

**For simplicity:** Use **DokuWiki** - if you want no database and easy maintenance.

**For scale:** Consider **MediaWiki** - but only if you have technical resources.

**For enterprise:** Evaluate **XWiki** - if you need custom applications.

All of these support true in-browser editing (no Git workflow required), which seems to be your primary requirement. BookStack and Wiki.js offer the best modern experience with instant editing.
