import { store } from 'hybrids';

// Local memory only state model
export const ConnectedBots = {
  id: true,
  configId: '',
  socketId: '',
};

export const getConnectedBot = (configId) => {
  const bots = store.get([ConnectedBots]);

  try {
    return bots.find((b) => b.configId == configId);
  } catch (e) {
    // Ignore.
  }
  return null;
};

export const storeConnectedBot = (configId, bot) => {
  const existing = getConnectedBot(configId);
  store.set(existing || ConnectedBots, { configId, ...bot });
};

export const removeConnectedBot = (configId) => {
  const bot = getConnectedBot(configId);

  // Delete the value in storage.
  if (store.ready(bot)) {
    store.set(bot, null);
  }
};
