---
artifact: repurpose_pack
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: socialglowz
created: "2026-07-15"
updated: "2026-07-15"
status: active
source_skill: 202-sg-repurpose
scope: socialglowz-webview-compliance-decision
owner: Diane
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
source_type: operator-decision-and-compliance-audit
source_ref:
  - "Operator conversation, 2026-07-15"
  - "shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md"
linked_systems:
  - "src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt"
  - "src-tauri/src/lib.rs"
  - "site/src/pages/privacy.astro"
  - "shipglows_data/workflow/TASKS.md"
depends_on:
  - artifact: "shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md"
    artifact_version: "1.0.0"
    required_status: active
evidence:
  - "Operator decision recorded in the 2026-07-15 compliance conversation."
  - "Google Play Android compliance audit dated 2026-07-15."
supersedes: []
next_step: "/200-sg-redact draft an approved public FAQ or changelog entry from this pack"
---

# SocialGlowz WebView Compliance Decision - Repurpose Pack

## Best Next Actions

- Action: Publish a short FAQ or changelog entry only after the compliant replacement is implemented and verified.
  Deliverable: A public-facing explanation of the product decision.
  Target surface or owner: Public FAQ, changelog, or trust/privacy page via `200-sg-redact`.
  Source proof: Operator decision on 2026-07-15 and Google Play compliance audit.
  Next step: Use this pack as the sole source boundary for the draft.

- Action: Keep the technical audit and this pack internal until a public surface and release proof exist.
  Deliverable: No premature compliance marketing claim.
  Target surface or owner: Internal governance.
  Source proof: The remediation task is still open.
  Next step: Revalidate all claims after implementation.

## Source-Faithful Pack

### Source Classification

- Source type: Operator decision supported by a technical and policy-readiness audit.
- Probable project: SocialGlowz Android public release.
- Audience: Current and prospective SocialGlowz users who value account safety, user control, and transparent product behavior.
- Best angle: Product maturity through removal of risky automation, not an account of evading platform controls.
- Confidence: High for the decision and audit observations; no legal conclusion or third-party platform authorization is established.

### Core Truth

- Core idea: SocialGlowz chose to remove automatic consent handling, anti-detection behavior, and automated interactions with third-party WebView interfaces from its distributable product.
- Problem or tension: Convenience automation could interfere with third-party interfaces, reduce user control over consent, and create Google Play and platform-compliance risk.
- Promised outcome actually supported: The intended public product direction is more transparent, user-initiated behavior and strict respect for platform and Play Store rules.
- Strongest proof: The 2026-07-15 audit identifies automatic cookie-consent clicks and anti-detection/anti-bot behavior as release blockers; the operator explicitly chose a compliance-first product direction.
- Constraints and caveats: The remediation is not yet implemented or release-verified. Compliance cannot be guaranteed by copy alone; final legal, platform-agreement, Data Safety, and build verification remain required.
- Unsafe or unproven claims: "fully compliant", "approved by Google", "authorized by every social platform", "no data is ever collected", or any claim that a historic implementation was legal or harmless.

### Reusable Material

- Best reusable wording: "Nous avons choisi de retirer des automatisations qui pouvaient agir sur des interfaces tierces afin de privilégier des actions explicites, visibles et contrôlées par l'utilisateur."
- Best reusable wording: "La fiabilité et le respect des règles des plateformes priment sur les raccourcis d'interface."
- Objections or questions surfaced: Why remove a convenience feature? Can the product still simplify social-network workflows? What remains automated? How is user privacy protected?
- Diagrams or lists worth preserving: A three-part distinction between user-initiated actions, official integrations, and prohibited interface automation.
- What should not be echoed too closely: Implementation details, CSS selectors, consent-management-platform names, anti-fingerprint methods, terms such as "anti-bot bypass", or language framing a private non-compliant build as a product option.

### Surface Opportunities

- Public surfaces justified: Release notes, FAQ, privacy/trust page, and a future "How SocialGlowz works" page.
- Internal surfaces justified: Engineering decision record, compliance-remediation spec, and reviewer-access notes for Play Console.
- Surfaces to avoid: Sales landing-page hero, comparative ads, security promises, and any copy implying partnership or authorization from Meta, TikTok, or other networks.
- Canonical surface if one exists: Surface missing: a dedicated public trust or product-behavior page has not been verified.

## Existing Content Opportunities

### Internal Docs / Notes

- Surface: `shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md`.
  Placement idea: Keep it as the technical evidence record; do not turn it into public copy.
  Audience learning moment: Understand why the public release gate exists.
  Source proof: SGP-01 and SGP-02.
  Content move: Link future implementation proof and policy review outcomes.
  Priority: High.
  Next step: `/100-sg-spec SocialGlowz Google Play compliance remediation` when implementation is authorized.

- Surface: `shipglows_data/workflow/changelog.md`.
  Placement idea: Add a factual internal release-note entry when code removal is complete.
  Audience learning moment: Preserve an auditable technical decision without promoting retired behavior.
  Source proof: Operator decision and merged implementation.
  Content move: Describe removed automated consent and anti-detection behavior at a high level.
  Priority: High after implementation.
  Next step: Route to `300-sg-docs` after verified code changes.

### Public Content

