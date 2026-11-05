#!/bin/bash
# Block a `git commit` that would land on main/master. Worktree-aware.
#
# This is the fast, friendly layer: it fails early with a helpful message
# before the tool call runs. `.husky/branch-guard.sh` is the real backstop —
# it runs inside git and cannot be routed around by a command string at all.
#
# Design notes (#2361):
#   - The tool payload is parsed as JSON, never with sed. A `"` anywhere in the
#     command used to truncate the old parse and silently disarm the guard.
#   - The command is scanned segment-by-segment (split on && || ; | parens) so
#     `cd` can appear anywhere, not only first, and the LAST `cd` before the
#     commit wins. An explicit `git -C <dir>` overrides it.
#   - Unresolvable targets (`cd $VAR`, missing dir) FAIL CLOSED.
#
# Known residual gaps, all covered by .husky/branch-guard.sh: a subshell `cd`
# that does not persist — `( cd $WT ) && git commit` — `xargs git commit`, and
# shell aliases or functions. Closing those needs a real shell parser.
set -uo pipefail

# Same escape hatch as .husky/branch-guard.sh, for an exported variable. The
# far more common `ALLOW_MAIN_COMMIT=1 git commit …` prefix form is handled
# below, where the command itself is parsed.
[ "${ALLOW_MAIN_COMMIT:-}" = "1" ] && exit 0

# A builtin read rather than $(cat) — this runs on every Bash tool call, and
# not forking is ~25% of the fast path.
IFS= read -r -d '' INPUT

# Fast path: `commit` as the git subcommand is always followed by a separator,
# so this skips `commitlint`, `uncommitted`, `commits`, `commit-tree` … without
# paying for an interpreter. Only the trailing boundary is checked: this scans
# the raw JSON, where `git<TAB>commit` arrives as the six characters `git\tco…`
# — a leading boundary would read the `t` of `\t` as a word character and wave
# the command through.
[[ $INPUT =~ commit([^A-Za-z-]|$) ]] || exit 0

# Without the interpreter we would silently fail OPEN, so fail closed — but
# only here, where we already know the command mentions `commit`.
if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"BLOCKED: the branch guard could not run (python3 not found)."}}'
  exit 0
fi

# Read the program with the same forkless builtin, then hand it to python3 as
# an argument so stdin stays free for the payload. Passing the program on
# stdin instead measured ~60ms slower per call.
IFS= read -r -d '' PY <<'PYEOF'
import json, os, re, subprocess, sys

def emit_deny(reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason}}))
    sys.exit(0)

def allow():
    sys.exit(0)

try:
    data = json.load(sys.stdin)
except Exception:
    allow()  # not a payload we understand — nothing we can assert about it

cmd = (data.get("tool_input") or {}).get("command") or ""
session_cwd = data.get("cwd") or os.getcwd()

# Newlines are command separators; then collapse whitespace so `git\tcommit`
# and `git  commit` normalise to `git commit`.
norm = re.sub(r"\s+", " ", cmd.replace("\n", " ; ")).strip()

# Unwrap `bash -c "…"` so the inner command is scanned like any other. The
# splitter below is quote-blind, so without this a `cd` inside the wrapper is
# shredded along with it and the commit is attributed to the wrong directory.
norm = re.sub(r"""(?:ba|z)?sh\s+-[a-z]*c\s+(["'])(.*?)\1""", r" ; \2 ; ", norm)

# `git [global flags] commit` at the start of a segment, allowing VAR=x
# prefixes. Both the VAR= prefix and the global flags are captured: the escape
# hatch is read from the first, and `-C` from the second. Reading `-C` from the
# whole segment instead would misfire on `git commit --amend -C HEAD`, where
# `-C` is commit's own "reuse this commit's message" flag, not a directory.
GIT_COMMIT = re.compile(
    r"""^((?:\w+=\S*\s+)*)                          # optional  VAR=value
         git
         ((?:\s+(?:-[cC]\s+\S+|--?[A-Za-z][\w-]*(?:=\S*)?))*) # global flags
         \s+commit(?![\w-])""",   # `commit`, not `commit-tree`
    re.VERBOSE,
)

def resolve(raw, base):
    raw = raw.strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in "\"'":
        raw = raw[1:-1]
    if not raw or "$" in raw or "`" in raw:
        return None            # shell-expanded — we cannot know
    raw = os.path.expanduser(raw)
    if not os.path.isabs(raw):
        if not base:
            return None
        raw = os.path.join(base, raw)
    return os.path.realpath(raw)

segments = re.split(r"\s*(?:&&|\|\||;|\||\(|\))\s*", norm)
cur, target, found = session_cwd, None, False

for seg in segments:
    seg = seg.strip()
    if not seg:
        continue
    m = re.match(r"""^cd\s+(?!-)("[^"]*"|'[^']*'|\S+)""", seg)
    if m:
        cur = resolve(m.group(1), cur)
        continue
    hit = GIT_COMMIT.search(seg)
    if hit:
        env_prefix, global_flags = hit.group(1), hit.group(2)
        if "ALLOW_MAIN_COMMIT=1" in env_prefix:
            allow()            # documented escape hatch — see branch-guard.sh
        found = True
        c = re.search(r"(?:^|\s)-C\s+(\S+)", global_flags)
        target = resolve(c.group(1), cur) if c else cur
        break

if not found:
    allow()                    # no `git commit` in command position
if target is None:
    emit_deny("BLOCKED: the branch guard cannot resolve the directory this "
              "commit would run in (shell variable or missing path). Use a "
              "literal absolute path, or run the commit from the worktree.")

if not os.path.isdir(target):
    emit_deny("BLOCKED: the branch guard cannot resolve the directory this "
              "commit would run in (%s does not exist)." % target)

try:
    branch = subprocess.run(["git", "-C", target, "branch", "--show-current"],
                            capture_output=True, text=True,
                            timeout=3).stdout.strip()
except Exception:
    branch = ""

if branch in ("main", "master"):
    emit_deny("BLOCKED: that commit would land on %s in %s. Use /ralph-once to "
              "create a worktree for an issue first." % (branch, target))

allow()   # feature branch, detached HEAD, or not a repo — git will sort it out
PYEOF

printf '%s' "$INPUT" | python3 -c "$PY"
exit 0
