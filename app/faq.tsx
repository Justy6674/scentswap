import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

// SSR-safe platform check
const isWeb = typeof window !== 'undefined';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GlobalHeader } from '@/components/GlobalHeader';
import { GlobalFooter } from '@/components/GlobalFooter';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Deterministic pseudo-random values based on index to prevent hydration mismatch
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const SprayParticle = ({ index }: { index: number }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 800 + pseudoRandom(index) * 400,
      useNativeDriver: !isWeb,
      delay: pseudoRandom(index + 100) * 100,
    }).start();
  }, []);

  // Trajectory: Spray downwards and outwards
  const angle = 45 + (index * 15) + (pseudoRandom(index) * 20); 
  const distance = 40 + pseudoRandom(index + 50) * 60;
  const radians = (angle * Math.PI) / 180;
  
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(radians) * distance], // Move right
  });
  
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(radians) * distance], // Move down
  });
  
  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 0.8, 0.4, 0],
  });
  
  const scale = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 1.2, 0],
  });

  const isTeal = index % 2 === 0;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 15, 
        left: 15, // Start from top-left of answer area
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: isTeal ? '#5BBFBA' : '#E8927C',
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
};

const SprayBurst = ({ active }: { active: boolean }) => {
  if (!active) return null;
  // Generate 15 particles
  const particles = Array.from({ length: 15 }, (_, i) => i);
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((i) => (
        <SprayParticle key={i} index={i} />
      ))}
    </View>
  );
};

const FAQ_DATA = [
  {
    category: 'How It Works',
    items: [
      {
        question: 'How does ScentSwap work?',
        answer: 'ScentSwap connects fragrance enthusiasts to trade bottles they no longer use. List your fragrance, find a match, propose a swap, and once accepted, ship your item. Our AI ensures fair value exchanges and provides authenticity tips.'
      },
      {
        question: 'Is money involved?',
        answer: 'No. ScentSwap is a pure bartering platform. You trade fragrance for fragrance. The only cost is your subscription fee and shipping your item.'
      },
      {
        question: 'What is the Fairness Score?',
        answer: 'Our AI Fairness Engine analyzes the market value, fill level, and condition of items in a proposed swap. It gives a score (0-100%) to help you judge if a trade is equitable.'
      }
    ]
  },
  {
    category: 'Trust & Safety',
    items: [
      {
        question: 'How do I know a fragrance is authentic?',
        answer: 'We use AI-powered image analysis to flag potential authenticity issues (batch codes, bottle shape, etc.). We also have a Trust Tier system: Verified and Elite users have undergone identity or reputation checks.'
      },
      {
        question: 'What if the other person doesn\'t ship?',
        answer: 'We recommend swapping with Verified/Elite users. Use our tracking system to monitor shipments. If a swap goes wrong, our Admin Dispute Resolution team can investigate and ban bad actors.'
      }
    ]
  },
  {
    category: 'Shipping',
    items: [
      {
        question: 'Who pays for shipping?',
        answer: 'Each swapper pays to ship their own item. We recommend using tracked shipping (Australia Post) to ensure delivery.'
      },
      {
        question: 'How should I pack a bottle?',
        answer: 'Secure the cap with tape (optional but recommended for decants), wrap generously in bubble wrap, and use a rigid box. Do not let the bottle rattle inside.'
      }
    ]
  },
  {
    category: 'Account & Billing',
    items: [
      {
        question: 'Can I cancel my subscription?',
        answer: 'Yes, anytime. Go to Profile > Manage Subscription to access your billing portal. Your access continues until the end of the billing period.'
      },
      {
        question: 'What are the different tiers?',
        answer: 'Free (5 listings), Premium (25 listings, AI checks, Priority matching), and Elite (Unlimited listings, advanced analytics, verified badge).'
      }
    ]
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showSpray, setShowSpray] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const toggleExpand = () => {
    const initialValue = expanded ? 1 : 0;
    const finalValue = expanded ? 0 : 1;

    if (!expanded) {
      setShowSpray(true);
    } else {
      setShowSpray(false);
    }

    setExpanded(!expanded);

    Animated.spring(animation, {
      toValue: finalValue,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  };

  // Interpolate height/opacity
  const rotateArrow = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Fade text in slightly delayed to let spray clear the air
  const textOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.itemContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.questionContainer} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.questionText, { color: colors.text }]}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateArrow }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      
      {expanded && (
        <Animated.View 
          style={[
            styles.answerContainer,
            {
              // Use animation for height implicitly via layout animation or keep it simple with transform
              transform: [
                { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }
              ]
            }
          ]}
        >
          {showSpray && (
            <View style={{position: 'absolute', top: 0, left: 0, zIndex: 10}}>
              <SprayBurst active={true} />
            </View>
          )}
          
          <Animated.Text 
            style={[
              styles.answerText, 
              { color: colors.textSecondary, opacity: textOpacity, paddingLeft: 12 } // Add padding for visual balance
            ]}
          >
            {answer}
          </Animated.Text>
        </Animated.View>
      )}
    </View>
  );
}

export default function FAQScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isLoading: authLoading } = useSubscription();

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          {/* Minimal loader to match server HTML structure as closely as possible */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Global Header */}
      <GlobalHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.primary }]}>Common Questions</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Everything you need to know about ScentSwap
          </Text>
        </View>

        {FAQ_DATA.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.category}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item, i) => (
                <FAQItem key={i} question={item.question} answer={item.answer} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Still need help?
          </Text>
          <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Global Footer */}
        <GlobalFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 0,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionItems: {
    gap: 12,
  },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    itemContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 16,
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  sprayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5BBFBA', // Teal
    marginTop: 8,
    marginRight: 12,
    opacity: 0.6,
  },
  contactSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8E4E0',
  },
  footerText: {
    fontSize: 14,
    marginBottom: 16,
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

