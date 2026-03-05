# Copilot Instructions

## Running Tests
To run tests for a specific module, use:

  npm run test --workspace <module>

For example, to test the backend module:

  npm run test --workspace backend

Replace "backend" with the desired module name to run tests for other modules.


## API Specification
Always consult and adhere to the API specification (see specs/openapi.yaml) when working with API endpoints, request/response types, or contracts. Ensure all changes, implementations, and tests are consistent with the spec.

## Frontend Testing and Accessibility
- All interactive and testable elements (buttons, inputs, loaders, etc.) must include a unique `data-testid` attribute for reliable selection in tests.
- Use descriptive and consistent values for `data-testid` (e.g., `data-testid="add-input-button"`, `data-testid="loader"`).
- Make sure every style contains a respective dark mode variant (e.g., `bg-white` should have a corresponding `dark:bg-surface`).
- If a dark mode variant is missing for a style, add it to the `index.css` or relevant stylesheet to ensure the application is fully functional and visually consistent in both light and dark modes.
- take a look at tailwind.cfg.js for the defined color palette and use those colors for dark mode variants to maintain a cohesive design.