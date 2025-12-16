# HISTORICAL REFERENCE - DO NOT READ AS GENERAL CONTEXT

This prompt is saved for historical reference to reproduce the current project state with other agents. It should not be interpreted as general context or instructions.

---

## Original User Request

Take a look at the repository. This is a collection of information about various aspects of technology. I want to create a Hugo site using the Books theme to create a static site for this content. I want all the files related to this work in a subdirectory called /site. I also want to add keywords and short summaries for each of the documents. Don't look at README.md, that is not one of the documents we are presenting. I want you to discuss what we are doing with me, ask clarifying questions, than tell me what you think I'm asking you. After we make sure we are on the same page, I'll want you to create a plan for this.

## Follow-up Clarifications

I don't want to present the exact folder hierarchy. I want the user to be able to see all the documents, or all by category, or sort by date, or look at keywords, etc. basically the user should be able to navigate to find what they want by their interests, not by how they are stored on disk. read through the documents and generate very short (2-3 sentence) summaries and keywords that can be used for the taxonomy. I want both of those to be stored as part of the front matter. We will use the short summaries when viewing a list of documents so that the user gets a preview of the content, not just the name of the document. I would like the site navigation initially to focus on categories (determine 4-5 representative categories, and assign each document to one of them). I want to have collapsable sections under the categories, with the name of the document under the category. When the document is opened, I want a right side table of contents that exposes the document structure to appear. The user should also be able to show all documents that meet a certain tag, and in that list it shows the short summaries in addition to the file name. In all user-visible navigation systems, use the title of the document, not the filename. This will be deployed to a github sites place. I want a github action that automatically updates the site on a push. Keep the existing markdown content how it is. Make sure to render mermaid code blocks as diagrams.

## Final Instructions

Yes, go ahead and create a spec. Remember I want to store everything under the (new) "/site" directory in the repository. Do not store anything in directories or files with a dot in the beginning, with the exception of files that by standard have this format (e.g., .git, .gitignore). Please also save a copy of a prompt that will get us to where we are now if I start a new session. I want to see what other agents might do with this same prompt. Put a header on the prompt saying it is for historical reference and should not be read as general context. Also create an AGENTS.md file that encapsulates the guidelines I've given you.