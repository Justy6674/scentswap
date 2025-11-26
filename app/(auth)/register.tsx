import { Image } from 'react-native';
import { ThemeSelector } from '@/components/ThemeSelector';

// ... imports

export default function RegisterScreen() {
  // ... existing code

  const styles = StyleSheet.create({
    // ... existing styles
    logoContainer: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    // ...
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* ... */}
      <KeyboardAvoidingView ...>
      <ScrollView ...>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-nobg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Australia's fragrance swap community</Text>
      </View>

      <View style={styles.form}>
        <ThemeSelector />
        {/* ... inputs */}

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          leftIcon="person-outline"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          error={errors.fullName}
        />
        <Input
          label="Email"
          placeholder="Enter your email"
          leftIcon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />
        <Input
          label="Password"
          placeholder="Create a password"
          leftIcon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          leftIcon="lock-closed-outline"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
      </KeyboardAvoidingView >
    </SafeAreaView >
  );
}
