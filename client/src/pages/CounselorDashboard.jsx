import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, MessageSquare, ClipboardList, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueAPI, counselorAPI, chatAPI } from '../services/api';
import { createSocket } from '../services/socket';
import '../styles/CounselorDashboard.css';

const DUPLICATE_TIME_WINDOW_MS = 3000;

export default function CounselorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState('issues');
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesRef = useRef(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const messageKeysRef = useRef(new Set());
  const typingIdleTimeoutRef = useRef(null);
  const typingStartAtRef = useRef(0);
  const typingStateRef = useRef(false);
  const typingIndicatorTimeoutRef = useRef(null);
  const messagesRequestIdRef = useRef(0);

  useEffect(() => {
    if (!user) {
      navigate('/counselor-login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    filterIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, statusFilter, categoryFilter]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollChatToBottom();
    }
  }, [messages, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, statsRes] = await Promise.all([
        issueAPI.getAllIssues(),
        counselorAPI.getStats(user._id)
      ]);
      setIssues(issuesRes.data.issues);
      setStats(statsRes.data.stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = useCallback(async () => {
    try {
      setThreadsLoading(true);
      const response = await chatAPI.getCounselorThreads();
      setThreads(response.data.threads || []);
      setThreadsError('');
    } catch (err) {
      setThreadsError(err.response?.data?.message || 'Failed to load chat threads');
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchThreads();
    }
  }, [activeTab, fetchThreads]);

  const fetchMessages = async (issueId) => {
    try {
      const requestId = messagesRequestIdRef.current + 1;
      messagesRequestIdRef.current = requestId;
      setMessagesLoading(true);
      const response = await chatAPI.getCounselorMessages(issueId);
      const fetched = response.data.messages || [];
      if (messagesRequestIdRef.current === requestId) {
        setMessages((prev) => {
          const merged = mergeMessages(prev, fetched);
          syncMessageIndex(merged);
          return merged;
        });
        setMessageError('');
      }
    } catch (err) {
      setMessageError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;
    if (statusFilter) {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    if (categoryFilter) {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }
    setFilteredIssues(filtered);
  };

  const toKebab = (value) => value.toLowerCase().replace(/\s+/g, '-');
  const formatTime = (value) => {
    if (!value) {
      return '';
    }
    return new Date(value).toLocaleString();
  };

  const getThreadLabel = (thread) => {
    if (thread?.anonId) {
      return `Student ${thread.anonId.slice(-6)}`;
    }
    if (thread?.issueId) {
      return `Student ${thread.issueId.slice(-6)}`;
    }
    return 'Student';
  };

  const handleAssignIssue = async (issueId) => {
    try {
      await issueAPI.assignIssue(issueId, user._id);
      fetchData();
      alert('Issue assigned to you successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign issue');
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      setResponding(true);
      await issueAPI.addResponse(selectedIssue._id, response);
      setResponse('');
      setSelectedIssue(null);
      fetchData();
      alert('Response submitted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const handleSelectThread = (thread) => {
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
    }
    if (typingStateRef.current) {
      emitTypingStop();
    }
    setSelectedThread(thread);
    setMessages([]);
    setMessageBody('');
    setMessageError('');
    setIsOtherTyping(false);
    messageIdsRef.current = new Set();
    messageKeysRef.current = new Set();
    messagesRequestIdRef.current += 1;
    if (thread?.issueId) {
      fetchMessages(thread.issueId);
    }
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

  const syncMessageIndex = useCallback(
    (items) => {
      messageIdsRef.current = new Set(items.map((message) => normalizeMessageId(message)).filter(Boolean));
      messageKeysRef.current = new Set(items.map(buildMessageKey));
    },
    [buildMessageKey, normalizeMessageId]
  );

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

  const updateThreadPreview = useCallback((issueId, incoming) => {
    if (!issueId || !incoming) {
      return;
    }
    setThreads((prev) =>
      prev.map((thread) =>
        thread.issueId === issueId
          ? { ...thread, lastMessage: incoming.body, lastMessageAt: incoming.createdAt }
          : thread
      )
    );
  }, []);

  const emitTypingStart = () => {
    const socket = socketRef.current;
    const issueId = selectedThread?.issueId;
    if (!socket || !issueId) {
      return;
    }
    socket.emit('typing:start', { issueId });
    typingStateRef.current = true;
    typingStartAtRef.current = Date.now();
  };

  const emitTypingStop = () => {
    const socket = socketRef.current;
    const issueId = selectedThread?.issueId;
    if (!socket || !issueId) {
      return;
    }
    socket.emit('typing:stop', { issueId });
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

  const handleSendMessage = async () => {
    const trimmed = messageBody.trim();
    if (!trimmed) {
      setMessageError('Message body is required');
      return;
    }
    if (trimmed.length > 5000) {
      setMessageError('Message body must be 5000 characters or fewer');
      return;
    }

    if (!selectedThread?.issueId) {
      setMessageError('Select a thread before sending a message');
      return;
    }

    try {
      setSendingMessage(true);
      const response = await chatAPI.createCounselorMessage(selectedThread.issueId, trimmed);
      const newMessage = response.data.message;
      messagesRequestIdRef.current += 1;
      appendMessage(newMessage);
      setMessageBody('');
      setMessageError('');
      updateThreadPreview(selectedThread.issueId, newMessage);
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
      if (typingStateRef.current) {
        emitTypingStop();
      }
    } catch (err) {
      setMessageError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleChatKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMessageBody('');
      setMessageError('');
    }
  };

  const scrollChatToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!user || activeTab !== 'chat') {
      if (socketRef.current) {
        const socket = socketRef.current;
        const activeRoom = activeRoomRef.current;
        if (activeRoom) {
          socket.emit('leave_issue', { issueId: activeRoom });
        }
        socket.off('connect');
        socket.off('disconnect');
        socket.off('message:new');
        socket.off('typing:update');
        socket.disconnect();
        socketRef.current = null;
        activeRoomRef.current = null;
        setSocketConnected(false);
      }
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return undefined;
    }

    const socket = createSocket(token);
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketConnected(true);
      if (activeRoomRef.current) {
        socket.emit('join_issue', { issueId: activeRoomRef.current }, (ack) => {
          if (ack?.success === false) {
            setMessageError(ack.message || 'Unable to join chat');
          }
        });
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', (message) => {
      const activeIssueId = activeRoomRef.current;
      appendMessage(message);
      updateThreadPreview(activeIssueId, message);
      requestAnimationFrame(scrollChatToBottom);
    });
    socket.on('typing:update', (payload) => {
      if (payload?.senderType !== 'student') {
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

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      const activeRoom = activeRoomRef.current;
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
      if (activeRoom) {
        socket.emit('leave_issue', { issueId: activeRoom });
      }
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new');
      socket.off('typing:update');
      socket.disconnect();
      socketRef.current = null;
      activeRoomRef.current = null;
      setSocketConnected(false);
    };
  }, [user, activeTab, appendMessage, updateThreadPreview]);

  useEffect(() => {
    if (activeTab !== 'chat') {
      return;
    }

    const nextRoom = selectedThread?.issueId || null;
    const currentRoom = activeRoomRef.current;
    activeRoomRef.current = nextRoom;

    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    if (currentRoom && currentRoom !== nextRoom) {
      socket.emit('leave_issue', { issueId: currentRoom });
    }

    if (socket.connected && nextRoom && currentRoom !== nextRoom) {
      socket.emit('join_issue', { issueId: nextRoom }, (ack) => {
        if (ack?.success === false) {
          setMessageError(ack.message || 'Unable to join chat');
        }
      });
    }
  }, [selectedThread?.issueId, activeTab, socketConnected]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
            <p>Welcome, {user.name}</p>
          </div>
          <button
            type="button"
            className={`sidebar-link ${activeTab === 'issues' ? 'active' : ''}`}
            onClick={() => setActiveTab('issues')}
          >
            <ClipboardList aria-hidden="true" />
            Issues
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare aria-hidden="true" />
            Chat
          </button>
        </aside>

        <div className="dashboard-content">
          {error && activeTab === 'issues' && <div className="error-message">{error}</div>}

          {activeTab === 'issues' && (
            <div className="issues-page">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Resolved Issues</h3>
                  <p className="stat-number">{stats?.resolvedIssues || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Pending Issues</h3>
                  <p className="stat-number">{stats?.pendingIssues || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Handled</h3>
                  <p className="stat-number">{stats?.totalHandled || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Specialization</h3>
                  <p className="spec-text">{user.specialization}</p>
                </div>
              </div>

              <div className="issues-section">
                <h2>Issues</h2>

                <div className="filters">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Personal">Personal</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Financial">Financial</option>
                    <option value="Relationship">Relationship</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="no-issues">No issues found</div>
                ) : (
                  <div className="issues-list">
                    {filteredIssues.map((issue) => (
                      <div key={issue._id} className="issue-item">
                        <div className="issue-header">
                          <h3>{issue.title}</h3>
                          <span className={`status-badge status-${toKebab(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                        <p className="issue-category">Category: <strong>{issue.category}</strong></p>
                        <p className="issue-description">{issue.description.substring(0, 100)}...</p>
                        <div className="issue-meta">
                          <span>Anonymous ID: {issue.anonId}</span>
                          <span>Severity: <strong>{issue.severity}</strong></span>
                        </div>
                        <div className="issue-actions">
                          {issue.status === 'Open' && (
                            <button
                              onClick={() => handleAssignIssue(issue._id)}
                              className="btn-assign"
                            >
                              Assign to Me
                            </button>
                          )}
                          {issue.status === 'Assigned' && issue.assignedCounselor?._id === user._id && (
                            <button
                              onClick={() => setSelectedIssue(issue)}
                              className="btn-respond"
                            >
                              View & Respond
                            </button>
                          )}
                          {issue.status === 'Resolved' && (
                            <span className="resolved-badge">
                              <CheckCircle aria-hidden="true" />
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="chat-page">
              <div className="chat-section">
                <div className="chat-list">
                <div className="chat-list-header">
                  <h2>Chat Threads</h2>
                </div>
                {threadsError && <div className="error-message">{threadsError}</div>}
                {threadsLoading ? (
                  <div className="loading">Loading threads...</div>
                ) : threads.length === 0 ? (
                  <div className="no-issues">No chat threads yet</div>
                ) : (
                  <div className="chat-thread-list">
                    {threads.map((thread) => (
                      <button
                        key={thread.issueId}
                        type="button"
                        className={`chat-thread ${selectedThread?.issueId === thread.issueId ? 'active' : ''}`}
                        onClick={() => handleSelectThread(thread)}
                      >
                        <div className="chat-thread-title">{getThreadLabel(thread)}</div>
                        <div className="chat-thread-meta">
                          <span>{thread.lastMessage || 'No messages yet'}</span>
                          <span>{formatTime(thread.lastMessageAt || thread.updatedAt || thread.createdAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                </div>

                <div className="chat-panel">
                {selectedThread ? (
                  <>
                    <div className="chat-panel-header">
                      <div>
                        <h3>{getThreadLabel(selectedThread)}</h3>
                        <p>Issue ID: {selectedThread.issueId}</p>
                      </div>
                    </div>

                    {messageError && <div className="error-message">{messageError}</div>}

                    <div className="chat-messages" ref={messagesRef}>
                      {isOtherTyping && <div className="chat-typing">Student is typing...</div>}
                      {messagesLoading ? (
                        <div className="loading">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="no-issues">No messages yet</div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`chat-message ${message.senderType === 'counselor' ? 'sent' : 'received'}`}
                          >
                            <div className="chat-bubble">
                              <p>{message.body}</p>
                              <span>{formatTime(message.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="chat-input">
                      <textarea
                        value={messageBody}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMessageBody(value);
                          handleTypingActivity(value);
                        }}
                        onKeyDown={handleChatKeyDown}
                        placeholder="Write a message..."
                        rows="3"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sendingMessage}
                      >
                        <Send aria-hidden="true" />
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="chat-empty">Select a thread to view messages</div>
                )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedIssue.title}</h2>
              <button onClick={() => setSelectedIssue(null)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="issue-details">
                <p><strong>Anonymous ID:</strong> {selectedIssue.anonId}</p>
                <p><strong>Category:</strong> {selectedIssue.category}</p>
                <p><strong>Severity:</strong> {selectedIssue.severity}</p>
                <div className="description-box">
                  <strong>Description:</strong>
                  <p>{selectedIssue.description}</p>
                </div>
              </div>

              <div className="response-form">
                <h3>Your Response</h3>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your counseling response here..."
                  rows="8"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedIssue(null)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={responding}
                className="btn-submit"
              >
                {responding ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
