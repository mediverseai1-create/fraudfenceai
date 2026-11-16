# Reference audit (sardine.ai) and adaptation notes

Audit date: 2026-11-16. Only publicly accessible pages were inspected. No login was attempted.

## What was inspected
- Homepage (full text, section structure, computed typography/colours).
- Navigation structure (Products, Industries, Agentic AI, Customers, Resources, About, Log in, Contact us).
- `/pricing` returns 404. The reference is sales-led with no public pricing.
- `dashboard.sardine.ai` is behind login. It was **not** inspected, so the in-app layout here is designed from the public product descriptions.

## Product concept (reference)
An "agentic risk platform" unifying fraud prevention, AML compliance and transaction monitoring for banks, merchants and fintechs.
Modules: device and behaviour signals, onboarding (KYC/KYB), payment/transaction fraud, cyber (ATO, bots), AML (transaction monitoring, customer risk rating, sanctions screening, case management), AI agents (investigation, rule assistant, SAR drafting), rules engine + ML, connections graph, consortium data.

## Visual direction observed
- Light, airy lavender-to-white gradient backgrounds; near-black navy ink text.
- Two-tone headline (muted grey-blue first clause, ink second clause).
- Medium-weight grotesque display face (fkGrotesk) plus Inter body.
- Dark pill buttons, thin borders, soft cards, mint accent on the dark top banner.
- Mega-menu grouped by Device / Onboarding / Fraud / Cyber / AML.

## Adaptation for FraudFenceAI (original)
Target user: risk and compliance teams at small fintechs, e-commerce merchants and payment startups that cannot afford an enterprise platform.

Modules implemented (all backed by Supabase, no mock data):
| Module | What it really does |
|---|---|
| Transaction screening | Deterministic scoring (velocity, amount anomaly, geo mismatch, device/email sharing, high-risk countries, disposable email, blocklists, custom rules) -> approve / review / decline. Single form, CSV bulk import, and REST API. |
| Rules engine | Org-defined rules (field, operator, value, points, action) evaluated server-side on every screening. |
| Customers and risk rating | Deterministic customer risk score and tier (country, PEP, sanctions hit, decline ratio). |
| Watchlists and sanctions screening | Customer-supplied lists (e.g. an OFAC export CSV, internal blocklists). Fuzzy name matching. No list is bundled. |
| Cases | Auto-created from review/decline decisions. Status workflow, notes, AI investigation summary. |
| AI investigator | Gemini interprets the deterministic findings. It never computes scores. |
| Connections graph | Clusters customers who share devices, emails or IPs. |
| Billing | Three plans with usage limits, Selar checkout links, webhook + admin activation. |

Copy, brand, and layout are original. No assets or text were taken from the reference.
