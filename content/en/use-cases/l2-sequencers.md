---
title: "L2 Sequencer & Rollup Analysis"
description: "Design-level analysis for L2 sequencers and rollups"
---

# L2 Sequencers and Rollups

Sequencers and rollups sit between users and base layers, concentrating power over ordering, data availability, and fees. Their design must balance performance, fairness, and security.

---

## Risks we analyze

- **Ordering policies** that create unbounded MEV or unfair outcomes
- **Data availability or validity assumptions** that break under network stress
- **Upgrade and governance mechanisms** that introduce centralization or opaque control

---

## What Inferara checks

- Formal descriptions of sequencing and batching logic, including ordering rules
- Assumptions and guarantees around data availability, fraud proofs, or validity proofs
- Game-theoretic impact of fee and incentive structures on sequencer behavior

---

## Deliverables

- Structured model of the L2 protocol flow (from user transaction to L1 finality)
- Analysis of key risks with focus on ordering, censorship, and data assumptions
- Recommendations on sequencing rules, governance limits, and monitoring

---

## Inputs needed

- High-level documentation for the rollup or L2
- Details on sequencer selection, incentives, and failover mechanisms
- Access to code repositories or specifications for core components

---

<section class="ds-cta" style="margin: var(--ds-space-10) 0;">
  <h2 class="ds-cta__title">Ready to analyze your L2 design?</h2>
  <p class="ds-cta__body">Share your rollup architecture and we'll help identify ordering and data risks.</p>
  <div class="ds-cta__actions">
    <a href="/en/contact/#request-analysis" class="button ds-button">Request L2 Analysis</a>
    <a href="/en/papers/" class="button ds-button ds-button--secondary">Read our computation models research</a>
  </div>
</section>
