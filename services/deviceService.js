// services/deviceService.js
import prisma from '../lib/prisma.js';

/**
 * Queue a command for a device
 * @param {Object} options - Command options
 * @param {string} options.deviceId - Device identifier
 * @param {string} options.type - Command type (e.g., "water")
 * @param {Object} options.payload - Command payload (e.g., { duration: 5 })
 * @returns {Promise<Object>} Created command
 */
export async function queueCommand({ deviceId, type, payload }) {
  try {
    const command = await prisma.command.create({
      data: {
        deviceId,
        type,
        payload: payload || {},
        status: 'pending',
      },
    });
    
    console.log(`Command queued for device ${deviceId}:`, {
      id: command.id,
      type: command.type,
      payload: command.payload,
    });
    
    return command;
  } catch (error) {
    console.error('Error queueing command:', error);
    throw error;
  }
}

/**
 * Get queued (pending) commands for a device
 * @param {string} deviceId - Device identifier
 * @returns {Promise<Array>} Array of pending commands
 */
export async function getQueuedCommands(deviceId) {
  try {
    const commands = await prisma.command.findMany({
      where: {
        deviceId,
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
    });
    
    console.log(`Retrieved ${commands.length} pending commands for device ${deviceId}`);
    return commands;
  } catch (error) {
    console.error('Error getting queued commands:', error);
    throw error;
  }
}

/**
 * Update command status
 * @param {string} commandId - Command ID
 * @param {string} status - New status ("completed", "failed", "cancelled")
 * @param {Object} result - Optional result data
 * @returns {Promise<Object>} Updated command
 */
export async function updateCommandStatus(commandId, status, result = null) {
  try {
    const updateData = {
      status,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
    };
    
    if (result) {
      updateData.result = result;
    }
    
    if (status === 'failed' && result?.error) {
      updateData.error = result.error;
    }
    
    const command = await prisma.command.update({
      where: { id: commandId },
      data: updateData,
    });
    
    console.log(`Command ${commandId} status updated to ${status}`);
    return command;
  } catch (error) {
    console.error('Error updating command status:', error);
    throw error;
  }
}

/**
 * Get a specific command by ID
 * @param {string} commandId - Command ID
 * @returns {Promise<Object|null>} Command or null if not found
 */
export async function getCommandById(commandId) {
  try {
    const command = await prisma.command.findUnique({
      where: { id: commandId },
    });
    return command;
  } catch (error) {
    console.error('Error getting command by ID:', error);
    throw error;
  }
}

/**
 * Delete old completed/failed commands (cleanup)
 * @param {number} daysOld - Delete commands older than this many days
 * @returns {Promise<number>} Number of deleted commands
 */
export async function cleanupOldCommands(daysOld = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await prisma.command.deleteMany({
      where: {
        status: {
          in: ['completed', 'failed', 'cancelled'],
        },
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    
    console.log(`Cleaned up ${result.count} old commands`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up old commands:', error);
    throw error;
  }
}
