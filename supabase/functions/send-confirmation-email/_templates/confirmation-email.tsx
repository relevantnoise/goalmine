import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ConfirmationEmailProps {
  confirmationUrl: string;
  token: string;
  userEmail: string;
}

export const ConfirmationEmail = ({
  confirmationUrl,
  token,
  userEmail,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to GoalMine.ai - Please confirm your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🎯 Welcome to GoalMine.ai!</Heading>
          <Text style={subtitle}>
            Turn Your Dreams Into Action
          </Text>
        </Section>

        <Section style={content}>
          <Text style={text}>
            Hi there! 👋
          </Text>
          <Text style={text}>
            Welcome to GoalMine.ai! We're excited to help you achieve your goals with personalized motivation and actionable daily plans.
          </Text>
          <Text style={text}>
            To get started, please confirm your email address by clicking the button below:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Confirm Your Account
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={link}>
            {confirmationUrl}
          </Text>
        </Section>

        <Section style={features}>
          <Text style={featuresTitle}>What's waiting for you:</Text>
          <Text style={featureItem}>✨ AI-powered daily motivation</Text>
          <Text style={featureItem}>🎯 Personalized micro-plans</Text>
          <Text style={featureItem}>🔥 Streak tracking</Text>
          <Text style={featureItem}>📧 Daily motivational emails</Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
          <Text style={footerText}>
            GoalMine.ai - Turning dreams into achievements, one day at a time.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const header = {
  padding: '32px 24px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e2e8f0',
};

const h1 = {
  color: '#6c47ff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  lineHeight: '1.2',
};

const subtitle = {
  color: '#64748b',
  fontSize: '16px',
  margin: '0',
  lineHeight: '1.5',
};

const content = {
  padding: '32px 24px',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#6c47ff',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  lineHeight: '1.4',
};

const link = {
  color: '#6c47ff',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px',
};

const code = {
  color: '#6c47ff',
  fontSize: '16px',
  fontFamily: 'monospace',
};

const features = {
  backgroundColor: '#f8fafc',
  padding: '24px',
  margin: '0 24px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
};

const featuresTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const featureItem = {
  color: '#475569',
  fontSize: '14px',
  margin: '0 0 8px',
  lineHeight: '1.5',
};

const footer = {
  padding: '24px',
  borderTop: '1px solid #e2e8f0',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};