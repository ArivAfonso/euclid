# Manual desktop releases

This repository intentionally does **not** publish on pushes or every commit. Releases are started only from GitHub Actions:

1. Push this workflow to the default branch.
2. Open **Actions → Release desktop app → Run workflow**.
3. Enter a new semantic version, such as `0.2.0`.
4. Keep **draft** enabled if you want to review the release before publishing it.
5. Start the workflow. GitHub builds Windows, macOS, and Linux in parallel and uploads all installers to the release.
6. If the release was created as a draft, review its notes/assets on GitHub and click **Publish release** when ready.

The workflow uses the repository-provided `GITHUB_TOKEN`; no personal access token is required. The GitHub repository must allow Actions to create releases, and the workflow permissions must remain set to `contents: write`.

The desktop app's `electron-updater` configuration already reads GitHub Releases. Published releases use tags in the form `v<version>`, for example `v0.2.0`.
