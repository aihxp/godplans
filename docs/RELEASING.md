# Releasing godplans

Releases are cut from a clean `main` branch after the release pull request is
merged. The Git tag, GitHub release, and every version surface use the same
SemVer value.

## Release checklist

1. Add the new top entry to CHANGELOG.md with the release date.
2. Update the version in SKILL.md frontmatter and body, package.json,
   marketplace metadata, plugin metadata, and the PLAN template.
3. Run `npm run build:prompt` after every inlined source is final.
4. Run `npm run check` and `npm pack --dry-run --json` from a clean checkout.
5. Open a ready pull request and wait for the `release quality` workflow.
6. Merge the pull request to `main` without bypassing a failed required check.
7. Pull the merged `main`, create annotated tag `vX.Y.Z`, and push the tag.
8. Create the GitHub release from the matching CHANGELOG section.
9. Verify the release page, tag target, default branch version, and a clean
   local worktree.

## Commands

```bash
npm run build:prompt
npm run check
npm pack --dry-run --json
git tag -a vX.Y.Z -m "godplans vX.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag --title "godplans vX.Y.Z" --notes-file RELEASE-NOTES.md
```

Do not reuse or move a published tag. A failed release gets a new patch version.
