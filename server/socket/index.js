const { Server } = require('socket.io');
const { authorizeStudentToken, authorizeCounselorIssue } = require('../services/chatService');
const { verifyJwtToken } = require('../middleware/authMiddleware');

let ioInstance = null;

const buildCorsOptions = () => {
  const rawOrigins = process.env.CLIENT_ORIGIN || '';
  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: origins.length > 0 ? origins : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  };
};

const resolveJwtToken = (socket) => {
  const authHeader = socket.handshake.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (typeof socket.handshake.auth?.token === 'string') {
    return socket.handshake.auth.token;
  }
  if (typeof socket.handshake.query?.token === 'string') {
    return socket.handshake.query.token;
  }
  return null;
};

const resolveSocketRole = async ({ issueId, token, socket }) => {
  const studentToken = typeof token === 'string' ? token : null;
  if (studentToken) {
    await authorizeStudentToken(issueId, studentToken);
    return { role: 'student' };
  }

  const jwtToken = resolveJwtToken(socket);
  const decoded = verifyJwtToken(jwtToken);
  await authorizeCounselorIssue(issueId, decoded.id);
  return { role: 'counselor', counselorId: decoded.id };
};

const initSocketServer = (httpServer) => {
  const corsOptions = buildCorsOptions();
  if (corsOptions.origin === '*') {
    corsOptions.credentials = false;
  }

  ioInstance = new Server(httpServer, { cors: corsOptions });

  ioInstance.on('connection', (socket) => {
    socket.on('join_issue', async (payload = {}, ack) => {
      try {
        const issueId = typeof payload.issueId === 'string' ? payload.issueId : null;
        if (!issueId) {
          const error = new Error('issueId is required');
          error.status = 400;
          throw error;
        }

        const { role } = await resolveSocketRole({ issueId, token: payload.token, socket });
        socket.data.issueRoles = socket.data.issueRoles || {};
        socket.data.issueRoles[issueId] = role;
        socket.join(issueId);
        if (typeof ack === 'function') {
          ack({ success: true, room: issueId });
        }
      } catch (error) {
        const message = error.message || 'Not authorized to join issue';
        socket.emit('error', { message });
        if (typeof ack === 'function') {
          ack({ success: false, message });
        }
      }
    });

    socket.on('leave_issue', (payload = {}, ack) => {
      const issueId = typeof payload.issueId === 'string' ? payload.issueId : null;
      if (issueId) {
        socket.leave(issueId);
        if (socket.data.issueRoles && socket.data.issueRoles[issueId]) {
          delete socket.data.issueRoles[issueId];
        }
      }
      if (typeof ack === 'function') {
        ack({ success: true });
      }
    });

    socket.on('typing:start', async (payload = {}, ack) => {
      try {
        const issueId = typeof payload.issueId === 'string' ? payload.issueId : null;
        if (!issueId) {
          const error = new Error('issueId is required');
          error.status = 400;
          throw error;
        }

        if (!socket.rooms.has(issueId)) {
          const error = new Error('Not joined to this issue');
          error.status = 403;
          throw error;
        }

        const role =
          socket.data.issueRoles?.[issueId] ||
          (await resolveSocketRole({ issueId, token: payload.token, socket })).role;
        socket.to(issueId).emit('typing:update', { issueId, senderType: role, isTyping: true });
        if (typeof ack === 'function') {
          ack({ success: true });
        }
      } catch (error) {
        const message = error.message || 'Not authorized to type in issue';
        socket.emit('error', { message });
        if (typeof ack === 'function') {
          ack({ success: false, message });
        }
      }
    });

    socket.on('typing:stop', async (payload = {}, ack) => {
      try {
        const issueId = typeof payload.issueId === 'string' ? payload.issueId : null;
        if (!issueId) {
          const error = new Error('issueId is required');
          error.status = 400;
          throw error;
        }

        if (!socket.rooms.has(issueId)) {
          const error = new Error('Not joined to this issue');
          error.status = 403;
          throw error;
        }

        const role =
          socket.data.issueRoles?.[issueId] ||
          (await resolveSocketRole({ issueId, token: payload.token, socket })).role;
        socket.to(issueId).emit('typing:update', { issueId, senderType: role, isTyping: false });
        if (typeof ack === 'function') {
          ack({ success: true });
        }
      } catch (error) {
        const message = error.message || 'Not authorized to type in issue';
        socket.emit('error', { message });
        if (typeof ack === 'function') {
          ack({ success: false, message });
        }
      }
    });
  });

  return ioInstance;
};

const emitMessageNew = (issueId, payload) => {
  if (!ioInstance) {
    return;
  }
  ioInstance.to(issueId.toString()).emit('message:new', payload);
};

module.exports = {
  initSocketServer,
  emitMessageNew
};
