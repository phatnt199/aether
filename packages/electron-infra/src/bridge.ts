import { IpcRendererEvent, ipcRenderer } from 'electron';

import { hrTimeToPerformance } from '@/utilities';

// ---------------------------------------------------------------------
const system = {
  performance: () => hrTimeToPerformance(),
};

// ---------------------------------------------------------------------
const preference = {};

// ---------------------------------------------------------------------
const ipc = {
  send: <T>(opts: { channel: string; payload: T }) => {
    return ipcRenderer.send(opts.channel, opts.payload);
  },
  invoke: <T>(opts: { channel: string; payload: T }) => {
    return ipcRenderer.invoke(opts.channel, opts.payload);
  },

  on: <T>(opts: {
    channel: string;
    listener: (event: IpcRendererEvent, payload: T) => void;
  }) => {
    return ipcRenderer.on(opts.channel, opts.listener);
  },
  once: <T>(opts: {
    channel: string;
    listener: (event: IpcRendererEvent, payload: T) => void;
  }) => {
    return ipcRenderer.on(opts.channel, opts.listener);
  },

  off: <T>(opts: {
    channel: string;
    listener?: (event: IpcRendererEvent, payload: T) => void;
  }) => {
    const { channel, listener } = opts;

    if (!listener) {
      return ipcRenderer.removeAllListeners(channel);
    }

    return ipcRenderer.off(channel, listener);
  },
  offAll: (opts: { channel: string }) => {
    return ipcRenderer.removeAllListeners(opts.channel);
  },
};

// ---------------------------------------------------------------------
export const buildBridge = (opts: {
  apiKey: string;
  extraScopes?: {
    [scope: string | symbol]: {
      [fn: string | symbol]: Function;
    };
  };
}) => {
  const { apiKey, extraScopes = {} } = opts;

  const scopes = Object.keys(extraScopes);
  if (
    scopes.includes('system') ||
    scopes.includes('preference') ||
    scopes.includes('ipc')
  ) {
    throw new Error(
      '[buildBridge] Invalid extra scope name! extra scope cannot be [system | preference | ipc]',
    );
  }

  return {
    apiKey: apiKey,
    routes: { system, preference, ipc, ...extraScopes },
  };
};
