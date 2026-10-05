# M2 Checklist: Typed and Tested

## 1. Shared contract (`@utpost/shared`)
- [x] Create `shared/` as an npm workspace named `@utpost/shared`
- [ ] Add types `Guide`, `Tour`, `TourLog`, `User`, `ApiError`
- [ ] Use snake_case field names exactly as the API responds
- [ ] Check `api/src/db/schema.js` to decide which fields can be `null`
- [ ] No `any` and no `!` to silence the compiler

## 2. Client in TypeScript
- [ ] Install `typescript@~6.0.0` (not `@latest`)
- [ ] Make `api.ts` generic
- [ ] Convert all ported views and components to `lang="ts"` with types from `@utpost/shared`
- [ ] Make sure no already-ported view is left as JS (`allowJs` may stay on)
- [ ] Write all new views in TS

## 3. API in TypeScript (started)
- [ ] Add `tsconfig.json` with `erasableSyntaxOnly` (and `verbatimModuleSyntax`)
- [ ] Type `routes/guides.ts` as `Response<Guide[]>`
- [ ] Use `import type { Guide }` for type imports
- [ ] End local imports with `.ts`
- [ ] Avoid `enum`
- [ ] Confirm `npm run dev:api` starts on Node 22.18+

## 4. Typecheck
- [ ] Add `npm run typecheck` in the root (`vue-tsc` in `client/`, `tsc --noEmit` in `api/`)
- [ ] Confirm it's green locally
- [ ] Add it as a step in the **Kvalitet** job in the workflow (keep the job name)
- [ ] Open a test PR with a deliberate type error and confirm it turns red
- [ ] Close that PR without merging

## 5. Pinia session store
- [ ] Create `stores/session` (code from the week 2 demo may be copied)
- [ ] Use it in at least two components (header and login view)

## 6. Tests (at least 12 meaningful ones)
- [ ] Unit tests on pure logic
- [ ] Component tests with Vue Testing Library
- [ ] For each of the three views, cover: data loaded, empty, API failure, search
- [ ] Include the elevation (höjdmetrar) regression test from the lab
- [ ] Check that each test would fail if the real bug returned
- [ ] No tests that only check Vue, Pinia or class names
- [ ] All tests green in the pipeline

## 7. Regression test from `docs/debt.md`
- [ ] Pick a bug from your debt inventory
- [ ] Put the debt number in the test name or a comment
- [ ] Open a PR with **two commits**: first the test (red), then the fix (green)
- [ ] Verify the git history shows the right order

## 8. `docs/testing.md` (decision document)
- [ ] Date
- [ ] Decision
- [ ] Background
- [ ] Test levels
- [ ] Map of what is tested where (at least 8 rows from your codebase)
- [ ] Rules: when a PR may be merged, what a bugfix requires, how the API is mocked, coverage requirement yes/no and why
- [ ] What you deliberately don't test
- [ ] Alternatives you compared
- [ ] Consequences
- [ ] Written together, so anyone on the team can defend it orally

## 9. README
- [ ] Add `shared/` to the structure
- [ ] Add `typecheck` to the commands
- [ ] State the Node requirement

## 10. Tag
- [ ] Merge everything to `main`
- [ ] Confirm the latest run on `main` in Actions is **green**
- [ ] Then run:
  ```bash
  git checkout main && git pull
  git tag -a M2 -m "M2 Typad och testad"
  git push origin M2
  ```

## 11. Canvas submission (one person submits)
- [ ] Link to the team repo
- [ ] Link to the `M2` tag
- [ ] Link to the regression test file on GitHub and the PR (test commit, then fix commit)
- [ ] Link to `docs/testing.md`
- [ ] Two lines: which type error you would have avoided in M1 (or which contract field you disagreed on)

## 12. Prep for Wednesday 7/10
- [ ] The person who did *not* write the types can write `guide.lengthKm` in a view and explain what happens in the editor and the pipeline
- [ ] Everyone can read out one decision from `docs/testing.md` in 30 seconds
- [ ] Everyone can point at a test and name the row in `docs/testing.md` that justifies its level