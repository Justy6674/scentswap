/**
 * AI Assistant Chat Component
 * Conversational interface for fragrance consultation and recommendations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../app/contexts/AuthContext';
import { AIAssistant, AIMessage, AIConversation } from '../lib/aiAssistant';
import { Ionicons } from '@expo/vector-icons';

interface AIAssistantChatProps {
  style?: any;
  initialMessage?: string;
  onFragranceRecommendation?: (fragrance: any) => void;
}

export default function AIAssistantChat({
  style,
  initialMessage,
  onFragranceRecommendation
}: AIAssistantChatProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiAssistant] = useState(() => new AIAssistant());
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeConversation();
  }, [user]);

  useEffect(() => {
    if (initialMessage && conversation) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, conversation]);

  const initializeConversation = async () => {
    if (!user?.email) return;

    try {
      const newConversation = await aiAssistant.startConversation(user.email);
      setConversation(newConversation);

      // Send welcome message
      const welcomeResponse = await aiAssistant.processMessage(
        newConversation.id,
        "Hello! I'm your personal fragrance consultant. I can help you discover new scents, find the perfect fragrance for any occasion, and answer questions about your fragrance journey. What would you like to explore today?"
      );

      setConversation(welcomeResponse.conversation);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      Alert.alert('Error', 'Failed to start AI assistant. Please try again.');
    }
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputText.trim();
    if (!messageText || !conversation || isTyping) return;

    setInputText('');
    setIsTyping(true);

    try {
      // Add user message to conversation
      const userMessage: AIMessage = {
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        metadata: {}
      };

      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : null);

      // Get AI response
      const response = await aiAssistant.processMessage(conversation.id, messageText);

      setConversation(response.conversation);

      // Handle fragrance recommendations
      if (response.recommendations && response.recommendations.length > 0) {
        response.recommendations.forEach(rec => {
          if (onFragranceRecommendation) {
            onFragranceRecommendation(rec);
          }
        });
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const quickMessages = {
      recommend: "Can you recommend a fragrance for me?",
      occasion: "What's a good fragrance for a special occasion?",
      budget: "I'm looking for something under $150. What do you suggest?",
      season: "What fragrances work well for this season?",
      profile: "Help me understand my fragrance preferences"
    };

    const message = quickMessages[action as keyof typeof quickMessages];
    if (message) {
      handleSendMessage(message);
    }
  };

  const renderMessage = (message: AIMessage, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    if (isSystem) return null;

    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage
        ]}
      >
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          {!isUser && (
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={16} color="#b68a71" />
            </View>
          )}

          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.aiText
          ]}>
            {message.content}
          </Text>

          <Text style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.aiTimestamp
          ]}>
            {message.timestamp.toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessage]}>
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={16} color="#b68a71" />
          </View>
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#b68a71" />
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!conversation) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#b68a71" />
        <Text style={styles.loadingText}>Starting AI Assistant...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={24} color="#b68a71" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AI Fragrance Consultant</Text>
          <Text style={styles.headerSubtitle}>
            Personalised scent discovery and advice
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      {conversation.messages.length <= 2 && (
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>How can I help you today?</Text>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('recommend')}
            >
              <Ionicons name="heart" size={16} color="#f8fafc" />
              <Text style={styles.quickActionText}>Recommend</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('occasion')}
            >
              <Ionicons name="calendar" size={16} color="#f8fafc" />
              <Text style={styles.quickActionText}>Occasion</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('budget')}
            >
              <Ionicons name="cash" size={16} color="#f8fafc" />
              <Text style={styles.quickActionText}>Budget</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('season')}
            >
              <Ionicons name="sunny" size={16} color="#f8fafc" />
              <Text style={styles.quickActionText}>Season</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.messages.map(renderMessage)}
        {renderTypingIndicator()}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about fragrances, get recommendations..."
            placeholderTextColor="#cbd5e1"
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isTyping) && styles.sendButtonDisabled
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isTyping ? "#f8fafc" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334155',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b68a71',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  quickActions: {
    padding: 20,
    paddingBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 12,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#b68a71',
  },
  aiBubble: {
    backgroundColor: '#475569',
    paddingLeft: 16,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  aiIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(182, 138, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  userText: {
    color: '#f8fafc',
  },
  aiText: {
    color: '#f8fafc',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  userTimestamp: {
    color: 'rgba(248, 250, 252, 0.7)',
  },
  aiTimestamp: {
    color: '#cbd5e1',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontStyle: 'italic',
    fontFamily: 'Inter',
  },
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#334155',
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#475569',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    color: '#f8fafc',
    fontSize: 15,
    maxHeight: 100,
    fontFamily: 'Inter',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#b68a71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#64748b',
  },
});