---
name: edit-article
description: Edit and improve articles by restructuring sections, improving clarity, and tightening prose. Use when user wants to edit, revise, or improve an article draft.
disable-model-invocation: true
---

1. First, divide the article into sections based on its headings. Think about the main points you want to make during those sections.

Consider that information is a directed acyclic graph, and that pieces of information can depend on other pieces of information. Make sure that the order of the sections and their contents respects these dependencies.

Confirm the sections with the user.

2. For each section:

2a. Rewrite the section to improve clarity, coherence, and flow. Use maximum 240 characters per paragraph.

2b. Edit the rewrite in place, preserving the section's meaning and its position in the dependency order fixed in step 1. Don't reorder or drop information a later section depends on.

3. Read the whole article end-to-end. Check that the sections still flow, that no concept is leaned on before an earlier section grounds it, and that nothing important was lost in the rewrite. Fix anything that reads wrong, then hand the result back to the user.
