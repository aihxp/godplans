# Product-form routing evaluation

Use godplans to plan a versioned data and machine-learning pipeline that trains
a demand forecast from warehouse snapshots and publishes a separate inference
API for an inventory service. The pipeline is the primary product. The API has
its own consumer contract and deployment artifact, so treat it as a secondary
form with independent completion evidence. There is no first-party web UI.

Take recommended defaults. Produce the complete godplans artifact set under
`.godplans/`, including `PLAN.mdx` and its executable validator companion. Do
not build the system.
