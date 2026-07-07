# NexMeet Backend — Project Structure

```
nexmeet-backend/
├── server.js                  # Entry point: connects DB, starts HTTP + Socket.IO
├── app.js                     # Express app: middleware + route mounting
├── config/
│   └── db.js                  # Mongoose connection
├── models/
│   ├── Message.js              # Chat message schema
│   ├── Session.js              # Join/leave log schema
│   └── Room.js                  # Persisted room metadata schema
├── controllers/
│   ├── healthController.js
│   └── roomController.js       # Room info + message/session history endpoints
├── routes/
│   ├── healthRoutes.js
│   ├── roomRoutes.js
│   └── auth.js                  # <- your existing auth routes, paste in unchanged
├── middleware/
│   └── requireAuth.js           # <- your existing middleware, paste in unchanged
├── sockets/
│   ├── index.js                 # Creates io, attaches auth + handlers
│   ├── socketAuth.js            # io.use() handshake auth
│   ├── roomStore.js             # In-memory live room state (Map) — NOT persisted
│   └── handlers/
│       ├── roomHandlers.js      # join-room, kick-peer, disconnect, DB logging
│       ├── signalingHandlers.js # offer/answer/ice-candidate/media-state/screen-share/raise-hand
│       └── chatHandlers.js      # chat-message (emits live + saves to MongoDB)
├── jwt.js                       # <- your existing file, paste in unchanged
├── userStore.js                 # <- your existing file, paste in unchanged
└── .env.example
```

## Why split this way

- **In-memory vs MongoDB**: `sockets/roomStore.js` holds *live* room/peer state (who's connected right now). This should never touch the DB — it's gone the moment everyone leaves, by design. MongoDB (`models/`) holds the *durable* record: chat history, who joined/left and when, and room metadata that should survive a server restart.
- **Controllers vs sockets**: HTTP controllers (`controllers/`) answer one-off questions ("give me this room's chat history"). Socket handlers (`sockets/handlers/`) react to real-time events. Both read/write the same Mongoose models, so they never go out of sync.
- **One handler file per concern**: signaling (WebRTC plumbing), room lifecycle (join/leave/host), and chat are independent enough that bugs in one rarely touch the others.

## Setup

1. Copy all these files into your project, preserving the folder structure.
2. Move your existing `routes/auth.js`, `middleware/requireAuth.js`, `jwt.js`, and `userStore.js` into the matching folders (already referenced by these files, no changes needed).
3. `npm install express http socket.io cors mongoose dotenv uuid`
4. Copy `.env.example` to `.env` and fill in `MONGO_URI` and `JWT_SECRET`.
5. Run with `node server.js` (or add `"type": "module"` to `package.json` if not already set, since this uses ES modules).

## New HTTP endpoints added

- `GET /health` — now also reports live room count
- `GET /rooms/:roomId` — live peer count (unchanged behavior, moved to controller)
- `GET /rooms/:roomId/messages?limit=50` — chat history from MongoDB
- `GET /rooms/:roomId/sessions` — join/leave history from MongoDB
