# Archive: the `.work/` PRDs and slices

Until the move to GitHub issues, PRDs and their tickets ("slices") lived as files
under `.work/prds/` and `.work/issues/<prd>/`. Every one of them was done when they
were removed. They're kept at the last commit before the move:

- [`.work/` tree at `b22685e`](https://github.com/jpyepez/web-toys/tree/b22685e/.work)
- [PRDs](https://github.com/jpyepez/web-toys/tree/b22685e/.work/prds): shell-counting-sheep,
  counting-sheep-polish, counting-sheep-mobile-rethink, puffer-fish, muddy-puddle,
  balloons, nestlings
- [Slices](https://github.com/jpyepez/web-toys/tree/b22685e/.work/issues), one folder per PRD

Code comments that cite "(<name> PRD, slice #NN)" point into that tree: slice #NN
of a PRD is `.work/issues/<name>/NN-*.md` there.

New specs and tickets are GitHub issues; see `docs/agents/issue-tracker.md`.
