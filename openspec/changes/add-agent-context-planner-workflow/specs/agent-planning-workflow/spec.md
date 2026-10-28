# Spec Delta

## Purpose

Defines how agents acquire durable project knowledge, clarify incomplete work, and route planning through OpenSpec without modifying the product.

## ADDED Requirements

### Requirement: Agents load project context before planning
An agent SHALL read the project identity and operating rules in `AGENTS.md` plus every Markdown document present in `.context/` before substantive planning. Instructions SHALL be resolved in the order: current user request, `AGENTS.md`, `.context`, then the active OpenSpec change.

#### Scenario: Context directory contains an optional document
- **WHEN** a project adds another Markdown file under `.context/`
- **THEN** the agent includes that file in its planning context without requiring a new loading rule

#### Scenario: Sources provide conflicting guidance
- **WHEN** two context sources provide incompatible instructions
- **THEN** the agent follows the defined precedence and reports the conflict when it affects the plan

### Requirement: Incomplete project identity blocks substantive planning
The Planner SHALL stop before substantive planning when the project definition required by `AGENTS.md` is incomplete or when essential context cannot be established. It SHALL ask focused questions and propose exact replacement text, while the project owner retains ownership of changes to `AGENTS.md` and `.context/`.

#### Scenario: Derived project has no project definition
- **WHEN** the starter is used for a new project and its project identity has not been defined
- **THEN** the Planner asks for the missing identity and does not create an implementation plan

#### Scenario: Owner supplies the missing context
- **WHEN** the project owner answers the bootstrap questions
- **THEN** the Planner returns exact proposed context text without modifying owner-managed context files

### Requirement: Planner remains non-executing
The Planner SHALL inspect relevant repository state, clarify ambiguity, and divide work into ordered, verifiable tasks. It MUST NOT modify product code, runtime configuration, or owner-managed context, but MAY create or update OpenSpec planning artifacts.

#### Scenario: User requests a product change
- **WHEN** the Planner receives a sufficiently defined implementation request
- **THEN** it produces a decision-complete task breakdown or OpenSpec change and performs no product implementation

#### Scenario: Material ambiguity remains
- **WHEN** missing information would change scope, behavior, or acceptance criteria
- **THEN** the Planner asks focused questions before finalizing the plan

### Requirement: Substantive changes use OpenSpec
The Planner SHALL formalize features, refactors, and architectural decisions as OpenSpec changes. It MAY plan minor fixes and routine maintenance in chat when they do not alter a durable capability or architectural contract.

#### Scenario: Feature request is ready for planning
- **WHEN** the requested work adds or changes product behavior
- **THEN** the Planner creates or updates the relevant OpenSpec planning artifacts

#### Scenario: Maintenance task is minor
- **WHEN** a task is a narrow fix or routine maintenance with no durable behavioral or architectural change
- **THEN** the Planner may return an ordered plan without opening an OpenSpec change

### Requirement: Archived change retention is bounded
The repository SHALL retain at most the 10 most recent archived changes in the working tree. Active changes SHALL NOT count toward this limit, and an archived change MUST NOT be removed until its specification updates have been synchronized and verified.

#### Scenario: Archiving creates an eleventh retained archive
- **WHEN** a completed change is archived and the archive directory contains 11 changes
- **THEN** the oldest archived change is removed after its specification synchronization is verified

#### Scenario: Active changes exceed the archive limit
- **WHEN** the repository has any number of active changes and 10 archived changes
- **THEN** no active change is removed or counted against the archive retention limit

#### Scenario: Oldest archive is not safely synchronized
- **WHEN** the oldest archived change cannot be verified as synchronized into the durable specifications
- **THEN** pruning stops and the archive remains until the verification issue is resolved

### Requirement: Tool resources follow explicit activation rules
The agent SHALL treat the GitHub repository and documented project commands as canonical tools. A Figma resource SHALL remain optional and MUST be accessed only when the user explicitly requests Figma usage.

#### Scenario: No Figma board is configured
- **WHEN** the task does not explicitly request Figma
- **THEN** the missing board does not block planning

#### Scenario: User explicitly requests Figma
- **WHEN** the user asks the agent to use the configured Figma resource
- **THEN** the agent uses the documented board link or asks for it if it is absent

### Requirement: Soul context is optional
The base starter SHALL NOT require `SOUL.md`. Projects MAY add it or another context document when brand, experience, or editorial principles materially guide planning.

#### Scenario: Base starter has no soul document
- **WHEN** an agent loads the starter context
- **THEN** the absence of `SOUL.md` produces no warning or planning block
