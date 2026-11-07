<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep map and APK/file workspaces in separate TanStack content routes with shared navigation so each remains directly accessible.
- Load Leaflet dynamically after hydration and retain OpenStreetMap attribution to keep SSR safe and mapping key-free.
- Keep this redesign's location operations in React demo state, clearly marked as simulated, until the existing ProteoMesh API is available; do not introduce an unrelated backend.
