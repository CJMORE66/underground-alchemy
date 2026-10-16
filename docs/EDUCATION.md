# CAISIK Learning Studio

The `#learn` section provides seven compact lessons in Czech and English. Each lesson combines a short account of the book's idea, an original everyday example, a controllable visual exercise, a misconception explanation, an objective question with feedback, and a practical reflection prompt.

## Historical and scientific framing

The current interface identifies *The Kybalion* as a modern text published in 1908 under the name Three Initiates, rather than a surviving ancient Egyptian book. It distinguishes the book's philosophical “universal laws” from experimentally established laws of physics. Examples, visual models and reflection questions are explicitly contemporary interpretations; they do not validate the book's metaphysical claims.

The sources linked by the current `dist/learn.js` are:

- [The Kybalion, Project Gutenberg: original text, including chapter II](https://www.gutenberg.org/cache/epub/14209/pg14209-images.html).
- [The Kybalion, Internet Archive: digitised edition catalogued as 1908](https://archive.org/details/kybalionstudyofh00thre).

## Seven interactions

| Lesson | Historical idea and current metaphor | Actual exercise | Practical reflection |
| --- | --- | --- | --- |
| Mentalism | The book gives mind a foundational role. The contemporary example distinguishes an object from its interpretation. | Switch the label of an unchanged geometric shape. | Reframe the description of an unfinished project and identify a concrete next step without denying facts. |
| Correspondence | The book proposes similarities across levels of existence. The design example treats analogy as a question to investigate. | Resize repeated geometric patterns. | Identify what would need a fresh test when scaling an idea into a larger project. |
| Vibration | The book invokes metaphysical vibrations. The interface instead manipulates an observable drawing parameter. | Change the number of repetitions in a drawn wave. | Change repetition density in a drawing or beat and name what can actually be observed. |
| Polarity | The book treats some opposites as degrees of one phenomenon. The example uses a visible range of tones. | Move through shades between black and white. | Find and compare an intermediate option in a creative choice. |
| Rhythm | The book emphasises cycles and alternating movement. The metaphor illustrates phases without forecasting events. | Position a drawn pendulum manually. | Identify a repeatable work step and the evidence needed before calling it a regular cycle. |
| Cause and effect | The book describes chains of causes and effects. The example distinguishes dependencies from proof of causation. | Advance a four-step print workflow; additionally explore the branching dependency graph below. | Identify two inputs to a desired result and another possible explanation for an unexpected outcome. |
| Creative principle / historical Gender | The book uses historical “masculine” and “feminine” terminology. The current interpretation concerns receiving influences and actively forming a composition. | Switch between separate influences and a composed symbol. | Name an influence to receive and a creative decision to make. Both activities are available to anyone. |

The lessons do not diagnose personality, measure consciousness, predict life events, assign gender roles, or claim that thoughts guarantee external results. A visual similarity or event sequence is not presented as sufficient evidence of a shared mechanism or causation.

## Branching dependency graph

In the cause-and-effect lesson, `dist/education-v7.js` adds a labelled SVG with six nodes. Fabric preparation and artwork placement converge at printing; inspection then branches to revision or acceptance. Three native controls change the two preparation inputs and the inspection result (`pending`, `revise`, `accept`).

Both preparation inputs are required in this deliberately simplified model. Selecting acceptance cannot bypass a missing input. With both ready, an uncompleted inspection holds the acceptance path; revision and acceptance illuminate their respective branches. Feedback explains the current dependencies. This is a workflow illustration, not a print-quality prediction, material measurement, or proof of a universal causal law.

## Progress, notes and privacy

- `dist/learn.js` saves the chosen language, active lesson and correctly completed lessons in the browser's `caisik-learning` local-storage key. An incorrect answer does not advance progress. Storage failure falls back to the current visit.
- Reflection notes are optional, limited to 1,200 characters and retained per lesson only in JavaScript page memory. They survive lesson and language changes within that page. This feature performs no network transmission and writes no notes to local storage or session storage. Reloading the page discards them.
- Each note has a clear button. The shared `caisik-learning-reset` document event clears learning state and in-memory notes. The learning studio's own “Start again” button resets lesson progress; notes also have their separate explicit clear action.
- The enrichment observes only direct child-list changes on `#learn`, remounts after the base studio renders, and guards against duplicate instances. All controls have visible labels; tab navigation supports arrow keys, Home and End. Styles provide mobile layouts and reduced-motion alternatives.

## Verification performed

JavaScript syntax checks passed for `dist/learn.js` and `dist/education-v7.js`.

The independent Linkedom harness at `/workspace/scratch/50ee39693d80/caisik-qa/check-education-v7.cjs` passed checks using the actual lesson and enrichment scripts:

- Seven unique reflection prompts, Czech/English changes, and a single mounted reflection after repeated lesson renders.
- Notes retained across lesson/language changes, explicit clearing, no notes in persistent storage, clearing through the privacy-reset event, and empty notes in a fresh page instance.
- Twenty-four workflow combinations across both languages, six SVG nodes with accessible title/description, blocked acceptance when a prerequisite is absent, and correct revision/acceptance feedback.
- The graph appears only for cause and effect, and loading the enrichment twice does not duplicate it.

Additional VM checks passed the same 24 deterministic workflow states, confirmed the direct-child observer configuration and found no storage or network calls in the enrichment. These are syntax and DOM/model checks; they are not rendered-browser layout verification.
