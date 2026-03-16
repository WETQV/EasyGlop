# EasyGlop

EasyGlop is a small multiplayer 3D shooter built with Three.js, Socket.IO and Node.js. This version focuses on stable local development, a loud "YouTube Poop"-inspired UI style, and predictable loopback networking so the game still works on the same PC even when a VPN client is enabled.

## What changed

- Local launch flow is cleaner and easier to debug.
- Client assets are bundled correctly, so CSS and shader files no longer depend on broken manual paths.
- The menu, HUD and game-over screens now use a controlled chaotic visual theme instead of scattered inline styles.
- Client networking prefers `127.0.0.1` / `localhost` for same-machine play, which is the safest option with VPN enabled.

## Project layout

```text
EasyGlop/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |-- config/
|   |   |-- game/
|   |   |-- network/
|   |   `-- styles/
|   `-- webpack.config.js
|-- server/
|   `-- src/
|       |-- game/
|       `-- index.js
`-- shared/
```

## Install

```bash
npm run install-all
```

If dependencies are already present, you can skip this and just run the server/client scripts.

## Local development

Start the server:

```bash
cd server
npm start
```

Start the client in another terminal:

```bash
cd client
npm start
```

Open one of these URLs:

- [http://127.0.0.1:8080](http://127.0.0.1:8080)
- [http://localhost:8080](http://localhost:8080)

Preferred option: `127.0.0.1:8080`.

That keeps the entire client/server path on loopback, which is the least fragile option when a VPN client changes routes, DNS or interface priorities.

## If a VPN is enabled

For same-PC development:

- Keep the browser on `127.0.0.1` or `localhost`.
- Do not switch the client to your LAN IP unless you specifically want cross-device testing.
- The client will target `http://127.0.0.1:3000` during local dev by default.

## If a port is busy

Server:

- Default port is `3000`.
- If you see that the port is already busy, stop the previous Node process or launch with another port:

```bash
$env:PORT=3001
npm start
```

Client:

- Default webpack dev port is `8080`.

## Controls

- `W`, `A`, `S`, `D`: move
- Mouse move: look around
- Left click: lock pointer / shoot
- `Esc`: return to menu

## Visual mode

The current client theme is intentionally loud and chaotic:

- high-contrast panels
- crude arcade typography
- aggressive overlays
- short glitch-like event flashes

This style is configurable from the client config layer in [gameConfig.js](/D:/GIT_HYPER/EasyGlop/client/src/config/gameConfig.js).

## Production build

```bash
cd client
npm run build
```

The server serves files from `client/dist` when that build exists.

## License

MIT
