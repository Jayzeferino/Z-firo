# Spec: Window Close Controls

## Objective
Provide visual and functional close buttons for both Spotlight (widget) mode and Dashboard (expanded) mode, allowing users to quit the frameless Zéfiro application.

## Tech Stack
- **Electron (Main process)**: `mainWindow.close()` to shut down the window and quit the app.
- **IPC**: New `window:close` IPC channel.
- **Renderer**: React action buttons in `App.jsx` and `Dashboard.jsx` top bars.

## Project Structure
- `src/main/preload.js` - Expose `closeWindow: () => ipcRenderer.send('window:close')`.
- `src/main/main.js` - Implement the `window:close` IPC event receiver to call `mainWindow.close()`.
- `src/renderer/App.jsx` - Add close button to the Spotlight search header bar.
- `src/renderer/components/Dashboard.jsx` - Add close button to the Dashboard header actions.

## Code Style
Matches existing styling with premium red highlights for close triggers.
```jsx
<button
  onClick={() => window.api.closeWindow()}
  className="p-1.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-300 ..."
>
  ...
</button>
```

## Success Criteria
- [ ] Spotlight search bar contains a close button that terminates the application.
- [ ] Dashboard header bar contains a close button next to the maximize action that terminates the application.
