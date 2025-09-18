/* Flow — Messages System */
(function(){
  'use strict';
  const $  = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

  // Mock data for conversations and messages
  const conversations = [
    {
      id: 1,
      name: 'Oumarou Diallo',
      email: 'oumarou.diallo@example.com',
      type: 'student',
      avatar: '/assets/img/default-avatar.png',
      status: 'online',
      lastMessage: 'Thank you for reviewing my application. I wanted to clarify...',
      lastMessageTime: '2 min',
      unreadCount: 2,
      applicationId: 'APP-2025-001234'
    },
    {
      id: 2,
      name: 'Sarah K.',
      email: 'sarah.k@example.com',
      type: 'student',
      avatar: '/assets/img/default-avatar.png',
      status: 'away',
      lastMessage: 'Is there a deadline extension available for the personal statement?',
      lastMessageTime: '1 hour',
      unreadCount: 0,
      applicationId: 'APP-2025-001235'
    },
    {
      id: 3,
      name: 'Dr. Kwame Asante',
      email: 'kwame.asante@uaccra.edu',
      type: 'staff',
      avatar: '/assets/img/default-avatar.png',
      status: 'offline',
      lastMessage: 'The committee meeting has been rescheduled to tomorrow at 2 PM',
      lastMessageTime: 'Yesterday',
      unreadCount: 0
    },
    {
      id: 4,
      name: 'Emmanuel Kusi',
      email: 'emmanuel.kusi@example.com',
      type: 'student',
      avatar: '/assets/img/default-avatar.png',
      status: 'online',
      lastMessage: 'My transcript upload seems to have failed. Could you help?',
      lastMessageTime: '2 days',
      unreadCount: 1,
      applicationId: 'APP-2025-001236'
    }
  ];

  const messages = {
    1: [
      {
        id: 1,
        senderId: 1,
        senderName: 'Oumarou Diallo',
        content: 'Hello, thank you for reviewing my application for the Computer Science program. I wanted to clarify a few points about my academic background.',
        timestamp: new Date('2025-09-03T14:45:00'),
        type: 'received'
      },
      {
        id: 2,
        senderId: 1,
        senderName: 'Oumarou Diallo',
        content: 'I noticed that my transcript shows a gap year in 2023. This was because I was participating in a coding bootcamp and internship program that I believe adds value to my application.',
        timestamp: new Date('2025-09-03T14:46:00'),
        type: 'received'
      },
      {
        id: 3,
        senderId: 'me',
        senderName: 'You',
        content: 'Thank you for reaching out, Oumarou. That additional context about your gap year is very helpful and actually strengthens your application.',
        timestamp: new Date('2025-09-03T15:15:00'),
        type: 'sent'
      },
      {
        id: 4,
        senderId: 'me',
        senderName: 'You',
        content: 'Could you please submit a brief letter explaining the bootcamp and internship experience? You can upload it in the additional documents section of your application.',
        timestamp: new Date('2025-09-03T15:16:00'),
        type: 'sent'
      },
      {
        id: 5,
        senderId: 1,
        senderName: 'Oumarou Diallo',
        content: 'Absolutely! I\'ll prepare that letter and upload it by tomorrow. Thank you so much for the guidance.',
        timestamp: new Date('2025-09-03T16:20:00'),
        type: 'received'
      }
    ]
  };

  let currentConversationId = 1;
  let filteredConversations = [...conversations];
  let currentFilter = 'all';

  // Initialize
  function init() {
    renderConversations();
    loadConversation(currentConversationId);
    bindEvents();
    
    // Auto-resize textarea
    const messageTextarea = $('#messageInput');
    if (messageTextarea) {
      messageTextarea.addEventListener('input', autoResizeTextarea);
    }
  }

  // Render conversation list
  function renderConversations() {
    const conversationList = $('#conversationList');
    if (!conversationList) return;

    conversationList.innerHTML = filteredConversations.map(conv => {
      const statusClass = `conversation-status--${conv.status}`;
      const unreadClass = conv.unreadCount > 0 ? 'conversation-item--unread' : '';
      const activeClass = conv.id === currentConversationId ? 'conversation-item--active' : '';

      return `
        <div class="conversation-item ${unreadClass} ${activeClass}" data-id="${conv.id}">
          <div class="conversation-avatar">
            <img src="${conv.avatar}" alt="${conv.name}" width="40" height="40">
            <div class="conversation-status ${statusClass}"></div>
          </div>
          <div class="conversation-content">
            <div class="conversation-header">
              <h4 class="conversation-name">${conv.name}</h4>
              <time class="conversation-time">${conv.lastMessageTime}</time>
            </div>
            <p class="conversation-preview">${conv.lastMessage}</p>
            <div class="conversation-meta">
              <span class="conversation-type">${conv.type.charAt(0).toUpperCase() + conv.type.slice(1)}</span>
              ${conv.unreadCount > 0 ? `<span class="unread-count">${conv.unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Load conversation messages
  function loadConversation(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    const conversationMessages = messages[conversationId] || [];
    
    if (!conversation) return;

    // Update chat header
    updateChatHeader(conversation);
    
    // Render messages
    renderMessages(conversationMessages);
    
    // Mark conversation as read
    markConversationAsRead(conversationId);
    
    currentConversationId = conversationId;
  }

  // Update chat header with participant info
  function updateChatHeader(conversation) {
    const participantAvatar = $('.participant-avatar img');
    const participantName = $('.participant-info h3');
    const participantMeta = $('.participant-meta');
    const participantStatus = $('.participant-status');

    if (participantAvatar) participantAvatar.src = conversation.avatar;
    if (participantName) participantName.textContent = conversation.name;
    if (participantStatus) {
      participantStatus.className = `participant-status participant-status--${conversation.status}`;
    }
    
    if (participantMeta) {
      let metaText = `${conversation.type.charAt(0).toUpperCase() + conversation.type.slice(1)}`;
      if (conversation.applicationId) {
        metaText += ` • Application #${conversation.applicationId}`;
      }
      metaText += ` • ${conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}`;
      participantMeta.textContent = metaText;
    }
  }

  // Render messages in chat
  function renderMessages(conversationMessages) {
    const chatMessages = $('#chatMessages');
    if (!chatMessages) return;

    const messageGroups = groupMessagesBySender(conversationMessages);
    
    chatMessages.innerHTML = messageGroups.map(group => {
      const isSent = group.type === 'sent';
      const groupClass = isSent ? 'message-group--sent' : '';
      const headerClass = isSent ? 'message-header--sent' : '';
      const avatar = isSent ? '/assets/img/logo.png' : '/assets/img/default-avatar.png';
      
      return `
        <div class="message-group ${groupClass}">
          <div class="message-header ${headerClass}">
            ${!isSent ? `<img src="${avatar}" alt="${group.senderName}" class="message-avatar" width="32" height="32">` : ''}
            <span class="message-sender">${group.senderName}</span>
            <time class="message-time">${formatMessageTime(group.timestamp)}</time>
            ${isSent ? `<img src="${avatar}" alt="You" class="message-avatar" width="32" height="32">` : ''}
          </div>
          ${group.messages.map(msg => `
            <div class="message message--${msg.type}">
              <div class="message-content">
                <p>${msg.content}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Group consecutive messages from same sender
  function groupMessagesBySender(messages) {
    if (!messages.length) return [];
    
    const groups = [];
    let currentGroup = null;
    
    messages.forEach(message => {
      if (!currentGroup || currentGroup.senderId !== message.senderId) {
        currentGroup = {
          senderId: message.senderId,
          senderName: message.senderName,
          type: message.type,
          timestamp: message.timestamp,
          messages: []
        };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(message);
    });
    
    return groups;
  }

  // Format message timestamp
  function formatMessageTime(timestamp) {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    
    // Same day
    if (messageDate.toDateString() === now.toDateString()) {
      return `Today at ${messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    return messageDate.toLocaleDateString();
  }

  // Mark conversation as read
  function markConversationAsRead(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      renderConversations();
    }
  }

  // Auto-resize textarea
  function autoResizeTextarea(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  // Send message
  function sendMessage() {
    const messageInput = $('#messageInput');
    if (!messageInput) return;
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    // Add message to current conversation
    if (!messages[currentConversationId]) {
      messages[currentConversationId] = [];
    }
    
    const newMessage = {
      id: Date.now(),
      senderId: 'me',
      senderName: 'You',
      content: content,
      timestamp: new Date(),
      type: 'sent'
    };
    
    messages[currentConversationId].push(newMessage);
    
    // Update conversation last message
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (conversation) {
      conversation.lastMessage = content;
      conversation.lastMessageTime = 'Just now';
    }
    
    // Clear input and re-render
    messageInput.value = '';
    messageInput.style.height = 'auto';
    renderMessages(messages[currentConversationId]);
    renderConversations();
    
    // Simulate typing indicator and response (for demo)
    simulateTypingAndResponse();
    
    // Show toast
    toast('Message sent', 'success');
  }

  // Simulate typing indicator and response
  function simulateTypingAndResponse() {
    const typingIndicator = $('#typingIndicator');
    if (typingIndicator) {
      typingIndicator.hidden = false;
      
      setTimeout(() => {
        typingIndicator.hidden = true;
        
        // Add mock response
        const responses = [
          'Thank you for the information!',
          'I understand, let me get back to you on this.',
          'That sounds great, I appreciate your help.',
          'Could you provide more details about this?'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage = {
          id: Date.now(),
          senderId: currentConversationId,
          senderName: conversations.find(c => c.id === currentConversationId)?.name || 'User',
          content: randomResponse,
          timestamp: new Date(),
          type: 'received'
        };
        
        messages[currentConversationId].push(responseMessage);
        renderMessages(messages[currentConversationId]);
        
        // Update conversation
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation) {
          conversation.lastMessage = randomResponse;
          conversation.lastMessageTime = 'Just now';
          conversation.unreadCount = 1;
        }
        renderConversations();
        
      }, 2000);
    }
  }

  // Filter conversations
  function filterConversations(filter) {
    currentFilter = filter;
    
    switch (filter) {
      case 'unread':
        filteredConversations = conversations.filter(c => c.unreadCount > 0);
        break;
      case 'students':
        filteredConversations = conversations.filter(c => c.type === 'student');
        break;
      case 'staff':
        filteredConversations = conversations.filter(c => c.type === 'staff');
        break;
      default:
        filteredConversations = [...conversations];
    }
    
    renderConversations();
  }

  // Search conversations
  function searchConversations(query) {
    if (!query.trim()) {
      filteredConversations = [...conversations];
    } else {
      const searchQuery = query.toLowerCase();
      filteredConversations = conversations.filter(conv => 
        conv.name.toLowerCase().includes(searchQuery) ||
        conv.email.toLowerCase().includes(searchQuery) ||
        conv.lastMessage.toLowerCase().includes(searchQuery)
      );
    }
    renderConversations();
  }

  // Compose new message
  function openComposeModal() {
    const modal = $('#composeModal');
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Focus on recipients input
      setTimeout(() => {
        const recipientsInput = $('#recipients');
        if (recipientsInput) recipientsInput.focus();
      }, 100);
    }
  }

  // Close compose modal
  function closeComposeModal() {
    const modal = $('#composeModal');
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      // Reset form
      const form = $('#composeForm');
      if (form) form.reset();
    }
  }

  // Bind all event listeners
  function bindEvents() {
    // Conversation selection
    const conversationList = $('#conversationList');
    if (conversationList) {
      conversationList.addEventListener('click', (e) => {
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
          const conversationId = parseInt(conversationItem.getAttribute('data-id'));
          
          // Update active state
          $$('.conversation-item').forEach(item => 
            item.classList.remove('conversation-item--active')
          );
          conversationItem.classList.add('conversation-item--active');
          
          // Load conversation
          loadConversation(conversationId);
        }
      });
    }

    // Filter tabs
    $$('.filter-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        $$('.filter-tab').forEach(t => t.classList.remove('filter-tab--active'));
        this.classList.add('filter-tab--active');
        filterConversations(this.getAttribute('data-filter'));
      });
    });

    // Search
    const messageSearch = $('#messageSearch');
    if (messageSearch) {
      messageSearch.addEventListener('input', (e) => {
        searchConversations(e.target.value);
      });
    }

    // Send message
    const sendButton = $('#sendMessage');
    if (sendButton) {
      sendButton.addEventListener('click', sendMessage);
    }

    // Send message with Enter key
    const messageInput = $('#messageInput');
    if (messageInput) {
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Compose message
    const composeButton = $('#composeMessage');
    if (composeButton) {
      composeButton.addEventListener('click', openComposeModal);
    }

    // Modal close handlers
    $$('[data-close="composeModal"]').forEach(btn => {
      btn.addEventListener('click', closeComposeModal);
    });

    // View application button
    const viewApplicationBtn = $('#viewApplication');
    if (viewApplicationBtn) {
      viewApplicationBtn.addEventListener('click', () => {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation && conversation.applicationId) {
          toast(`Opening application ${conversation.applicationId}...`, 'info');
          // In a real app, this would navigate to the application details
        }
      });
    }

    // Mark all messages as read
    const markAllReadBtn = $('#markAllMessagesRead');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        conversations.forEach(conv => conv.unreadCount = 0);
        renderConversations();
        toast('All messages marked as read', 'success');
      });
    }

    // Compose modal form submission
    const sendMessageModal = $('#sendMessageModal');
    if (sendMessageModal) {
      sendMessageModal.addEventListener('click', () => {
        const subject = $('#subject')?.value;
        const messageBody = $('#messageBody')?.value;
        
        if (subject && messageBody) {
          toast('Message sent successfully', 'success');
          closeComposeModal();
        } else {
          toast('Please fill in all required fields', 'warning');
        }
      });
    }
  }

  // Toast function (assuming it's available from main.js)
  function toast(message, type = 'info') {
    if (window.toast) {
      window.toast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();