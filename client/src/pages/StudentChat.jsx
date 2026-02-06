import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { chatAPI } from '../services/api';
import { createSocket } from '../services/socket';
import '../styles/StudentChat.css';

const MAX_MESSAGE_LENGTH = 5000;
const DUPLICATE_TIME_WINDOW_MS = 3000;

export default function StudentChat() {
  const { issueId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesRef = useRef(null);
  const socketRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const messageKeysRef = useRef(new Set());
  const typingIdleTimeoutRef = useRef(null);
  const typingStartAtRef = useRef(0);
  const typingStateRef = useRef(false);
  const typingIndicatorTimeoutRef = useRef(null);
  const fetchRequestIdRef = useRef(0);

  const canLoad = useMemo(() => Boolean(issueId) && Boolean(token), [issueId, token]);

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  const mapError = (err) => {
    const status = err?.response?.status;
    if (!canLoad) {
      return { type: 'missing', message: 'Chat link is incomplete. Use the full saved link.' };
    }
    if (status === 401 || status === 403) {
      return { type: 'unauthorized', message: 'This link is invalid or expired.' };
    }
    if (status === 404) {
      return { type: 'notfound', message: 'Chat not found.' };
    }
    return { type: 'network', message: 'Unable to load messages. Please try again.' };
  };

  const normalizeMessageId = useCallback((message) => {
    const id = message?.id;
    if (id === undefined || id === null) {
      return '';
    }
    return typeof id === 'string' ? id : String(id);
  }, []);

  const buildMessageKey = useCallback(
    (message) => `${message.senderType || 'unknown'}|${message.body || ''}|${message.createdAt || ''}`,
    []
  );

  const isFallbackDuplicate = useCallback((existing, incoming) => {
    if (!existing || !incoming) {
      return false;
    }
    if (existing.senderType !== incoming.senderType || existing.body !== incoming.body) {
      return false;
    }
    const existingTime = new Date(existing.createdAt).getTime();
    const incomingTime = new Date(incoming.createdAt).getTime();
    if (Number.isNaN(existingTime) || Number.isNaN(incomingTime)) {
      return false;
    }
    return Math.abs(existingTime - incomingTime) <= DUPLICATE_TIME_WINDOW_MS;
  }, []);

  const mergeMessages = useCallback(
    (existingMessages, incomingMessages) => {
      const merged = [...existingMessages];
      incomingMessages.forEach((incoming) => {
        const incomingId = normalizeMessageId(incoming);
        if (incomingId) {
          const idx = merged.findIndex((message) => normalizeMessageId(message) === incomingId);
          if (idx === -1) {
            merged.push(incoming);
          } else {
            merged[idx] = incoming;
          }
          return;
        }

        const hasFallbackDuplicate = merged.some((message) => {
          if (normalizeMessageId(message)) {
            return false;
          }
          return isFallbackDuplicate(message, incoming);
        });
        if (!hasFallbackDuplicate) {
          merged.push(incoming);
        }
      });

      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return merged;
    },
    [isFallbackDuplicate, normalizeMessageId]
  );

  const syncMessageIndex = useCallback(
    (items) => {
      messageIdsRef.current = new Set(items.map((message) => normalizeMessageId(message)).filter(Boolean));
      messageKeysRef.current = new Set(items.map(buildMessageKey));
    },
    [buildMessageKey, normalizeMessageId]
  );

  const appendMessage = useCallback((incoming) => {
    if (!incoming) {
      return;
    }
    setMessages((prev) => {
      const incomingId = normalizeMessageId(incoming);
      if (incomingId && messageIdsRef.current.has(incomingId)) {
        return prev;
      }

      if (!incomingId) {
        const hasFallbackDuplicate = prev.some((message) => {
          if (normalizeMessageId(message)) {
            return false;
          }
          return isFallbackDuplicate(message, incoming);
        });
        if (hasFallbackDuplicate) {
          return prev;
        }

        const fallbackKey = buildMessageKey(incoming);
        if (messageKeysRef.current.has(fallbackKey)) {
          return prev;
        }
        messageKeysRef.current.add(fallbackKey);
      }
      if (incomingId) {
        messageIdsRef.current.add(incomingId);
      }
      return [...prev, incoming];
    });
  }, [buildMessageKey, isFallbackDuplicate, normalizeMessageId]);

  const fetchMessages = async () => {
    if (!canLoad) {
      setLoading(false);
      const mapped = mapError(null);
      setErrorType(mapped.type);
      setError(mapped.message);
      return;
    }

    try {
      const requestId = fetchRequestIdRef.current + 1;
      fetchRequestIdRef.current = requestId;
      setLoading(true);
      const response = await chatAPI.getStudentMessages(issueId, token);
      const fetched = response.data.messages || [];
      if (fetchRequestIdRef.current === requestId) {
        setMessages((prev) => {
          const merged = mergeMessages(prev, fetched);
          syncMessageIndex(merged);
          return merged;
        });
      }
      setError('');
      setErrorType('');
    } catch (err) {
      const mapped = mapError(err);
      setErrorType(mapped.type);
      setError(mapped.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    syncMessageIndex([]);
    fetchRequestIdRef.current += 1;
  }, [issueId, token, syncMessageIndex]);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId, token]);

  useEffect(() => {
    if (!loading && !error) {
      scrollToBottom();
    }
  }, [messages, loading, error]);

  const emitTypingStart = () => {
    const socket = socketRef.current;
    if (!socket || !issueId || !token) {
      return;
    }
    socket.emit('typing:start', { issueId, token });
    typingStateRef.current = true;
    typingStartAtRef.current = Date.now();
  };

  const emitTypingStop = () => {
    const socket = socketRef.current;
    if (!socket || !issueId || !token) {
      return;
    }
    socket.emit('typing:stop', { issueId, token });
    typingStateRef.current = false;
  };

  const scheduleTypingStop = () => {
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
    }
    typingIdleTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 2000);
  };

  const handleTypingActivity = (value) => {
    const hasText = value.trim().length > 0;
    if (!hasText) {
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
      if (typingStateRef.current) {
        emitTypingStop();
      }
      return;
    }

    const now = Date.now();
    if (!typingStateRef.current || now - typingStartAtRef.current > 800) {
      emitTypingStart();
    }
    scheduleTypingStop();
  };

  useEffect(() => {
    if (!canLoad) {
      return undefined;
    }

    const socket = createSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', (message) => {
      appendMessage(message);
      requestAnimationFrame(scrollToBottom);
    });

    socket.on('typing:update', (payload) => {
      if (payload?.senderType !== 'counselor') {
        return;
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
      setIsOtherTyping(Boolean(payload?.isTyping));
      if (payload?.isTyping) {
        typingIndicatorTimeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false);
        }, 3000);
      }
    });

    socket.on('connect_error', () => {
      // Do not overwrite existing error states; REST fallback remains.
    });

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
      socket.emit('leave_issue', { issueId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new');
      socket.off('typing:update');
      socket.off('connect_error');
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [canLoad, issueId, token, appendMessage]);

  useEffect(() => {
    if (!canLoad || !socketConnected || !socketRef.current) {
      return;
    }

    socketRef.current.emit('join_issue', { issueId, token }, (ack) => {
      if (ack?.success === false) {
        setErrorType('unauthorized');
        setError(ack.message || 'This link is invalid or expired.');
      }
    });
  }, [canLoad, socketConnected, issueId, token]);

  const handleSend = async () => {
    const trimmed = messageBody.trim();
    if (!trimmed) {
      setError('Message body is required');
      setErrorType('validation');
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
      setErrorType('validation');
      return;
    }

    if (!canLoad) {
      setError('Chat link is incomplete. Use the full saved link.');
      setErrorType('missing');
      return;
    }

    try {
      setSending(true);
      const response = await chatAPI.createStudentMessage(issueId, token, trimmed);
      const newMessage = response.data.message;
      fetchRequestIdRef.current += 1;
      appendMessage(newMessage);
      setMessageBody('');
      setError('');
      setErrorType('');
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
      if (typingStateRef.current) {
        emitTypingStop();
      }
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      const mapped = mapError(err);
      setErrorType(mapped.type);
      setError(mapped.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMessageBody('');
      setError('');
      setErrorType('');
    }
  };

  return (
    <div className="student-chat-page">
      <div className="student-chat-card">
        <div className="student-chat-header">
          <div>
            <h1>Anonymous Chat</h1>
            <p>Continue your private conversation with a counsellor.</p>
          </div>
        </div>

        {loading && <div className="loading">Loading chat...</div>}

        {!loading && error && (
          <div className="student-chat-error">
            <p>{error}</p>
            {errorType === 'network' && (
              <button type="button" onClick={fetchMessages}>
                Retry
              </button>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="student-chat-messages" ref={messagesRef}>
              {isOtherTyping && <div className="student-chat-typing">Counsellor is typing...</div>}
              {messages.length === 0 ? (
                <div className="student-chat-empty">No messages yet. You can send a message below.</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`student-chat-message ${message.senderType === 'student' ? 'sent' : 'received'}`}
                  >
                    <div className="student-chat-bubble">
                      <p>{message.body}</p>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="student-chat-input">
              <textarea
                value={messageBody}
                onChange={(e) => {
                  const value = e.target.value;
                  setMessageBody(value);
                  handleTypingActivity(value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Write your message..."
                rows="3"
                disabled={sending}
              />
              <button type="button" onClick={handleSend} disabled={sending}>
                <Send aria-hidden="true" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
