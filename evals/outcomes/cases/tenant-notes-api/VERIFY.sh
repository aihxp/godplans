#!/usr/bin/env bash

set -eu

[ "$#" -eq 1 ] || { echo "usage: VERIFY.sh BUILT_REPOSITORY" >&2; exit 2; }
REPOSITORY=$1

test -f "$REPOSITORY/package.json"
(
  cd "$REPOSITORY"
  npm test
  npm run lint --if-present
)
