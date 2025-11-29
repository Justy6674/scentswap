/**
 * ScentBot Component
 * 
 * AI Mediator chat interface for swap discussions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';

// SSR-safe platform check
const isWeb = typeof window !== 'undefined';
import { Ionicons } from '@expo/vector-icons';
import { getMediatorResponse, MediatorResponse } from '@/lib/ai-services';
import { Colors } from '@/constants/Colors';
import { Listing } from '@/types';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  type?: MediatorResponse['type'];
  timestamp: Date;
}

interface ScentBotProps {
  swapId?: string;
  listings?: Listing[];
  fairnessScore?: number;
  onClose?: () => void;
  embedded?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Is this fair?', icon: 'scale-outline' as const },
  { label: 'Value estimate', icon: 'pricetag-outline' as const },
  { label: 'Authenticity tips', icon: 'shield-checkmark-outline' as const },
  { label: 'Shipping advice', icon: 'cube-outline' as const },
];

export function ScentBot({ 
  swapId, 
  listings, 
  fairnessScore,
  onClose,
  embedded = false 
}: ScentBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "G'day! I'm ScentBot, your AI swap assistant. 🤖\n\nI can help you with:\n• Checking if a trade is fair\n• Estimating fragrance values\n• Authenticity tips\n• Shipping advice\n\nJust ask or tap a quick action below!",
      isBot: true,
      type: 'info',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get AI response
      const response = await getMediatorResponse(messageText, {
        swapId,
        fairnessScore,
        listings: listings,
        listing: listings?.[0],
      });

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isBot: true,
        type: response.type,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process that. Please try again.",
        isBot: true,
        type: 'warning',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const getMessageStyle = (type?: MediatorResponse['type']) => {
    switch (type) {
      case 'warning':
        return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
      case 'fairness':
        return { backgroundColor: '#D1FAE5', borderColor: '#10B981' };
      case 'suggestion':
        return { backgroundColor: '#E0E7FF', borderColor: '#6366F1' };
      default:
        return { backgroundColor: '#F0FDFA', borderColor: Colors.light.primary };
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, embedded && styles.embeddedContainer]}
      behavior={isWeb ? 'height' : 'padding'}
    >
      {/* Header */}
      {!embedded && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🤖</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>ScentBot</Text>
              <Text style={styles.headerSubtitle}>AI Swap Assistant</Text>
            </View>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.isBot ? styles.botMessageRow : styles.userMessageRow,
            ]}
          >
            {message.isBot && (
              <View style={styles.messageBotAvatar}>
                <Text>🤖</Text>
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.isBot
                  ? [styles.botBubble, getMessageStyle(message.type)]
                  : styles.userBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isBot ? styles.botMessageText : styles.userMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <View style={[styles.messageRow, styles.botMessageRow]}>
            <View style={styles.messageBotAvatar}>
              <Text>🤖</Text>
            </View>
            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.typingText}>ScentBot is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsContainer}
        contentContainerStyle={styles.quickActionsContent}
      >
        {QUICK_ACTIONS.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickAction}
            onPress={() => handleSend(action.label)}
          >
            <Ionicons name={action.icon} size={16} color={Colors.light.primary} />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask ScentBot anything..."
          placeholderTextColor={Colors.light.textSecondary}
          multiline
          maxLength={500}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !input.trim() && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!input.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={input.trim() ? '#FFFFFF' : Colors.light.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  embeddedContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.primary + '10',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  messageBotAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botMessageText: {
    color: Colors.light.text,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderColor: Colors.light.primary,
  },
  typingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  quickActionsContent: {
    padding: 8,
    gap: 8,
    flexDirection: 'row',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
});

