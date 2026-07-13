#!/usr/bin/env bash

# Portable structural validator for emitted PLAN.mdx files.
# Bash 3.2 and the Perl shipped with macOS are sufficient.

set -eu

ALLOW_PLANNING=0
PLAN_FILE=""

usage() {
  echo "Usage: $0 [--allow-planning] [PLAN.mdx]" >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --allow-planning)
      ALLOW_PLANNING=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      usage
      echo "Unknown option: $1" >&2
      exit 2
      ;;
    *)
      if [ -n "$PLAN_FILE" ]; then
        usage
        echo "Only one PLAN.mdx path may be supplied" >&2
        exit 2
      fi
      PLAN_FILE=$1
      ;;
  esac
  shift
done

[ -n "$PLAN_FILE" ] || PLAN_FILE=".godplans/PLAN.mdx"

if [ ! -f "$PLAN_FILE" ]; then
  echo "FAIL $PLAN_FILE: file not found" >&2
  exit 1
fi

if ! command -v perl >/dev/null 2>&1; then
  echo "FAIL $PLAN_FILE: perl not found; validation cannot fail open" >&2
  exit 1
fi

exec perl -CSD - "$PLAN_FILE" "$ALLOW_PLANNING" <<'PERL'
use strict;
use warnings;

my ($plan_file, $allow_planning) = @ARGV;
my @errors;

sub fail {
    push @errors, $_[0];
}

sub trim {
    my ($value) = @_;
    $value = '' unless defined $value;
    $value =~ s/^\s+//;
    $value =~ s/\s+$//;
    return $value;
}

open my $plan_fh, '<:encoding(UTF-8)', $plan_file
    or die "FAIL $plan_file: cannot read: $!\n";
my @lines = <$plan_fh>;
close $plan_fh;
chomp @lines;
for (@lines) {
    s/\r$//;
}

my $frontmatter_end = -1;
if (!@lines || $lines[0] ne '---') {
    fail('frontmatter must begin on line 1 with ---');
} else {
    for my $index (1 .. $#lines) {
        if ($lines[$index] eq '---') {
            $frontmatter_end = $index;
            last;
        }
    }
    fail('frontmatter is missing its closing ---') if $frontmatter_end < 0;
}

my %frontmatter;
my %counter;
my %top_key_count;
my $has_progress = 0;
if ($frontmatter_end > 0) {
    for my $index (1 .. $frontmatter_end - 1) {
        my $line = $lines[$index];
        if ($line =~ /^([a-z_]+):(?:[ \t]*(.*))?$/) {
            my ($key, $value) = ($1, trim($2));
            $top_key_count{$key}++;
            $frontmatter{$key} = $value;
            $has_progress = 1 if $key eq 'progress';
        } elsif ($line =~ /^  (phases_total|phases_done|tasks_total|tasks_done):[ \t]*(.*)$/) {
            my ($key, $value) = ($1, trim($2));
            fail("duplicate progress counter: $key") if exists $counter{$key};
            $counter{$key} = $value;
        }
    }
}

for my $key (qw(name plan_version status created updated mode archetype domains_applicable domains_excluded)) {
    if (!exists $frontmatter{$key}) {
        fail("missing frontmatter field: $key");
    } elsif ($frontmatter{$key} eq '' && $key ne 'domains_excluded') {
        fail("frontmatter field is empty: $key");
    }
    fail("duplicate frontmatter field: $key")
        if ($top_key_count{$key} || 0) > 1;
}
fail('missing frontmatter field: progress') unless $has_progress;
fail('duplicate frontmatter field: progress')
    if ($top_key_count{progress} || 0) > 1;

if (exists $frontmatter{plan_version}
        && $frontmatter{plan_version} !~ /^[1-9][0-9]*$/) {
    fail("plan_version must be a positive integer, found '$frontmatter{plan_version}'");
}

