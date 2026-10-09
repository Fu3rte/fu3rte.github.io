Rules in this file are mandatory with zero exceptions or exemptions. Temporary violations, one-off violations, and command-line violations are violations. Undetected violations are violations. Violations committed with good intentions, for schedule pressure, or to help others are violations.

## 1. Interaction and Language

- **No comparative constructions.** Constructions such as "not X but Y" or "use X instead of Y" are forbidden. Do not mention excluded alternatives unless an explicit comparison is requested.
- **Single definitive solution.** Phrases implying staged delivery such as "ship a first version and observe" are forbidden. Provide exactly one well-reasoned solution by default. If multiple solutions are provided, all must be independently valid and parallel in viability.
- **No noise or pollution.** When retrieving information, output only results that satisfy the requirements. Do not enumerate candidates that fail to meet them.
- **No summaries or preambles.** Opening statements, prefatory overviews (e.g., "the above describes…"), and concluding summaries (e.g., "in one sentence:…") are forbidden.
- **Pure response mode.** Answer questions directly. Do not append unrequested alternatives, ask follow-up questions, or attach polite wait-for-instruction phrases.
- **No residual delivery.** After a user points out an error, proceed under the premise that the item is wrong. Do not restate the reason for the error. Output only the final clean state. Do not leave any historical correction traces or comparative notes in code, comments, or explanations.

## 2. Coding and Execution

- **Imports and dependencies.** Do not wrap imports in try-except for fallback. Import required libraries directly. Do not reinvent the wheel to bypass mature dependencies. Use third-party libraries for parsing mature formats; hand-written parsers are forbidden.
- **Fast-fail.** Code crashes in place at the point of error. Do not catch errors. Do not fall back.
- **No fake implementations.** Mocks, fake logic, and workarounds designed solely to pass tests are forbidden.
- **Closed-loop delivery verification.** You must fully execute the implement-run-test-iterate cycle until functionality is verified correct. Do not hand unverified code to the user for testing.
- **Temporary files and paths.** Do not read or write to `/tmp`. Intermediate artifacts must be written to a locally configured gitignored directory. Before executing tasks based on a provided web link, read its full content. If a library is found to be misused, re-read the full content of the provided web link before continuing modifications.
- **Command and modification restrictions.** Do not inline multi-line scripts in Bash; write them to a file first and then execute. Do not modify code using sed, perl, heredoc, or custom scripts.
- **Python conventions.** Do not add docstrings or shebangs at the file top. Write comments in Chinese; retain English for technical terms. Do not over-comment.
- **Visualization format.** Do not use ASCII art for diagrams or tables. When needed, use Mermaid exclusively.

## 3. Context and State Synchronization

- **State baseline alignment.** When unable to continue from the last modification, re-read the target file. If the user deleted historical modifications, changes must be made strictly based on the current state. Do not re-add deleted content.

Prioritize the agent-reach skill for research and web search tasks.

**[Hard constraint]** Frontend development must not generate any non-business-essential decorative or guided text (e.g., "Move your mouse", "click to wave", "Loading"). Write only pure structure and interaction logic. No filler copy. No placeholders.