## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Performance & Architecture Guidelines 
* While planning tasks, always scan for low-effort performance wins like memoization, unnecessary polling, or redundant renders.
* If a component touches data or renders frequently, ask:
    * Can this be wrapped with React.memo or useMemo?
    * Is state managed too globally or mixed between UI and data?
* If writing a FlatList, apply performance props (getItemLayout, initialNumToRender, etc.).
* Avoid mixing business logic in UI components—move to hooks or services when logic exceeds 30 lines or crosses concerns.
* When triggering data fetches, prefer smart refresh logic and deduplication over repeated or blind polling.
* Batch or debounce any expensive calls or state updates, especially in useEffect, search handlers, or initialization logic.
* Keep data transformations and rendering logic separate and memoized—never run heavy transforms in render paths.

## Security Hygiene
* Always check .env files are gitignored and never committed. Rotate any exposed secrets.
* Never log sensitive data. Replace console.log with a sanitized logger in development only.
* If handling user inputs (e.g. deposit/withdraw amounts), validate thoroughly—no negatives, enforce max values, and control precision.
* Treat all external data as untrusted. Validate structure and type before use.
* Debounce or rate-limit RPC calls and actions that interact with wallets or the network.
* Before adding WebView or similar features, review security settings carefully—disable JS if not needed.
* Avoid using global debug or keystore files in the repo. Check .gitignore coverage.
* After implementation, clean up unused env vars, dead code, and test artifacts.
