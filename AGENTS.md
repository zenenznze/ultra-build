# Public ultra-build skill development

- This standalone skill is developed in public at https://github.com/zenenznze/ultra-build.
- Publish only reviewed skill source and its documentation; never import private development history, task records, source snapshots, runtime receipts or backups.
- Before committing run `python3 scripts/public_privacy_check.py`; before pushing run `python3 scripts/public_privacy_check.py --tree HEAD` and review every outgoing commit. Findings must be resolved before publication.
- Review every staged diff and outgoing commit for secrets, real usernames/home paths, machine checkout paths and private hosts. Use project-relative paths, environment variables and `/path/to/...` placeholders instead.
- Keep environment files, key files, dependencies, build output and raw logs ignored. `.gitignore` excludes files, not sensitive strings; inspect tracked contents and history separately.
- Retain PROVENANCE.md and all applicable license notices. Changes to ignored files do not retroactively remove tracked files or history.
- Preserve unrelated changes. Never use mirror/all-ref pushes or merge private development ancestry; history rewriting requires explicit approval.
- The skill is prompt-guided and has no production trusted verifier. Validate changed behavior and report missing independent review/human gates honestly.