- Surface: Public FAQ.
  Placement idea: "Pourquoi certaines interactions demandent-elles désormais votre action ?"
  Audience learning moment: Explain that SocialGlowz does not accept privacy choices or act invisibly on a user's behalf.
  Source proof: The operator's compliance-first decision.
  Content move: Use the safe wording below; state only implemented behavior.
  Priority: Medium, after release proof.
  Next step: `/200-sg-redact`.

- Surface: Release notes.
  Placement idea: A concise entry under privacy, transparency, or reliability.
  Audience learning moment: Frame removal as a product-quality decision rather than a legal controversy.
  Source proof: Audit and implemented change.
  Content move: Mention user-controlled interactions and official integration direction; do not name platform-specific mechanics.
  Priority: Medium, after implementation.
  Next step: `/200-sg-redact` followed by `/103-sg-verify`.

## Owner Skill Handoffs

- Owner skill: `200-sg-redact`.
  Recommended command: `/200-sg-redact Draft a public FAQ and a release-note entry from shipglows_data/workflow/repurpose-packs/2026-07-15-socialglowz-webview-compliance-decision-repurpose-pack.md after implementation proof is available`.
  Target surface: Declared public FAQ or changelog; do not invent a route.
  Source truth: SocialGlowz is retiring automated third-party WebView interactions in favor of explicit user actions and authorized integrations.
  Source proof: This pack and the 2026-07-15 audit.
  Intended content move: Explain the user benefit without exposing implementation details.
  Claim constraints: No compliance guarantee, no claim of third-party authorization, no historic anti-detection details, and no claim before code/build verification.
  Priority: Medium after remediation.
  Context to pass forward: Ask the writer to confirm the actual released behavior and canonical public route first.

- Owner skill: `300-sg-docs`.
  Recommended command: `/300-sg-docs Record the verified removal decision in the SocialGlowz technical changelog`.
  Target surface: Internal technical changelog and relevant product/privacy documentation.
  Source truth: The historic behavior is retained only as audit history, not as a supported product capability.
  Source proof: Operator decision and merged code diff.
  Intended content move: Maintain an accurate, non-promotional decision record.
  Claim constraints: Do not include steps to restore, bypass, or operate the retired behavior.
  Priority: High after remediation.
  Context to pass forward: Preserve the audit link and release verification evidence.

## Evidence Ledger

| Claim or decision | Evidence | Confidence | Publication constraint |
| --- | --- | --- | --- |
| Automated consent behavior was identified as a release blocker. | Compliance audit, SGP-01. | High | Public copy may say the product does not make privacy choices for users only after implementation proof. |
| Anti-detection and anti-bot behavior was identified as a release blocker. | Compliance audit, SGP-02. | High | Do not describe methods publicly. |
| The operator chose a strict Play Store and platform-compliance direction. | Operator conversation, 2026-07-15. | High | Present as a product decision, not as legal certification. |
| The product will use official integrations and user-visible, user-initiated actions where applicable. | Operator decision. | Medium | Publish only after the actual architecture is implemented and verified. |

## Optional Surface Draft Seeds

### FAQ / Docs / Notes

- Surface: Public FAQ.
  Seed: "SocialGlowz ne valide pas vos choix de confidentialité et ne réalise pas d'actions invisibles sur les interfaces des plateformes. Lorsque votre décision est nécessaire, elle vous appartient."
  Why justified: It accurately reflects the product direction, subject to implementation proof.

- Surface: Release notes.
  Seed: "Nous avons retiré des automatisations d'interface tierce pour renforcer la transparence, le contrôle utilisateur et la compatibilité avec les règles des plateformes."
  Why justified: It explains the tradeoff without disclosing evasion-oriented detail.

## Supporting Source Notes

### Internal Change Narrative

- Before: Android WebViews included automatic consent interactions and anti-detection behavior.
- After: The intended distributable product direction removes those mechanisms and requires compliant replacement architecture.
- Tradeoff chosen: Less invisible convenience in exchange for user control, platform compatibility, and a durable public-release path.
- Follow-up worth tracking: Implementation, legal/policy review, Data Safety accuracy, and final Android build/reviewer proof.

### Marketing Claims

- Safe claims: "user-controlled", "transparent", "explicit actions", "designed to respect platform rules" when backed by the released behavior.
- Claims to soften: "privacy-first", "secure", and "compliant" because each needs specific technical and legal proof.
- Claims to avoid: "undetectable", "works around platform restrictions", "automatically handles consent", "approved by every platform", and references to any private workaround build.

### Diffusion Map

- Canonical surface: Future public trust/privacy or FAQ surface, once declared and verified.
- Supporting surfaces: Release notes and product documentation.
- Repeated concept: SocialGlowz acts transparently and leaves privacy/account decisions to the user.
- Per-surface job: FAQ answers the user concern; release notes explain the change; technical docs retain audit history.
- Surfaces intentionally skipped: Advertising, SEO landing pages, social campaigns, and partnership claims.

### Handoff Checklist

- Must route: Confirm remediation is implemented before any public drafting.
- Should route: Validate privacy policy and Data Safety text against final runtime behavior.
- Optional: Add a trust-page section when a declared public surface exists.
- Deferred / blocked: Any public statement that claims Play approval, platform authorization, or completed compliance before evidence exists.
