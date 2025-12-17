---
title: "AMM Protocol Analysis"
description: "Design-level analysis for Automated Market Makers"
---

# Automated Market Makers (AMMs)

AMMs concentrate critical economic logic—pricing, fees, and liquidity incentives—into a small set of contracts. Small design mistakes here can have large, permanent consequences.

---

## Risks we analyze

- **Impermanent loss mechanisms** and fee schedules that create unintended incentives
- **Edge cases in price updates and rounding** that can be exploited by MEV or sandwich attacks
- **Liquidity and governance parameters** that allow a small set of actors to steer outcomes

---

## What Inferara checks

- Consistency of AMM invariants and pricing formulas under extreme market conditions
- Interaction between AMM logic and surrounding infrastructure (oracles, routing, liquidation bots)
- Game-theoretic behavior of rational and adversarial traders given your fee and reward structure

---

## Deliverables

- Formal or semi-formal description of the AMM mechanism (invariants, curves, parameter ranges)
- Written analysis of potential failure modes with example scenarios
- Recommendations on parameter choices, fee design, and governance controls

---

## Inputs needed

- Specification or documentation of the AMM design (curves, fees, parameters)
- References to existing deployments or similar mechanisms you are inspired by
- Access to relevant contracts or repositories (if available)

---

<section class="ds-cta" style="margin: var(--ds-space-10) 0;">
  <h2 class="ds-cta__title">Ready to analyze your AMM design?</h2>
  <p class="ds-cta__body">Share your protocol documentation and we'll propose a focused scope.</p>
  <div class="ds-cta__actions">
    <a href="/en/contact/#request-analysis" class="button ds-button">Request AMM Analysis</a>
    <a href="/en/research/" class="button ds-button ds-button--secondary">Read our research</a>
  </div>
</section>
