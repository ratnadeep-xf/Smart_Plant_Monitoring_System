// Helper functions for device management and command queue
import prisma from '../lib/db';
import { sendToAll } from '../lib/realtime';

// Tracking device online status
const deviceStatus = new Map();

/**
 * Register a device heartbeat to track online status
 * @param {string} deviceId 
 * @param {object} metadata - Optional device metadata 
 */
export function updateDeviceStatus(deviceId, metadata = {}) {
  const now = new Date();
  
  // Check if this is a status change
  const wasOnline = isDeviceOnline(deviceId);
  
  // Update device status
  deviceStatus.set(deviceId, {
    lastSeen: now,
    online: true,
    ...metadata
  });
  
  // If this is a status change, emit event
  if (!wasOnline) {
    sendToAll('device_status', {
      deviceId,
      status: 'online',
      timestamp: now.toISOString()
    });
    
    // Record status change in database
    logDeviceStatus(deviceId, 'online');
  }
}

/**
 * Check if a device is considered online
 * @param {string} deviceId 
 * @param {number} timeoutSec - Seconds after which device is considered offline
 * @returns {boolean} Whether the device is online
 */
export function isDeviceOnline(deviceId, timeoutSec = 60) {
  const status = deviceStatus.get(deviceId);
  if (!status) return false;
  
  const now = new Date();
  const lastSeen = status.lastSeen;
  const diffSeconds = (now - lastSeen) / 1000;
  
  const online = diffSeconds < timeoutSec;
  
  // If device was online but is now offline, update status
  if (status.online && !online) {
    deviceStatus.set(deviceId, {
      ...status,
      online: false
    });
    
    // Emit offline event
    sendToAll('device_status', {
      deviceId,
      status: 'offline',
      timestamp: now.toISOString()
    });
    
    // Record status change in database
    logDeviceStatus(deviceId, 'offline');
  }
  
  return online;
}

/**
 * Record a device status change in the database
 * @param {string} deviceId 
 * @param {string} status - 'online' or 'offline'
 */
async function logDeviceStatus(deviceId, status) {
  try {
    await prisma.deviceStatus.create({
      data: {
        deviceId,
        status,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log device status:', error);
  }
}

/**
 * Queue a command for a device to execute
 * @param {string} deviceId 
 * @param {string} command - Command type
 * @param {object} params - Command parameters
 * @returns {Promise<object>} Command result
 */
export async function queueCommand(deviceId, command, params = {}) {
  try {
    // Create command record in database
    const cmd = await prisma.deviceCommand.create({
      data: {
        deviceId,
        command,
        params: JSON.stringify(params),
        status: 'queued',
        createdAt: new Date()
      }
    });
    
    // Emit command event for realtime subscribers
    sendToAll('device_command', {
      deviceId,
      commandId: cmd.id,
      command,
      params,
      status: 'queued',
      timestamp: cmd.createdAt.toISOString()
    });
    
    return {
      success: true,
      commandId: cmd.id,
      status: 'queued'
    };
    
  } catch (error) {
    console.error('Failed to queue command:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get pending commands for a device
 * @param {string} deviceId 
 * @returns {Promise<Array>} Pending commands
 */
export async function getDeviceCommands(deviceId) {
  try {
    const commands = await prisma.deviceCommand.findMany({
      where: {
        deviceId,
        status: 'queued'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return commands.map(cmd => ({
      id: cmd.id,
      command: cmd.command,
      params: JSON.parse(cmd.params),
      timestamp: cmd.createdAt.toISOString()
    }));
    
  } catch (error) {
    console.error('Failed to get device commands:', error);
    return [];
  }
}

/**
 * Update a command's status
 * @param {string} commandId 
 * @param {string} status - 'executing', 'completed', 'failed'
 * @param {object} result - Optional result data
 */
export async function updateCommandStatus(commandId, status, result = {}) {
  try {
    const cmd = await prisma.deviceCommand.update({
      where: { id: commandId },
      data: {
        status,
        result: JSON.stringify(result),
        completedAt: ['completed', 'failed'].includes(status) ? new Date() : null
      }
    });
    
    // Emit command update event
    sendToAll('command_update', {
      commandId,
      deviceId: cmd.deviceId,
      status,
      result,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to update command status:', error);
    return { success: false, error: error.message };
  }
}