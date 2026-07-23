#!/usr/bin/env bash

# Emit cumulative task-survival metrics from a validated PLAN.mdx.
# Bash 3.2, Perl, and the sibling validator are sufficient.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATOR="$SCRIPT_DIR/validate-plan.sh"
PLAN_FILE="${1:-.godplans/PLAN.mdx}"
OUTPUT_FILE="${2:-${PLAN_FILE%.mdx}.metrics.json}"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/godplans-halflife.XXXXXX")"
SIDE_CAR="$TMP_DIR/PLAN.json"

trap 'rm -rf "$TMP_DIR"' EXIT HUP INT TERM

[ -x "$VALIDATOR" ] || {
  echo "FAIL $PLAN_FILE: sibling validate-plan.sh is missing or not executable" >&2
  exit 1
}

"$VALIDATOR" --allow-planning --emit-json "$SIDE_CAR" "$PLAN_FILE" >/dev/null

perl -MJSON::PP - "$SIDE_CAR" "$OUTPUT_FILE" <<'PERL'
use strict;
use warnings;

my ($sidecar, $output) = @ARGV;
open my $input_fh, '<:raw', $sidecar
    or die "FAIL $sidecar: cannot read: $!\n";
local $/;
my $document = JSON::PP->new->decode(<$input_fh>);
close $input_fh;

my $result = {
    format => 'godplans/plan-half-life@1',
    plan_digest => $document->{plan_digest},
    plan_version => $document->{plan_version},
    metrics => $document->{metrics},
};

my $json = JSON::PP->new->canonical(1)->pretty->encode($result);
my $tmp = "$output.tmp.$$";
open my $output_fh, '>:raw', $tmp
    or die "FAIL $tmp: cannot write: $!\n";
print {$output_fh} $json;
close $output_fh;
rename $tmp, $output
    or die "FAIL $output: cannot replace atomically: $!\n";
PERL

echo "ok   $OUTPUT_FILE"
