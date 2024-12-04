import { store } from 'hybrids';

export const ConnectedUsers = {
  id: true,
  type: 'spectator',
  socketId: '',
  name: '',
  pos: { x: 0, y: 0, d: 0 },
  style: '',
  score: { kills: 0, deaths: 0 },
  exploding: false,
};

export const getUser = (socketId) =>
  store.get([ConnectedUsers]).find((u) => u.socketId == socketId);

export const removeUser = (socketId) => {
  const user = getUser(socketId);

  // Delete the value in storage.
  if (user) {
    store.set(user, null);
  }
};

export const storeUser = (socketId, user, type = 'player') => {
  let existingUser = getUser(socketId);

  if (existingUser) {
    // Update existing.
    store.set(existingUser, user);
  } else {
    // Store new.
    store.set(ConnectedUsers, { ...user, type, socketId });
  }
};