my %allowed_status = map { $_ => 1 } qw(planning approved executing done);
if (exists $frontmatter{status} && !$allowed_status{$frontmatter{status}}) {
    fail("invalid status '$frontmatter{status}'; expected planning, approved, executing, or done");
} elsif (!$allow_planning
        && exists $frontmatter{status}
        && $frontmatter{status} ne 'approved'
        && $frontmatter{status} ne 'executing') {
    fail("execution requires status approved or executing, found '$frontmatter{status}'");
}

my %allowed_mode = map { $_ => 1 } qw(greenfield brownfield replan);
if (exists $frontmatter{mode} && !$allowed_mode{$frontmatter{mode}}) {
    fail("invalid mode '$frontmatter{mode}'; expected greenfield, brownfield, or replan");
}

for my $key (qw(created updated)) {
    if (exists $frontmatter{$key}
            && $frontmatter{$key} !~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) {
        fail("$key must use YYYY-MM-DD, found '$frontmatter{$key}'");
    }
}

for my $key (qw(phases_total phases_done tasks_total tasks_done)) {
    if (!exists $counter{$key}) {
        fail("missing progress counter: $key");
    } elsif ($counter{$key} !~ /^[0-9]+$/) {
        fail("progress counter $key must be a non-negative integer, found '$counter{$key}'");
    }
}

my $in_requirements = 0;
my %local_requirements;
for my $line (@lines) {
    if ($line eq '## Requirements') {
        $in_requirements = 1;
        next;
    }
    if ($in_requirements && $line =~ /^## /) {
        $in_requirements = 0;
    }
    if ($in_requirements && $line =~ /^(R-[0-9]+\.[0-9]+):/) {
        $local_requirements{$1} = 1;
    }
}

my %catalog_max = (
    ARCH => 19,
    BUILD => 20,
    CODE => 22,
    DB => 22,
    DEPLOY => 18,
    DNA => 20,
    LAUNCH => 21,
    LLM => 23,
    MEM => 18,
    OBS => 20,
    PRD => 17,
    REPO => 20,
    ROAD => 20,
    SEC => 25,
    SEO => 22,
    STACK => 20,
    UI => 20,
    UX => 20,
);
my %catalog_requirements;
for my $prefix (keys %catalog_max) {
    for my $number (1 .. $catalog_max{$prefix}) {
        $catalog_requirements{"R-$prefix-$number"} = 1;
    }
}

my @phases;
my @tasks;
my %task_definitions;
my $current_phase = -1;
for (my $index = 0; $index <= $#lines; $index++) {
    my $line = $lines[$index];
    if ($line =~ /^## Phase ([1-9][0-9]*):\s*(.+?)\s*$/) {
        push @phases, {
            number => $1,
            name => $2,
            tasks => [],
            line => $index + 1,
        };
        $current_phase = $#phases;
        next;
    }

    if ($line =~ /^- \[([ x])\] (GP-[1-9][0-9]{2,})\b/) {
        my ($box, $id) = ($1, $2);
        my $task = {
            id => $id,
            done => $box eq 'x' ? 1 : 0,
            fields => {},
            line => $index + 1,
            phase => $current_phase,
        };
        push @tasks, $task;
        push @{$phases[$current_phase]{tasks}}, $#tasks if $current_phase >= 0;
        fail("$id is not inside a numbered phase") if $current_phase < 0;
        if (exists $task_definitions{$id}) {
            fail("duplicate task definition ID $id on lines $task_definitions{$id} and " . ($index + 1));
        } else {
            $task_definitions{$id} = $index + 1;
        }

        for (my $field_index = $index + 1; $field_index <= $#lines; $field_index++) {
            my $field_line = $lines[$field_index];
            last if $field_line =~ /^- \[[ x]\] GP-/;
            last if $field_line =~ /^## Phase [1-9][0-9]*:/;
            if ($field_line =~ /^  - (Files|Depends on|Reuses|Acceptance|Verify|Requirements):[ \t]*(.*)$/) {
                push @{$task->{fields}{$1}}, trim($2);
            }
        }
    } elsif ($line =~ /^- \[[^]]*\] GP-/) {
        fail('malformed task definition on line ' . ($index + 1));
    }
}

