---
name: ui-stitch-integration
description: "Use when: Generates visually appealing, error-free UI screens using Stitch MCP, with seamless backend integration."
---

# UI Generation with Stitch MCP

This skill guides the AI to design and generate robust, visually appealing UI components using the Stitch MCP toolset, ensuring seamless backend integration.

## Workflow

1.  **Understand Requirements:** Analyze the user's prompt to determine the UI requirements, design system constraints, and backend integration points.
2.  **Design System Validation:** Check for existing design systems in the project using `list_design_systems` and apply or update them as needed (`apply_design_system`, `update_design_system`). Ensure the UI will be visually cohesive.
3.  **Screen Generation:** Use `generate_screen_from_text` to iteratively create the UI.
    *   Prompt the Stitch MCP model with high-level design goals (e.g., "visually appealing", "modern styling").
    *   Wait for the generation to complete and review output.
4.  **Error-Checking & Refinement:**
    *   Verify that the generated design aligns with the backend API or schema required (`supabase_schema.sql`, `backend/routers`).
    *   If adjustments are needed, use `edit_screens` and pass clear layout or component adjustments.
5.  **Integration Checkout:** Ensure generated screens are seamlessly integrable into the `apps/web` or `apps/mobile` frontend applications by validating import structures, layout wrapping, and necessary backend fetch patterns.

## Guidelines
- Always prioritize a visually appealing, unified design language across generated screens.
- Avoid repeating generic UI elements; adhere strictly to the project's design system constraints.
- Double-check API connections and data structures matching the Supabase and Python backend configurations to ensure an error-free runtime.
