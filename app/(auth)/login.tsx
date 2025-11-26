import { Image } from 'react-native';
// ... imports

export default function LoginScreen() {
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue swapping</Text>
      </View>
      {/* ... */}


      <View style={styles.form}>
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
          placeholder="Enter your password"
          leftIcon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
      </KeyboardAvoidingView >
    </SafeAreaView >
  );
}
