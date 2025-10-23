import {
  CallClient,
  CallAgent,
  Call,
  DeviceManager,
  IncomingCall,
} from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import * as apiService from './apiService';
import { CallState } from '@/types/communication';

let callAgent: CallAgent | null = null;
let currentCall: Call | null = null;
let deviceManager: DeviceManager | null = null;
let lastIncomingCall: IncomingCall | null = null;
let listener: ((state: CallState) => void) | null = null;

export function onCallStateChange(cb: (state: CallState) => void) {
  listener = cb;
}

export function offCallStateChange() {
  listener = null;
}

function emit(state: CallState) {
  if (listener) listener(state);
}

function cleanupCall() {
  if (currentCall) {
    try {
      currentCall.hangUp({ forEveryone: true });
    } catch {}
    currentCall = null;
  }
}

function setupCallAgentEvents(agent: CallAgent) {
  agent.on('incomingCall', (e: { incomingCall: IncomingCall }) => {
    lastIncomingCall = e.incomingCall;
    // Use communicationUserId for callerId
    const callerId =
      (e.incomingCall.callerInfo?.identifier as any)?.communicationUserId || 'Unknown';
    emit({ type: 'incoming', connection: e.incomingCall, callerId });

    let accepted = false;
    e.incomingCall.on('callEnded', () => {
      currentCall = null;
      if (!accepted) {
        emit({ type: 'missed', callerId });
      } else {
        emit({ type: 'ended' });
      }
    });
  });
}

export async function registerInbound(baseUrl: string, Accesstoken : string): Promise<void> {
  if (callAgent) {
    callAgent.dispose();
    callAgent = null;
    cleanupCall();
  }
  const { token } = await apiService.fetchInboundToken(baseUrl, Accesstoken);
  const tokenCredential = new AzureCommunicationTokenCredential(token);

  const callClient = new CallClient();
  deviceManager = await callClient.getDeviceManager();
  if (deviceManager) {
    await deviceManager.askDevicePermission({ audio: true, video: false });
  }

  callAgent = await callClient.createCallAgent(tokenCredential, { displayName: 'userId' });
  setupCallAgentEvents(callAgent);
  emit({ type: 'registered' });
}

export async function registerOutbound(baseUrl: string, Accesstoken : string): Promise<void> {
  if (callAgent) return;
  const { token } = await apiService.fetchOutboundToken(baseUrl, Accesstoken);
  const tokenCredential = new AzureCommunicationTokenCredential(token);

  const callClient = new CallClient();
  deviceManager = await callClient.getDeviceManager();
  if (deviceManager) {
    await deviceManager.askDevicePermission({ audio: true, video: false });
  }

  callAgent = await callClient.createCallAgent(tokenCredential, { displayName: 'userId' });
  setupCallAgentEvents(callAgent);
  emit({ type: 'registered' });
}

export async function UnregisterInbound(): Promise<void> {
  if (callAgent) {
    callAgent.dispose();
    callAgent = null;
  }
  cleanupCall();
  emit({ type: 'unregistered' });
}

export async function startOutboundCall(to: string): Promise<void> {
  if (!callAgent) throw new Error('CallAgent not registered');
  cleanupCall();
  currentCall = await callAgent.startCall(
    [{ communicationUserId: to }],
    { audioOptions: { muted: false } }
  );
  emit({ type: 'active', connection: currentCall });

  currentCall.on('stateChanged', () => {
    if (currentCall && currentCall.state === 'Disconnected') {
      emit({ type: 'ended' });
      currentCall = null;
    }
  });
}

export async function acceptCall(): Promise<void> {
  if (lastIncomingCall) {
    currentCall = await lastIncomingCall.accept();
    emit({ type: 'active', connection: currentCall });

    currentCall.on('stateChanged', () => {
      if (currentCall && currentCall.state === 'Disconnected') {
        emit({ type: 'ended' });
        currentCall = null;
      }
    });
    lastIncomingCall = null;
  }
}

export function declineCall(): void {
  if (lastIncomingCall) {
    lastIncomingCall.reject();
    emit({ type: 'declined' });
    lastIncomingCall = null;
  }
}

export function hangup(): void {
  if (currentCall) {
    currentCall.hangUp({ forEveryone: true });
    emit({ type: 'ended' });
    currentCall = null;
  }
}

export function mute(mute: boolean): void {
  if (currentCall) {
    if (mute) {
      currentCall.mute();
      emit({ type: 'muted', isMuted: true });
    } else {
      currentCall.unmute();
      emit({ type: 'muted', isMuted: false });
    }
  }
}
