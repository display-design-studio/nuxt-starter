# Spec Delta

## Purpose

Let a project select its hosting provider while keeping one caching contract. Define provider selection, the boundary between provider-neutral caching logic and provider adapters, and how unsupported guarantees are reported.

## ADDED Requirements

### Requirement: The provider is selected explicitly at build time

The system SHALL read the cache provider from `NUXT_CACHE_PROVIDER`, accepting the providers that have an implemented adapter (currently `netlify`), and SHALL default to `netlify` when unset. An explicit selection SHALL determine the Nitro preset, and the selection SHALL determine the adapter used at runtime.

#### Scenario: Unset provider
- **WHEN** the project is built without `NUXT_CACHE_PROVIDER`
- **THEN** the Netlify adapter is used, Nitro's own preset detection or an explicit `NITRO_PRESET` (for example the Docker `node-server` build) is left untouched, and responses are identical to the behavior before this change

#### Scenario: Explicit provider
- **WHEN** the project is built with a supported `NUXT_CACHE_PROVIDER` and no `NITRO_PRESET`
- **THEN** that provider's Nitro preset is used

#### Scenario: Unknown provider
- **WHEN** the project is built with an unsupported `NUXT_CACHE_PROVIDER`
- **THEN** the build fails with a message listing the supported providers

#### Scenario: Contradictory preset
- **WHEN** the selected provider and an explicit `NITRO_PRESET` do not match
- **THEN** the build fails instead of choosing one silently

### Requirement: The caching contract is identical across providers

Dependency tags (`doc:<id>`, `collection:<type>`), normalization and limits, sticky no-store, request-local accumulation, preview isolation, anonymous published reads, and webhook classification SHALL behave identically for every provider. Only header names/values, route rules, and the purge call MAY differ.

#### Scenario: Same page, different providers
- **WHEN** the same published page is rendered under each supported provider
- **THEN** each response carries the same tag set under that provider's tag header, and errors and preview responses carry no tags and disable caching

### Requirement: Adapters declare the guarantees they can honor

Each adapter SHALL declare tag purge, durable shared retention, query-key restriction, and on-demand page retention as supported or not. A provider lacking tag purge SHALL fail the build. The verification step SHALL assert every supported guarantee and SHALL report every unsupported one explicitly.

#### Scenario: Unsupported guarantee
- **WHEN** an adapter declares a guarantee unsupported
- **THEN** verification states that the guarantee is not provided for that provider and does not claim it passed

### Requirement: Webhook invalidation purges through the selected adapter

The signed revalidation endpoint SHALL keep its signature, age, payload, draft-ignoring, and tag-selection rules, and SHALL purge the computed tags through the selected adapter. Any purge failure SHALL return a retryable 503 without exposing provider errors or credentials.

#### Scenario: Purge failure on any provider
- **WHEN** the provider purge call fails or is rate limited
- **THEN** the endpoint returns 503 and does not acknowledge success

#### Scenario: Missing purge credentials
- **WHEN** the selected provider's purge credentials are not configured
- **THEN** the endpoint fails with a server error and never reports a purge as completed

### Requirement: Netlify behavior is preserved

Under the Netlify provider the response headers, route rules, tags, vary headers, and purge behavior SHALL equal those produced before this change.

#### Scenario: Netlify regression
- **WHEN** the existing compiled-build verification runs with the Netlify provider
- **THEN** all of its current assertions pass unchanged

### Requirement: Verification runs per provider

The synthetic compiled-build verification and CI SHALL run for each supported provider using stubbed Sanity and stubbed purge calls, with no external requests. Real CDN validation SHALL remain a documented, separately authorized checklist.

#### Scenario: Provider matrix in CI
- **WHEN** CI runs
- **THEN** the compiled build is verified once per supported provider and a failure in any provider fails the check
