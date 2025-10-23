import { Device } from '@twilio/voice-sdk';
import * as apiService from './apiService';
import { CallState } from '@/types/communication';
import EventEmitter from 'events';
import { useEffect } from 'react';

let device: Device | null = null;
let currentConnection: any = null;
const eventEmitter = new EventEmitter();

export function onCallStateChange(cb: (state: CallState) => void) {
  eventEmitter.on('callstate', cb);
}

export function offCallStateChange(cb: (state: CallState) => void) {
  eventEmitter.off('callstate', cb);
}

function emit(state: CallState) {
  eventEmitter.emit('callstate', state);
}

function cleanupConnection() {
  if (currentConnection) {
    try {
      currentConnection.disconnect();
    } catch { }

  }
  currentConnection = null;
}

function setupDeviceEvents(dev: Device) {
  dev.removeAllListeners('incoming');
  dev.on('incoming', (conn: any) => {
    //if (currentConnection?.id === conn.id) return;
    cleanupConnection();
    currentConnection = conn;
    const callerId = conn.parameters?.From || conn.parameters?.callerId || 'Unknown';
    emit({ type: 'incoming', connection: conn, callerId });
    let accepted = false;
    conn.on('accept', () => {

      accepted = true;
      emit({ type: 'active', connection: conn })
    });
    conn.on('disconnect', () => {
      currentConnection = null;
      if (!accepted) {
        emit({ type: 'missed', callerId });
      } else {
        emit({ type: 'ended' });
      }
    });
    conn.on('cancel', () => {
      currentConnection = null;
      if (!accepted) {
        emit({ type: 'missed', callerId });
      } else {
        emit({ type: 'ended' });
      }
    });

    conn.on('mute', (isMuted: boolean) => emit({ type: 'muted', isMuted }));

    conn.on('reject', () => {
      currentConnection = null;
      if (!accepted) {
        emit({ type: 'missed', callerId });
      } else {
        emit({ type: 'declined' });
      }
    });

    conn.on('error', (error: any) => {
      console.error('Call error:', error);
      emit({ type: 'error', error })
    });
  });

  dev.on('registered', () => emit({ type: 'registered' }));
  dev.on('unregistered', () => emit({ type: 'unregistered' }));
  dev.on('error', (error: any) => {
    emit({ type: 'error', error });
    console.error('Call error:', error);
  });
}

export async function registerInbound(baseUrl: string, Accesstoken : string): Promise<void> {
  if (device) {
    device.destroy();
    device = null;
    cleanupConnection();
  }
  try{
  const { token } = await apiService.fetchInboundToken(baseUrl, Accesstoken);
  device = new Device(token);
  setupDeviceEvents(device);
  device.register();
  }
  catch(error)
  {
    emit({ type: 'error', error });
  }
}

export async function registerOutbound(baseUrl: string, Accesstoken : string): Promise<void> {
  if (device) {
    return;
  }
  try{
  const { token } = await apiService.fetchOutboundToken(baseUrl, Accesstoken);
  device = new Device(token);
  setupDeviceEvents(device);
  device.register();
  }
  catch(error)
  {
    emit({ type: 'error', error });
  }
}

export async function UnregisterInbound(): Promise<void> {
  if (device) {
    device.destroy();
    device = null;
  }
  cleanupConnection();
  emit({ type: 'unregistered' });
}

export async function startOutboundCall(to: string, memberId: string, baseApiUrl : string, token : string): Promise<void> {
  if (!device) throw new Error('Device not registered');
  cleanupConnection();
  currentConnection = await device.connect({ params: { To: to } });
  emit({ type: 'active', connection: currentConnection });
  currentConnection.on('mute', (isMuted: boolean) => emit({ type: 'muted', isMuted }));
  currentConnection.on('disconnect', () => {
    currentConnection = null;
    emit({ type: 'ended' });
  });
  currentConnection.on('cancel', () => {
    currentConnection = null;
    emit({ type: 'ended'});
  });
  currentConnection.on('error', (error: any) => emit({ type: 'error', error }));
  
  const intervalId = setInterval(() => {
    let callSid = currentConnection?.parameters?.CallSid

    if (callSid) {
      apiService.setAudioCallHistory(callSid, to, memberId, baseApiUrl, token);
      callSid = null; 
      clearInterval(intervalId);
    }
  }, 1000);
}

export function acceptCall(): void {

  if (currentConnection && currentConnection.status() === 'pending') {
    currentConnection.accept();
  }
}

export function declineCall(): void {
  if (currentConnection && typeof currentConnection.reject === 'function') {
    currentConnection.reject();
    currentConnection = null;
    emit({ type: 'declined' });
  }
}

export function hangup(): void {
  if (currentConnection && typeof currentConnection.disconnect === 'function') {
    currentConnection.disconnect();
    currentConnection = null;
    emit({ type: 'ended' });
  }
}

export function mute(mute: boolean): void {
  if (currentConnection && typeof currentConnection.mute === 'function') {
    currentConnection.mute(mute);
    emit({ type: 'muted', isMuted: mute });
}
}
