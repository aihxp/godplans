# Blind external plan rubric

Judge only what the project brief and the two plans say. Do not reward a tool
name, file format, requirement-id convention, length, or professional tone.
Score each criterion from 1 to 5 using the anchors below.

## Criteria

1. Decision completeness: the plan settles the choices that would be expensive
   to reverse for this specific brief, and separates settled choices from
   assumptions.
2. Falsifiability: major choices name observable evidence that could prove them
   wrong, plus a concrete response when that evidence appears.
3. Execution actionability: a fresh implementation agent can identify the next
   unit of work, its dependencies, completion evidence, and verification.
4. Risk targeting: the plan addresses the brief's most consequential failure
   modes without relying on generic security, quality, or operations language.
5. Proportionality: depth matches the stated scale and capacity. Low-reversal
   work is deferred or compressed when planning it now would add little value.
6. Internal consistency: decisions, requirements, sequencing, and verification
   agree with each other, with no conflicting lifecycle or scope claims.

## Anchors

- 1: materially absent or unusable.
- 2: present in fragments, with major gaps.
- 3: adequate but requires implementation-time interpretation.
- 4: specific and usable, with only minor gaps.
- 5: independently executable and easy to disprove when wrong.

Return the required JSON only. Give each plan an independent score before
choosing a preference. A tie is valid.