my @required_fields = ('Files', 'Depends on', 'Reuses', 'Acceptance', 'Verify', 'Requirements');
for my $task (@tasks) {
    for my $field (@required_fields) {
        my $count = exists $task->{fields}{$field} ? scalar @{$task->{fields}{$field}} : 0;
        if ($count == 0) {
            fail("$task->{id} missing required field: $field");
        } elsif ($count > 1) {
            fail("$task->{id} has duplicate required field: $field");
        } elsif ($task->{fields}{$field}[0] eq '') {
            fail("$task->{id} has empty required field: $field");
        }
    }

    if (exists $task->{fields}{'Depends on'} && @{$task->{fields}{'Depends on'}} == 1) {
        my $depends = $task->{fields}{'Depends on'}[0];
        if ($depends ne 'none') {
            my @dependencies = split /\s*,\s*/, $depends, -1;
            if (!@dependencies || grep { $_ !~ /^GP-[1-9][0-9]{2,}$/ } @dependencies) {
                fail("$task->{id} has malformed Depends on value '$depends'");
            } else {
                for my $dependency (@dependencies) {
                    fail("$task->{id} depends on itself") if $dependency eq $task->{id};
                    fail("$task->{id} depends on undefined task $dependency")
                        unless exists $task_definitions{$dependency};
                }
            }
        }
    }

    if (exists $task->{fields}{Requirements} && @{$task->{fields}{Requirements}} == 1) {
        my $requirements = $task->{fields}{Requirements}[0];
        my @requirement_ids = split /\s*,\s*/, $requirements, -1;
        if (!@requirement_ids
                || grep { $_ !~ /^R-(?:[0-9]+\.[0-9]+|[A-Z][A-Z0-9-]*-[0-9]+)$/ } @requirement_ids) {
            fail("$task->{id} has malformed Requirements value '$requirements'");
        } else {
            for my $requirement_id (@requirement_ids) {
                next if $local_requirements{$requirement_id};
                next if $catalog_requirements{$requirement_id};
                fail("$task->{id} cites undefined requirement $requirement_id");
            }
        }
    }
}

my $tasks_total = scalar @tasks;
my $tasks_done = scalar grep { $_->{done} } @tasks;
my $phases_total = scalar @phases;
my $phases_done = 0;
for my $phase (@phases) {
    if (!@{$phase->{tasks}}) {
        fail("Phase $phase->{number} has no task definitions");
        next;
    }
    my $all_done = 1;
    for my $task_index (@{$phase->{tasks}}) {
        $all_done = 0 unless $tasks[$task_index]{done};
    }
    $phases_done++ if $all_done;
}

my %derived_counter = (
    phases_total => $phases_total,
    phases_done => $phases_done,
    tasks_total => $tasks_total,
    tasks_done => $tasks_done,
);
for my $key (qw(phases_total phases_done tasks_total tasks_done)) {
    next unless exists $counter{$key} && $counter{$key} =~ /^[0-9]+$/;
    fail("$key is $counter{$key}, derived value is $derived_counter{$key}")
        if $counter{$key} != $derived_counter{$key};
}

my $open_questions_count = scalar grep { $_ eq '## Open Questions' } @lines;
fail("expected exactly one ## Open Questions section, found $open_questions_count")
    if $open_questions_count != 1;

if (!@phases || $phases[-1]{name} ne 'Verification') {
    my $found = @phases ? $phases[-1]{name} : 'none';
    fail("final phase must be Verification, found '$found'");
}

for my $index (0 .. $#lines) {
    if ($lines[$index] =~ /[\x{2013}\x{2014}\x{2018}-\x{201F}\x{2026}\x{2190}-\x{21FF}\x{2500}-\x{257F}\x{FE0F}\x{1F000}-\x{1FAFF}]/) {
        fail('banned Unicode on line ' . ($index + 1));
    }
}

if (@errors) {
    for my $error (@errors) {
        print STDERR "FAIL $plan_file: $error\n";
    }
    exit 1;
}

print "ok   $plan_file\n";
exit 0;
PERL
