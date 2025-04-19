import { Server } from 'socket.io';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import UserLocation from '../models/UserLocation.js';
import Notification from '../models/Notification.js';
import { getDistance } from 'geolib';
import mongoose from 'mongoose';

const setupSocket = (io) => {
  const onlineUsers = new Map();
  const groupSockets = {};
  const viewingState = {};
  const distanceAlertCooldown = new Map();

  setInterval(async () => {
    try {
      for (const groupId in groupSockets) {
        const group = await Group.findById(groupId);
        if (group && Array.isArray(group.members)) {
          const updatedMembers = group.members.map((m) => ({
            ...m._doc,
            isOnline: onlineUsers.has(m.clerkId),
          }));
          io.to(groupId).emit('memberStatusUpdate', updatedMembers);
        }
      }
    } catch (err) {
      console.error('Periodic sync error:', err);
    }
  }, 10000);

  // Heartbeat check (every 5 seconds)
  setInterval(async () => {
    const now = Date.now();
    for (const [clerkId, data] of onlineUsers) {
      if (now - data.lastHeartbeat > 15000) {
        const groupIds = Array.from(data.groupIds);
        onlineUsers.delete(clerkId);
        delete viewingState[clerkId];
        for (const groupId of groupIds) {
          try {
            const group = await Group.findById(groupId);
            if (group && Array.isArray(group.members)) {
              const updatedMembers = group.members.map((m) => ({
                ...m._doc,
                isOnline: onlineUsers.has(m.clerkId),
              }));
              io.to(groupId).emit('memberStatusUpdate', updatedMembers);
            }
          } catch (err) {
            console.error(`Heartbeat error for group ${groupId}:`, err);
          }
        }
      }
    }
  }, 5000);

  io.on('connection', (socket) => {
    socket.on('heartbeat', ({ clerkId, groupId }) => {
      if (onlineUsers.has(clerkId)) {
        onlineUsers.get(clerkId).lastHeartbeat = Date.now();
      }
    });

    socket.on('join', async ({ clerkId, groupId }) => {
      try {
        const groupIdStr = groupId.toString();
        socket.join(groupIdStr);

        if (!onlineUsers.has(clerkId)) {
          onlineUsers.set(clerkId, { socketIds: new Set(), groupIds: new Set(), lastHeartbeat: Date.now() });
        }
        onlineUsers.get(clerkId).socketIds.add(socket.id);
        onlineUsers.get(clerkId).groupIds.add(groupIdStr);

        if (!groupSockets[groupIdStr]) groupSockets[groupIdStr] = [];
        if (!groupSockets[groupIdStr].includes(socket.id)) {
          groupSockets[groupIdStr].push(socket.id);
        }

        const group = await Group.findById(groupId);
        if (!group) {
          console.error(`Group not found: ${groupId}`);
          socket.emit('error', { message: 'Group not found' });
          return;
        }
        if (!group.members.some(m => m.clerkId === clerkId)) {
          console.error(`User ${clerkId} not in group ${groupId}`);
          socket.emit('error', { message: 'Not a member of this group' });
          socket.leave(groupIdStr);
          return;
        }

        // Emit memberStatusUpdate
        if (Array.isArray(group.members)) {
          const updatedMembers = group.members.map((m) => ({
            ...m._doc,
            isOnline: onlineUsers.has(m.clerkId),
          }));
          io.to(groupIdStr).emit('memberStatusUpdate', updatedMembers);
          io.to(groupIdStr).emit('groupUpdate', group); // Emit only to group members
        } else {
          socket.emit('error', { message: 'Invalid group data' });
          return;
        }

        // Update location
        const location = await UserLocation.findOneAndUpdate(
          { groupId, clerkId },
          { groupId, clerkId, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        io.to(groupIdStr).emit('locationUpdate', { ...location._doc, isOnline: onlineUsers.has(clerkId) });

        const groupLocations = await UserLocation.find({ groupId });
        io.to(groupIdStr).emit('groupLocations', groupLocations.map(loc => ({
          ...loc._doc,
          isOnline: onlineUsers.has(loc.clerkId),
        })));

        // Send pending notifications
        const notifications = await Notification.find({ userId: clerkId, groupId, isRead: false });
        notifications.forEach((notification) => {
          socket.emit('notification', {
            id: notification._id.toString(),
            senderId: notification.senderId,
            groupId: notification.groupId,
            senderName: notification.senderName,
            groupName: notification.groupName,
            message: notification.message,
            isRead: notification.isRead,
            priority: notification.priority,
            type: notification.type,
            time: notification.timestamp.toISOString(),
          });
        });
      } catch (err) {
        console.error('Join error:', err);
        socket.emit('error', { message: 'Failed to join group', error: err.message });
      }
    });

    socket.on('sendMessage', async ({ groupId, clerkId, clerkName, content }) => {
      try {
        const groupIdStr = groupId.toString();
        const message = new Message({ groupId, senderId: clerkId, senderName: clerkName, content });
        await message.save();
        io.to(groupIdStr).emit('receiveMessage', message);

        const group = await Group.findById(groupId);
        if (!group) return;
        const notifications = [];
        group.members.forEach((member) => {
          if (member.clerkId === clerkId) return;
          const isOnlineInGroup = onlineUsers.has(member.clerkId) && viewingState[member.clerkId] === groupIdStr;
          if (!isOnlineInGroup) {
            const notification = {
              userId: member.clerkId,
              groupId: groupIdStr,
              senderId: clerkId,
              senderName: clerkName,
              groupName: group.name,
              message: `New message from ${clerkName}: ${content}`,
              type: 'message',
              priority: 'medium',
            };
            notifications.push(notification);
            if (onlineUsers.has(member.clerkId)) {
              io.to(groupIdStr).emit('notification', {
                id: new mongoose.Types.ObjectId().toString(),
                ...notification,
                isRead: false,
                time: new Date().toISOString(),
              });
            }
          }
        });
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', { message: 'Failed to send message', error: err.message });
      }
    });

    socket.on('viewingGroup', ({ groupId, clerkId }) => {
      const groupIdStr = groupId.toString();
      viewingState[clerkId] = groupIdStr;
    });

    socket.on('updateLocation', async ({ groupId, clerkId, lat, lng }) => {
      try {
        const groupIdStr = groupId.toString();
        const location = await UserLocation.findOneAndUpdate(
          { groupId, clerkId },
          { lat, lng, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        io.to(groupIdStr).emit('locationUpdate', { ...location._doc, isOnline: onlineUsers.has(clerkId) });
        const groupLocations = await UserLocation.find({ groupId });
        io.to(groupIdStr).emit('groupLocations', groupLocations.map(loc => ({
          ...loc._doc,
          isOnline: onlineUsers.has(loc.clerkId),
        })));

        const group = await Group.findById(groupId);
        if (!group) return;
        const notifications = [];
        groupLocations.forEach((otherLoc) => {
          if (otherLoc.clerkId !== clerkId && otherLoc.lat && otherLoc.lng) {
            const distance = getDistance(
              { latitude: lat, longitude: lng },
              { latitude: otherLoc.lat, longitude: otherLoc.lng }
            );
            const alertKey = `${clerkId}-${otherLoc.clerkId}`;
            const lastAlert = distanceAlertCooldown.get(alertKey) || 0;
            if (distance > 1000 && Date.now() - lastAlert > 60000) {
              const member = group.members.find(m => m.clerkId === otherLoc.clerkId);
              const notification = {
                userId: otherLoc.clerkId,
                groupId: groupIdStr,
                senderId: clerkId,
                senderName: group.members.find(m => m.clerkId === clerkId)?.name,
                groupName: group.name,
                message: `You are ${distance}m away from ${group.members.find(m => m.clerkId === clerkId)?.name}`,
                type: 'distance',
                priority: 'high',
              };
              notifications.push(notification);
              io.to(groupIdStr).emit('distanceAlert', { clerkId, otherClerkId: otherLoc.clerkId, distance });
              io.to(groupIdStr).emit('notification', {
                id: new mongoose.Types.ObjectId().toString(),
                ...notification,
                isRead: false,
                time: new Date().toISOString(),
              });
              distanceAlertCooldown.set(alertKey, Date.now());
            }
          }
        });
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (err) {
        console.error('Update location error:', err);
      }
    });

    socket.on('requestStatusUpdate', async ({ groupId }) => {
      try {
        const groupIdStr = groupId.toString();
        const group = await Group.findById(groupId);
        if (!group) {
          console.error(`Group not found: ${groupId}`);
          return;
        }
        if (Array.isArray(group.members)) {
          const updatedMembers = group.members.map((m) => ({
            ...m._doc,
            isOnline: onlineUsers.has(m.clerkId),
          }));
          io.to(groupIdStr).emit('memberStatusUpdate', updatedMembers); // Broadcast to group
        }
      } catch (err) {
        console.error(`Error in requestStatusUpdate: ${err.message}`);
      }
    });

    socket.on('markNotificationRead', async ({ notificationId, clerkId }) => {
      try {
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        io.emit('notificationRead', { notificationId, clerkId });
      } catch (err) {
        console.error('Mark notification read error:', err);
        socket.emit('error', { message: 'Failed to mark notification as read', error: err.message });
      }
    });

    socket.on('disconnect', async () => {
      const clerkId = Array.from(onlineUsers.entries())
        .find(([_, data]) => data.socketIds.has(socket.id))?.[0];
      if (!clerkId) return;

      const userData = onlineUsers.get(clerkId);
      if (userData) {
        userData.socketIds.delete(socket.id);
        if (userData.socketIds.size === 0) {
          setTimeout(async () => {
            if (onlineUsers.has(clerkId) && onlineUsers.get(clerkId).socketIds.size === 0) {
              const groupIds = Array.from(userData.groupIds);
              onlineUsers.delete(clerkId);
              delete viewingState[clerkId];
              for (const groupId of groupIds) {
                try {
                  const group = await Group.findById(groupId);
                  if (group && Array.isArray(group.members)) {
                    const updatedMembers = group.members.map((m) => ({
                      ...m._doc,
                      isOnline: onlineUsers.has(m.clerkId),
                    }));
                    io.to(groupId).emit('memberStatusUpdate', updatedMembers);
                  }
                } catch (err) {
                  console.error('Disconnect error:', err);
                }
              }
            }
          }, 10000);
        }
      }

      for (const groupId in groupSockets) {
        groupSockets[groupId] = groupSockets[groupId].filter(id => id !== socket.id);
        if (groupSockets[groupId].length === 0) delete groupSockets[groupId];
      }
    });
  });
};

export default setupSocket;