# Compliance module: Anthropic Usage Policy gate and account safety

Loaded in Phase 1, before discovery, and standing for the whole session. Two halves: (A) rules for how this skill and its host agent use Claude, and (B) the plan-time gate applied to the project being planned. The point is practical: keep the user's account clean and keep the planned product on the right side of the Anthropic Usage Policy (anthropic.com/legal/aup, effective 2025-09-15), the Consumer Terms (anthropic.com/legal/consumer-terms), and the agent guidance at support.claude.com (article 12005017). Policies change; on compliance-sensitive projects, re-check those URLs rather than trusting this file's snapshot.

The same screening logic applies unchanged when this skill runs in a non-Claude harness (Codex, Cursor, Gemini, and others): every provider publishes an equivalent usage policy, and a project that fails the gate below almost certainly fails theirs too.

## A. How the skill itself behaves

1. **Never coach the model past a refusal.** Do not ask any model to ignore, work around, or bypass its guardrails; do not rephrase, fragment, or roleplay a refused request into innocuous-looking steps. Intentional guardrail bypass is a named Usage Policy violation. If a step is refused, route it to the human and move on.
2. **Authentication hygiene, the number one real-world ban vector.** Subscription (Free, Pro, Max) OAuth credentials belong only in official Anthropic clients: Claude Code, claude.ai, the desktop and mobile apps. Never suggest extracting or reusing subscription tokens in third-party harnesses, scripts, or the Agent SDK; accounts are banned for this without prior notice. Anything this plan schedules unattended (CI, cron, bots, background runs) must specify API-key auth (`ANTHROPIC_API_KEY` via the Console, Bedrock, or Vertex). No account sharing, no reselling access, no parallel accounts to dodge limits, no 24/7 background use of a subscription plan; advertised Pro and Max limits assume ordinary individual usage.
3. **Honest output.** No fabricated results, no presenting AI output as human-authored where disclosure is required. Where the planned product produces consumer-facing AI content, the plan carries the disclosure requirements from the gate below.
4. **If a warning or ban happens anyway**: appeal at claude.ai/restricted or safeguards@anthropic.com. Creating a new account to evade a ban is itself a listed violation. Note for users: VPN and datacenter IPs, rapid geographic changes, and billing changes are documented false-positive triggers; prevention beats appeal (appeals succeed rarely).

## B. The plan-time gate

Screen the project idea against these categories before discovery. Three outcomes:

- **Hard stop**: the core purpose is prohibited. Name the category, cite it, decline to plan. Examples: fake-review or engagement farms, phishing kits and lookalike domains, undisclosed AI persona networks, scrapers built to evade platform safeguards, malware and DDoS tooling, ban-evasion systems, voter-deception tooling.
- **Mitigate**: legitimate project, risky component. Plan it, and inject the matching mitigation requirements below as mandatory tasks with acceptance criteria.
- **Pass**: record "Compliance gate: pass" in the plan and move on. Do not lecture; one line suffices.

### Prohibited-purpose checklist (hard stop when it is the core mechanic)

1. **Deception**: fake reviews, comments, or engagement; fake personas; sites mimicking legitimate pages; phishing or social-engineering flows; AI output passed off as human.
2. **Spam and ranking abuse**: mass unsolicited messaging; spam content generation at scale; manipulated rankings, traffic metrics, or polls; coordinated inauthentic behavior; click farming.
3. **Dark patterns and predatory practices**: manipulative behavior-distortion techniques, exploitative lending, MLM and pyramid mechanics, abusive debt collection, exploiting age or disability or economic hardship.
4. **Privacy and surveillance**: harvesting personal, health, or biometric data without consent; tracking individuals without notice; facial recognition without consent; mass surveillance; profiling on protected attributes.
5. **Unauthorized access and malware**: backdoors, privilege escalation, credential abuse, botnets, DDoS, exploiting vulnerabilities without authorization. Authorized security work (pen tests with written permission, CTF, defensive tooling) is explicitly fine; the plan records the authorization.
6. **Platform abuse**: bulk account creation, multi-account evasion, CAPTCHA and anti-bot circumvention at scale, scraping that violates a target's ToS or robots.txt.
7. **Political manipulation**: voter or campaign micro-targeting, synthetic media of political figures, automated outreach to officials or voters that conceals its artificial origin.

### Mitigation requirements (inject as plan tasks when the component applies)

- **Consumer-facing chatbot**: the product SHALL disclose that the user is interacting with AI, at minimum at session start. Acceptance: the disclosure string exists in the first-load UI path.
- **High-risk consumer domain** (legal, medical, financial, insurance, employment or housing eligibility, admissions, automated journalism): a qualified professional SHALL review outputs before dissemination, and AI involvement SHALL be disclosed. B2B internal tools are exempt; record which applies.
- **AI-generated content published at scale**: content SHALL be attributable and not plagiarized; where a platform requires AI labeling, the plan includes it.
- **Web automation and crawling**: the crawler SHALL honor robots.txt and the target's ToS, throttle requests, identify itself honestly in its user agent, and never operate multiple accounts on a third-party platform. Acceptance: rate limiter and robots.txt check exist as named components in the architecture section.
- **Outbound automated communications**: messages to people, officials, or support systems SHALL NOT conceal their artificial origin.
- **Products serving minors**: flag for Anthropic's additional minor-safety requirements and record the age-gating decision.
- **Anything running Claude unattended**: the task specifies API-key auth, never subscription OAuth (see A2).

### Do not over-block

The gate exists to catch real violations, not to harass legitimate work. Explicitly fine: authorized security testing and research, civic and policy research, B2B professional tools (exempt from the consumer disclosure duo), heavy individual use of a paid plan, API-key automation and CI, adult themes in creative writing within policy, and competitive analysis. When a project is ambiguous, ask one clarifying question instead of refusing; record the answer in the plan.

## What lands in the plan

One short section:

```markdown
## Compliance gate

Result: pass | mitigated | (hard stop never reaches a plan)
Screened: YYYY-MM-DD against anthropic.com/legal/aup (2025-09-15 version).
Mitigations injected: GP-xxx (AI disclosure banner), GP-yyy (crawler rate limiter). [omit line when pass]
Account safety: unattended runs use ANTHROPIC_API_KEY; no subscription OAuth outside official clients.
```

Proportionate, checkable, done.
