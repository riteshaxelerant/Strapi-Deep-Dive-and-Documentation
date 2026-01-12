import { useState, useEffect } from 'react';
import { Main, Box, Button, TextInput, Typography, Grid, Flex, Alert } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

import { getTranslation } from '../utils/getTranslation';
import { PLUGIN_ID } from '../pluginId';

interface ConfigResponse {
  stripeKey: string | null;
}

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get, put } = useFetchClient();
  const { toggleNotification } = useNotification();

  // Form state
  const [stripeKey, setStripeKey] = useState<string>('');
  const [initialKey, setInitialKey] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Load current configuration on component mount
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch current configuration
        const { data } = await get(`/${PLUGIN_ID}/config`);
        const configData = data as ConfigResponse;

        // Set initial and current values
        if (configData.stripeKey) {
          setStripeKey(configData.stripeKey);
          setInitialKey(configData.stripeKey);
        }
      } catch (err: any) {
        // Handle error
        const errorMessage =
          err?.response?.data?.error?.message ||
          formatMessage({
            id: getTranslation('config.load.error'),
            defaultMessage: 'Failed to load configuration',
          });
        setError(errorMessage);
        toggleNotification({
          type: 'warning',
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [get, formatMessage, toggleNotification]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!stripeKey || stripeKey.trim() === '') {
      const errorMessage = formatMessage({
        id: getTranslation('config.validation.required'),
        defaultMessage: 'Stripe key is required',
      });
      setError(errorMessage);
      toggleNotification({
        type: 'warning',
        message: errorMessage,
      });
      return;
    }

    // Optional: Validate Stripe key format
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      const errorMessage = formatMessage({
        id: getTranslation('config.validation.format'),
        defaultMessage: 'Stripe key should start with sk_test_ or sk_live_',
      });
      setError(errorMessage);
      toggleNotification({
        type: 'warning',
        message: errorMessage,
      });
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Save configuration
      await put(`/${PLUGIN_ID}/config`, {
        stripeKey: stripeKey.trim(),
      });

      // Update initial key to reflect saved value
      setInitialKey(stripeKey.trim());

      // Show success notification
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: getTranslation('config.save.success'),
          defaultMessage: 'Stripe key saved successfully',
        }),
      });
    } catch (err: any) {
      // Handle error
      const errorMessage =
        err?.response?.data?.error?.message ||
        formatMessage({
          id: getTranslation('config.save.error'),
          defaultMessage: 'Failed to save configuration',
        });
      setError(errorMessage);
      toggleNotification({
        type: 'warning',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Check if form has unsaved changes
   */
  const hasUnsavedChanges = stripeKey !== (initialKey || '');

  return (
    <Main>
      <Box padding={8}>
        {/* Header */}
        <Box paddingBottom={6}>
          <Typography variant="alpha" as="h1">
            {formatMessage({
              id: getTranslation('config.title'),
              defaultMessage: 'Stripe Configuration',
            })}
          </Typography>
          <Typography variant="omega" textColor="neutral600" as="p">
            {formatMessage({
              id: getTranslation('config.description'),
              defaultMessage:
                'Configure your Stripe API key. Only super administrators can access this page.',
            })}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Box paddingBottom={4}>
            <Alert closeLabel="Close" title="Error" variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Configuration Form */}
        <Box background="neutral0" hasRadius padding={8} shadow="tableShadow">
          <form onSubmit={handleSubmit}>
            <Grid.Root gap={4}>
              {/* Stripe Key Input */}
              <Grid.Item xs={12} col={12}>
                <TextInput
                  label={formatMessage({
                    id: getTranslation('config.key.label'),
                    defaultMessage: 'Stripe API Key',
                  })}
                  name="stripeKey"
                  value={stripeKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStripeKey(e.target.value);
                    setError(null); // Clear error when user types
                  }}
                  placeholder={formatMessage({
                    id: getTranslation('config.key.placeholder'),
                    defaultMessage: 'Enter your Stripe API key (e.g., sk_test_...)',
                  })}
                  hint={formatMessage({
                    id: getTranslation('config.key.hint'),
                    defaultMessage:
                      'Your Stripe API key starts with sk_test_ for test mode or sk_live_ for live mode',
                  })}
                  disabled={isLoading || isSaving}
                  error={error || undefined}
                  type="text"
                  required
                />
              </Grid.Item>

              {/* Current Configuration Display (if key exists) */}
              {initialKey && !isLoading && (
                <Grid.Item xs={12} col={12}>
                  <Box background="neutral100" hasRadius padding={4}>
                    <Typography variant="pi" fontWeight="semiBold" as="p">
                      {formatMessage({
                        id: getTranslation('config.current.label'),
                        defaultMessage: 'Current Configuration:',
                      })}
                    </Typography>
                    <Typography variant="pi" textColor="neutral600" as="p">
                      {initialKey.substring(0, 12)}...{initialKey.substring(initialKey.length - 4)}
                    </Typography>
                  </Box>
                </Grid.Item>
              )}

              {/* Save Button */}
              <Grid.Item xs={12} col={12}>
                <Flex justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="default"
                    loading={isSaving}
                    disabled={isLoading || isSaving || !hasUnsavedChanges}
                  >
                    {formatMessage({
                      id: getTranslation('config.save.button'),
                      defaultMessage: 'Save Configuration',
                    })}
                  </Button>
                </Flex>
              </Grid.Item>
            </Grid.Root>
          </form>
        </Box>
      </Box>
    </Main>
  );
};

export { HomePage };
